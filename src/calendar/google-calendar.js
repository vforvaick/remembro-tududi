/**
 * Google Calendar Service
 * 
 * Integrates with Google Calendar API using Service Account authentication.
 */

const { google } = require('googleapis');
const logger = require('../utils/logger');

class GoogleCalendarService {
    constructor(config) {
        this.keyFilePath = config.keyFilePath;
        this.calendarId = config.calendarId || 'primary';
        this.calendar = null;
        this.configured = false;
    }

    /**
     * Initialize the Google Calendar client
     */
    async initialize() {
        if (!this.keyFilePath) {
            logger.info('ℹ️ Google Calendar not configured (no key file)');
            return false;
        }

        try {
            const auth = new google.auth.GoogleAuth({
                keyFile: this.keyFilePath,
                scopes: ['https://www.googleapis.com/auth/calendar']
            });

            this.calendar = google.calendar({ version: 'v3', auth });
            this.configured = true;
            logger.info('✅ Google Calendar service initialized');
            return true;
        } catch (error) {
            logger.error(`Failed to initialize Google Calendar: ${error.message}`);
            return false;
        }
    }

    /**
     * Check if service is configured
     */
    isConfigured() {
        return this.configured;
    }

    /**
     * Get today's events
     * @returns {Promise<Array>} List of events
     */
    async getTodayEvents() {
        if (!this.configured) {
            throw new Error('Google Calendar not configured');
        }

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

        try {
            const response = await this.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: startOfDay.toISOString(),
                timeMax: endOfDay.toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            });

            return response.data.items || [];
        } catch (error) {
            logger.error(`Failed to get today's events: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get upcoming events for specified days
     * @param {number} days - Number of days to look ahead
     * @returns {Promise<Array>} List of events
     */
    async getUpcomingEvents(days = 7) {
        if (!this.configured) {
            throw new Error('Google Calendar not configured');
        }

        const now = new Date();
        const timeMax = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        try {
            const response = await this.calendar.events.list({
                calendarId: this.calendarId,
                timeMin: now.toISOString(),
                timeMax: timeMax.toISOString(),
                singleEvents: true,
                orderBy: 'startTime',
                maxResults: 50
            });

            return response.data.items || [];
        } catch (error) {
            logger.error(`Failed to get upcoming events: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create a new calendar event
     * @param {Object} eventDetails - Event details
     * @param {string} eventDetails.summary - Event title
     * @param {Date} eventDetails.startTime - Start time
     * @param {Date} eventDetails.endTime - End time
     * @param {string} [eventDetails.location] - Event location
     * @param {string} [eventDetails.description] - Event description
     * @returns {Promise<Object>} Created event
     */
    async createEvent({ summary, startTime, endTime, location, description }) {
        if (!this.configured) {
            throw new Error('Google Calendar not configured');
        }

        try {
            const event = {
                summary,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: 'Asia/Jakarta'
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: 'Asia/Jakarta'
                },
                location,
                description
            };

            const response = await this.calendar.events.insert({
                calendarId: this.calendarId,
                resource: event
            });

            logger.info(`📅 Created calendar event: ${summary}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to create calendar event: ${error.message}`);
            throw error;
        }
    }

    /**
     * Format event time for display
     * @param {Object} event - Calendar event
     * @returns {string} Formatted time string
     */
    formatEventTime(event) {
        if (event.start.dateTime) {
            // Timed event
            const start = new Date(event.start.dateTime);
            const end = new Date(event.end.dateTime);
            const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
            return `${start.toLocaleTimeString('id-ID', timeOptions)} - ${end.toLocaleTimeString('id-ID', timeOptions)}`;
        } else {
            // All-day event
            return '📅 All day';
        }
    }

    /**
     * Format events for Telegram display
     * @param {Array} events - List of events
     * @param {string} title - Message title
     * @returns {string} Formatted message
     */
    formatEventsMessage(events, title = "Today's Events") {
        if (events.length === 0) {
            return `📅 *${title}*\n\n_No events scheduled._\n\n✨ Your calendar is clear!`;
        }

        let message = `📅 *${title}*\n\n`;

        events.forEach((event, index) => {
            const time = this.formatEventTime(event);
            const summary = event.summary || 'Untitled event';

            message += `${index + 1}. *${summary}*\n`;
            message += `   ⏰ ${time}\n`;

            if (event.location) {
                message += `   📍 ${event.location}\n`;
            }
            message += '\n';
        });

        return message;
    }

    /**
     * Format today's events for Telegram
     * @returns {Promise<string>} Formatted message
     */
    async formatTodayMessage() {
        const events = await this.getTodayEvents();
        const today = new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        return this.formatEventsMessage(events, `${today}`);
    }

    /**
     * Format upcoming events for Telegram
     * @param {number} days - Number of days
     * @returns {Promise<string>} Formatted message
     */
    async formatUpcomingMessage(days = 7) {
        const events = await this.getUpcomingEvents(days);

        if (events.length === 0) {
            return `📅 *Next ${days} Days*\n\n_No events scheduled._\n\n✨ Your calendar is clear!`;
        }

        let message = `📅 *Next ${days} Days* (${events.length} events)\n\n`;

        // Group by date
        const byDate = {};
        events.forEach(event => {
            const dateStr = event.start.dateTime
                ? new Date(event.start.dateTime).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })
                : new Date(event.start.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

            if (!byDate[dateStr]) byDate[dateStr] = [];
            byDate[dateStr].push(event);
        });

        for (const [date, dateEvents] of Object.entries(byDate)) {
            message += `*${date}*\n`;
            dateEvents.forEach(event => {
                const time = this.formatEventTime(event);
                message += `• ${event.summary || 'Untitled'} (${time})\n`;
            });
            message += '\n';
        }

        return message;
    }
}

module.exports = GoogleCalendarService;
