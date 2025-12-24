const WeeklyReviewService = require('../../src/weekly-review');

describe('WeeklyReviewService', () => {
    let weeklyReview;
    let mockTududuClient;

    beforeEach(() => {
        mockTududuClient = {
            getTasks: jest.fn()
        };
        weeklyReview = new WeeklyReviewService({
            tududuClient: mockTududuClient
        });
    });

    describe('getCompletedTasks', () => {
        it('should filter tasks completed within date range', async () => {
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const twoWeeksAgo = new Date(today);
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

            mockTududuClient.getTasks.mockResolvedValue([
                { id: '1', name: 'Recent task', updated_at: yesterday.toISOString() },
                { id: '2', name: 'Old task', updated_at: twoWeeksAgo.toISOString() }
            ]);

            const completed = await weeklyReview.getCompletedTasks(7);
            expect(completed).toHaveLength(1);
            expect(completed[0].id).toBe('1');
        });
    });

    describe('calculateStats', () => {
        it('should return empty stats for no tasks', () => {
            const stats = weeklyReview.calculateStats([]);
            expect(stats.total).toBe(0);
            expect(stats.avgPerDay).toBe(0);
        });

        it('should count by priority', () => {
            const tasks = [
                { id: '1', priority: 'high', updated_at: new Date().toISOString() },
                { id: '2', priority: 'high', updated_at: new Date().toISOString() },
                { id: '3', priority: 'low', updated_at: new Date().toISOString() }
            ];

            const stats = weeklyReview.calculateStats(tasks);
            expect(stats.total).toBe(3);
            expect(stats.byPriority.high).toBe(2);
            expect(stats.byPriority.low).toBe(1);
        });

        it('should find busiest day', () => {
            const monday = new Date('2025-12-22'); // Monday
            const tuesday = new Date('2025-12-23'); // Tuesday

            const tasks = [
                { id: '1', updated_at: monday.toISOString() },
                { id: '2', updated_at: monday.toISOString() },
                { id: '3', updated_at: tuesday.toISOString() }
            ];

            const stats = weeklyReview.calculateStats(tasks);
            expect(stats.busiestDay).toBe('Monday');
            expect(stats.busiestDayCount).toBe(2);
        });
    });

    describe('formatReviewMessage', () => {
        it('should show no tasks message when empty', () => {
            const stats = weeklyReview.calculateStats([]);
            const message = weeklyReview.formatReviewMessage(stats, []);
            expect(message).toContain('No tasks completed');
        });

        it('should include stats in message', () => {
            const tasks = [
                { id: '1', name: 'Test task', priority: 'high', updated_at: new Date().toISOString() }
            ];
            const stats = weeklyReview.calculateStats(tasks);
            const message = weeklyReview.formatReviewMessage(stats, tasks);

            expect(message).toContain('1 tasks completed');
            expect(message).toContain('High: 1');
        });
    });
});
