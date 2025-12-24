const ReschedulingService = require('../../src/rescheduling');

describe('ReschedulingService', () => {
    let rescheduler;
    let mockTududuClient;
    let mockBot;

    beforeEach(() => {
        mockTududuClient = {
            getTasks: jest.fn(),
            updateTask: jest.fn()
        };
        mockBot = {
            sendMessage: jest.fn()
        };
        rescheduler = new ReschedulingService({
            tududuClient: mockTududuClient,
            bot: mockBot
        });
    });

    describe('getOverdueTasks', () => {
        it('should return only overdue tasks', async () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);

            mockTududuClient.getTasks.mockResolvedValue([
                { id: '1', name: 'Overdue task', due_date: yesterday.toISOString().split('T')[0] },
                { id: '2', name: 'Future task', due_date: tomorrow.toISOString().split('T')[0] },
                { id: '3', name: 'No due date task', due_date: null }
            ]);

            const overdue = await rescheduler.getOverdueTasks();

            expect(overdue).toHaveLength(1);
            expect(overdue[0].id).toBe('1');
        });

        it('should return empty array when no overdue tasks', async () => {
            mockTududuClient.getTasks.mockResolvedValue([
                { id: '1', name: 'Future task', due_date: '2099-12-31' }
            ]);

            const overdue = await rescheduler.getOverdueTasks();
            expect(overdue).toHaveLength(0);
        });
    });

    describe('suggestReschedule', () => {
        it('should suggest today for urgent tasks', () => {
            const task = { id: '1', name: 'Urgent', priority: 'urgent', due_date: '2020-01-01' };
            const suggestion = rescheduler.suggestReschedule(task);

            const today = new Date().toISOString().split('T')[0];
            expect(suggestion.suggestedDate).toBe(today);
            expect(suggestion.reason).toContain('today');
        });

        it('should suggest tomorrow for high priority tasks', () => {
            const task = { id: '1', name: 'High', priority: 'high', due_date: '2020-01-01' };
            const suggestion = rescheduler.suggestReschedule(task);

            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            expect(suggestion.suggestedDate).toBe(tomorrow.toISOString().split('T')[0]);
        });

        it('should suggest 3 days for medium priority tasks', () => {
            const task = { id: '1', name: 'Medium', priority: 'medium', due_date: '2020-01-01' };
            const suggestion = rescheduler.suggestReschedule(task);

            const threeDays = new Date();
            threeDays.setDate(threeDays.getDate() + 3);
            expect(suggestion.suggestedDate).toBe(threeDays.toISOString().split('T')[0]);
        });

        it('should suggest next week for low priority tasks', () => {
            const task = { id: '1', name: 'Low', priority: 'low', due_date: '2020-01-01' };
            const suggestion = rescheduler.suggestReschedule(task);

            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            expect(suggestion.suggestedDate).toBe(nextWeek.toISOString().split('T')[0]);
        });
    });

    describe('applyReschedule', () => {
        it('should update task with new due date', async () => {
            mockTududuClient.updateTask.mockResolvedValue({ id: '1', due_date: '2025-12-25' });

            await rescheduler.applyReschedule('1', '2025-12-25');

            expect(mockTududuClient.updateTask).toHaveBeenCalledWith('1', { due_date: '2025-12-25' });
        });
    });

    describe('formatOverdueMessage', () => {
        it('should return success message when no overdue', () => {
            const message = rescheduler.formatOverdueMessage([]);
            expect(message).toContain('No overdue tasks');
        });

        it('should format overdue tasks with suggestions', () => {
            const overdue = [{
                id: '1',
                name: 'Test task',
                suggestion: {
                    taskName: 'Test task',
                    originalDueDate: '2020-01-01',
                    suggestedDate: '2025-12-25',
                    reason: 'High priority'
                }
            }];

            const message = rescheduler.formatOverdueMessage(overdue);
            expect(message).toContain('1 Overdue Task');
            expect(message).toContain('Test task');
        });
    });

    describe('buildRescheduleKeyboard', () => {
        it('should create keyboard with task buttons', () => {
            const overdue = [{
                id: '1',
                suggestion: {
                    taskName: 'Test task',
                    suggestedDate: '2025-12-25'
                }
            }];

            const keyboard = rescheduler.buildRescheduleKeyboard(overdue);
            expect(keyboard.inline_keyboard).toHaveLength(2); // task + dismiss
            expect(keyboard.inline_keyboard[0][0].callback_data).toContain('reschedule:1');
        });

        it('should include reschedule all button for multiple tasks', () => {
            const overdue = [
                { id: '1', suggestion: { taskName: 'Task 1', suggestedDate: '2025-12-25' } },
                { id: '2', suggestion: { taskName: 'Task 2', suggestedDate: '2025-12-26' } }
            ];

            const keyboard = rescheduler.buildRescheduleKeyboard(overdue);
            const lastRow = keyboard.inline_keyboard[keyboard.inline_keyboard.length - 1];
            expect(lastRow.some(btn => btn.callback_data === 'reschedule:all')).toBe(true);
        });
    });
});
