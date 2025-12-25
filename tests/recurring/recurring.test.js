const RecurringService = require('../../src/recurring');
const fs = require('fs').promises;
const path = require('path');

describe('RecurringService', () => {
    let recurringService;
    let mockTududiClient;
    const testStoragePath = '.cache/test-recurring.json';

    beforeEach(async () => {
        mockTududiClient = {
            createTask: jest.fn().mockResolvedValue({ id: 'new-123', name: 'Test Task', due_date: '2025-12-25' })
        };
        recurringService = new RecurringService({
            tududiClient: mockTududiClient,
            storagePath: testStoragePath
        });

        // Initialize service to ensure cache directory exists
        await recurringService.initialize();

        // Clean up test file and reset patterns
        try {
            await fs.unlink(testStoragePath);
        } catch (e) {
            // Ignore if file doesn't exist
        }
        recurringService.patterns = new Map();
    });

    afterAll(async () => {
        try {
            await fs.unlink(testStoragePath);
        } catch (e) {
            // Ignore
        }
    });

    describe('parseRecurrence', () => {
        it('should parse daily patterns', () => {
            expect(recurringService.parseRecurrence('every day')).toEqual({ type: 'daily', interval: 1 });
            expect(recurringService.parseRecurrence('daily reminder')).toEqual({ type: 'daily', interval: 1 });
            expect(recurringService.parseRecurrence('setiap hari')).toEqual({ type: 'daily', interval: 1 });
        });

        it('should parse weekly patterns', () => {
            const result = recurringService.parseRecurrence('every week');
            expect(result.type).toBe('weekly');
            expect(result.interval).toBe(1);
        });

        it('should parse specific day of week', () => {
            expect(recurringService.parseRecurrence('every monday')).toEqual({ type: 'weekly', interval: 1, dayOfWeek: 1 });
            expect(recurringService.parseRecurrence('every friday')).toEqual({ type: 'weekly', interval: 1, dayOfWeek: 5 });
            expect(recurringService.parseRecurrence('every senin')).toEqual({ type: 'weekly', interval: 1, dayOfWeek: 1 });
        });

        it('should parse monthly patterns', () => {
            const result = recurringService.parseRecurrence('every month');
            expect(result.type).toBe('monthly');
            expect(result.interval).toBe(1);
        });

        it('should parse specific day of month', () => {
            expect(recurringService.parseRecurrence('every 15th')).toEqual({ type: 'monthly', interval: 1, dayOfMonth: 15 });
            expect(recurringService.parseRecurrence('every 1st of the month')).toEqual({ type: 'monthly', interval: 1, dayOfMonth: 1 });
        });

        it('should return null for non-recurring text', () => {
            expect(recurringService.parseRecurrence('buy groceries')).toBeNull();
            expect(recurringService.parseRecurrence('tomorrow')).toBeNull();
        });
    });

    describe('calculateNextDueDate', () => {
        it('should add days for daily pattern', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const next = recurringService.calculateNextDueDate({ type: 'daily', interval: 1 }, today);
            const expected = new Date(today);
            expected.setDate(expected.getDate() + 1);
            expect(next.getDate()).toBe(expected.getDate());
        });

        it('should find next occurrence for weekly pattern', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDay = (today.getDay() + 2) % 7; // 2 days ahead
            const next = recurringService.calculateNextDueDate({ type: 'weekly', interval: 1, dayOfWeek: targetDay }, today);
            expect(next.getDay()).toBe(targetDay);
            expect(next > today).toBe(true);
        });

        it('should add month for monthly pattern', () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const next = recurringService.calculateNextDueDate({ type: 'monthly', interval: 1, dayOfMonth: 15 }, today);
            expect(next.getMonth()).toBe((today.getMonth() + 1) % 12);
            expect(next.getDate()).toBe(15);
        });
    });

    describe('formatPattern', () => {
        it('should format daily pattern', () => {
            expect(recurringService.formatPattern({ type: 'daily', interval: 1 })).toBe('Every day');
        });

        it('should format weekly pattern with day', () => {
            expect(recurringService.formatPattern({ type: 'weekly', interval: 1, dayOfWeek: 1 })).toBe('Every Monday');
        });

        it('should format monthly pattern', () => {
            expect(recurringService.formatPattern({ type: 'monthly', interval: 1, dayOfMonth: 15 })).toBe('Every month on the 15th');
        });
    });

    describe('registerRecurring and getAll', () => {
        it('should register and retrieve recurring tasks', async () => {
            await recurringService.registerRecurring('task-1', { type: 'daily', interval: 1 }, { name: 'Test' });

            const all = recurringService.getAll();
            expect(all).toHaveLength(1);
            expect(all[0].taskId).toBe('task-1');
            expect(all[0].pattern.type).toBe('daily');
        });
    });

    describe('generateNextInstance', () => {
        it('should generate next instance when pattern exists', async () => {
            await recurringService.registerRecurring('task-1', { type: 'daily', interval: 1 }, { name: 'Test Task' });

            const next = await recurringService.generateNextInstance('task-1');

            expect(next).toBeTruthy();
            expect(mockTududiClient.createTask).toHaveBeenCalled();
        });

        it('should return null when no pattern exists', async () => {
            const next = await recurringService.generateNextInstance('nonexistent');
            expect(next).toBeNull();
        });
    });
});
