const GoogleCalendarService = require('../../src/calendar/google-calendar');

describe('GoogleCalendarService', () => {
    describe('isConfigured', () => {
        it('should return false when not initialized', () => {
            const service = new GoogleCalendarService({});
            expect(service.isConfigured()).toBe(false);
        });
    });

    describe('formatEventTime', () => {
        let service;

        beforeEach(() => {
            service = new GoogleCalendarService({});
        });

        it('should format timed event', () => {
            const event = {
                start: { dateTime: '2025-12-24T10:00:00+07:00' },
                end: { dateTime: '2025-12-24T11:00:00+07:00' }
            };
            const time = service.formatEventTime(event);
            expect(time).toContain('-');
        });

        it('should format all-day event', () => {
            const event = {
                start: { date: '2025-12-24' },
                end: { date: '2025-12-25' }
            };
            const time = service.formatEventTime(event);
            expect(time).toContain('All day');
        });
    });

    describe('formatEventsMessage', () => {
        let service;

        beforeEach(() => {
            service = new GoogleCalendarService({});
        });

        it('should show empty message when no events', () => {
            const message = service.formatEventsMessage([], 'Test');
            expect(message).toContain('No events scheduled');
            expect(message).toContain('calendar is clear');
        });

        it('should format events list', () => {
            const events = [
                {
                    summary: 'Meeting',
                    start: { dateTime: '2025-12-24T10:00:00+07:00' },
                    end: { dateTime: '2025-12-24T11:00:00+07:00' }
                }
            ];
            const message = service.formatEventsMessage(events, 'Today');
            expect(message).toContain('Meeting');
            expect(message).toContain('Today');
        });

        it('should include location when present', () => {
            const events = [
                {
                    summary: 'Meeting',
                    location: 'Room A',
                    start: { dateTime: '2025-12-24T10:00:00+07:00' },
                    end: { dateTime: '2025-12-24T11:00:00+07:00' }
                }
            ];
            const message = service.formatEventsMessage(events);
            expect(message).toContain('Room A');
        });
    });

    describe('createEvent', () => {
        let service;

        beforeEach(() => {
            service = new GoogleCalendarService({});
            service.configured = true;
            service.calendar = {
                events: {
                    insert: jest.fn()
                }
            };
            service.calendarId = 'primary';
        });

        it('should throw if not configured', async () => {
            service.configured = false;
            await expect(service.createEvent({})).rejects.toThrow('not configured');
        });

        it('should insert event with correct parameters', async () => {
            const eventDetails = {
                summary: 'Test Event',
                startTime: new Date('2025-12-25T10:00:00Z'),
                endTime: new Date('2025-12-25T11:00:00Z'),
                location: 'Home',
                description: 'Test'
            };

            service.calendar.events.insert.mockResolvedValue({ data: { id: '123' } });

            await service.createEvent(eventDetails);

            expect(service.calendar.events.insert).toHaveBeenCalledWith(expect.objectContaining({
                calendarId: 'primary',
                resource: expect.objectContaining({
                    summary: 'Test Event',
                    location: 'Home',
                    description: 'Test',
                    start: expect.objectContaining({ dateTime: expect.any(String) }),
                    end: expect.objectContaining({ dateTime: expect.any(String) })
                })
            }));
        });
    });
});
