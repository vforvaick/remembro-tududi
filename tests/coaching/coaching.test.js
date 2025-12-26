const CoachingService = require('../../src/coaching');

describe('CoachingService', () => {
    let coaching;
    let mockBot;

    beforeEach(() => {
        mockBot = {
            sendMessageToUser: jest.fn()
        };
        coaching = new CoachingService({
            bot: mockBot,
            idleThresholdHours: 4
        });
    });

    describe('recordInteraction', () => {
        it('should record user interaction time', () => {
            coaching.recordInteraction(123);

            const status = coaching.getStatus(123);
            expect(status.recorded).toBe(true);
            expect(status.idleMinutes).toBeLessThan(1);
        });

        it('should clear notification flag when user interacts', () => {
            coaching.notifiedToday.add('123');
            coaching.recordInteraction(123);

            expect(coaching.notifiedToday.has('123')).toBe(false);
        });
    });

    describe('getStatus', () => {
        it('should return recorded=false for unknown user', () => {
            const status = coaching.getStatus(999);
            expect(status.recorded).toBe(false);
        });

        it('should return idle hours for known user', () => {
            // Set a past timestamp (5 hours ago)
            coaching.lastInteraction.set('123', Date.now() - (5 * 60 * 60 * 1000));

            const status = coaching.getStatus(123);
            expect(status.recorded).toBe(true);
            expect(status.idleHours).toBeGreaterThanOrEqual(4);
        });
    });

    describe('resetDailyFlags', () => {
        it('should clear all notification flags', () => {
            coaching.notifiedToday.add('123');
            coaching.notifiedToday.add('456');

            coaching.resetDailyFlags();

            expect(coaching.notifiedToday.size).toBe(0);
        });
    });
});
