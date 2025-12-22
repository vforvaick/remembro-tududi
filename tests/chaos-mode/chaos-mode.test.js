const ChaosMode = require('../../src/chaos-mode');

describe('ChaosMode', () => {
    let chaosMode;

    beforeEach(() => {
        chaosMode = new ChaosMode();
    });

    describe('activate/deactivate', () => {
        test('activates chaos mode for a user', () => {
            chaosMode.activate(123);
            expect(chaosMode.isActiveFor(123)).toBe(true);
        });

        test('deactivates chaos mode for a user', () => {
            chaosMode.activate(123);
            chaosMode.deactivate(123);
            expect(chaosMode.isActiveFor(123)).toBe(false);
        });

        test('tracks different users independently', () => {
            chaosMode.activate(123);
            expect(chaosMode.isActiveFor(123)).toBe(true);
            expect(chaosMode.isActiveFor(456)).toBe(false);
        });
    });

    describe('getStatus', () => {
        test('returns inactive status for new user', () => {
            const status = chaosMode.getStatus(123);
            expect(status.isActive).toBe(false);
            expect(status.activatedAt).toBeNull();
            expect(status.duration).toBe(0);
        });

        test('returns active status with activation time', () => {
            chaosMode.activate(123);
            const status = chaosMode.getStatus(123);
            expect(status.isActive).toBe(true);
            expect(status.activatedAt).toBeInstanceOf(Date);
        });
    });

    describe('filterTasks', () => {
        const sampleTasks = [
            { name: 'Quick task', time_estimate: 10, priority: 'low' },
            { name: 'Long task', time_estimate: 60, priority: 'low' },
            { name: 'Urgent task', time_estimate: 45, priority: 'high' },
            { name: 'Normal task', time_estimate: 30, priority: 'medium' },
            { name: 'Critical task', time_estimate: 120, priority: 'critical' },
        ];

        test('returns all tasks when chaos mode is inactive', () => {
            const filtered = chaosMode.filterTasks(sampleTasks, 123);
            expect(filtered).toHaveLength(5);
        });

        test('filters to only quick and urgent tasks when active', () => {
            chaosMode.activate(123);
            const filtered = chaosMode.filterTasks(sampleTasks, 123);

            // Should include: Quick task (10m), Urgent task (high), Critical task (critical)
            expect(filtered).toHaveLength(3);
            expect(filtered.map(t => t.name)).toContain('Quick task');
            expect(filtered.map(t => t.name)).toContain('Urgent task');
            expect(filtered.map(t => t.name)).toContain('Critical task');
        });

        test('includes tasks due today', () => {
            const today = new Date().toISOString().split('T')[0];
            const tasksWithDueDate = [
                { name: 'Due today', time_estimate: 60, priority: 'low', due_date: today },
                { name: 'Not due', time_estimate: 60, priority: 'low', due_date: '2099-12-31' },
            ];

            chaosMode.activate(123);
            const filtered = chaosMode.filterTasks(tasksWithDueDate, 123);

            expect(filtered).toHaveLength(1);
            expect(filtered[0].name).toBe('Due today');
        });
    });

    describe('formatChaosModeMessage', () => {
        test('formats message for no tasks', () => {
            const message = chaosMode.formatChaosModeMessage([]);
            expect(message).toContain('Chaos Mode Activated');
            expect(message).toContain('No urgent tasks');
        });

        test('formats message with task list', () => {
            const tasks = [
                { name: 'Task 1', time_estimate: 10, priority: 'high' },
                { name: 'Task 2', time_estimate: 15, priority: 'low' },
            ];
            const message = chaosMode.formatChaosModeMessage(tasks);
            expect(message).toContain('Chaos Mode Activated');
            expect(message).toContain('Task 1');
            expect(message).toContain('Task 2');
        });

        test('limits to 5 tasks', () => {
            const tasks = Array(10).fill(null).map((_, i) => ({
                name: `Task ${i + 1}`,
                time_estimate: 10,
                priority: 'high'
            }));
            const message = chaosMode.formatChaosModeMessage(tasks);
            expect(message).toContain('Task 1');
            expect(message).toContain('Task 5');
            expect(message).not.toContain('Task 6');
        });
    });

    describe('formatNormalModeMessage', () => {
        test('formats message with duration', () => {
            const message = chaosMode.formatNormalModeMessage(30);
            expect(message).toContain('Normal Mode Restored');
            expect(message).toContain('30 minutes');
        });

        test('formats message without duration', () => {
            const message = chaosMode.formatNormalModeMessage(0);
            expect(message).toContain('Normal Mode Restored');
        });
    });
});
