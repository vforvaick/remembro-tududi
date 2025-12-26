/**
 * Proactive Coaching Service
 * 
 * Tracks user activity and sends check-in messages when idle.
 */

const logger = require('../utils/logger');

class CoachingService {
    /**
     * @param {Object} options
     * @param {Object} options.bot - Telegram bot instance
     * @param {number} [options.idleThresholdHours=4] - Hours before sending check-in
     */
    constructor({ bot, idleThresholdHours = 4 }) {
        this.bot = bot;
        this.idleThresholdHours = idleThresholdHours;
        this.lastInteraction = new Map(); // userId -> timestamp
        this.notifiedToday = new Set(); // Avoid spamming same user
    }

    /**
     * Record user interaction
     * @param {string|number} userId - Telegram user ID
     */
    recordInteraction(userId) {
        this.lastInteraction.set(String(userId), Date.now());
        // Clear notification flag when user interacts
        this.notifiedToday.delete(String(userId));
    }

    /**
     * Check all users and send coaching messages if idle
     */
    async checkAndNotifyIdleUsers() {
        const now = Date.now();
        const thresholdMs = this.idleThresholdHours * 60 * 60 * 1000;
        const currentHour = new Date().getHours();

        // Only send during reasonable hours (8 AM - 9 PM)
        if (currentHour < 8 || currentHour > 21) {
            logger.info('🌙 Skipping coaching check (outside hours)');
            return;
        }

        for (const [userId, lastTime] of this.lastInteraction.entries()) {
            const idleTime = now - lastTime;

            if (idleTime > thresholdMs && !this.notifiedToday.has(userId)) {
                await this.sendCoachingMessage(userId, idleTime);
                this.notifiedToday.add(userId);
            }
        }
    }

    /**
     * Send a coaching check-in message
     * @param {string} userId - User ID
     * @param {number} idleTimeMs - How long user has been idle
     */
    async sendCoachingMessage(userId, idleTimeMs) {
        const hours = Math.floor(idleTimeMs / (60 * 60 * 1000));

        const messages = [
            `👋 Hey! It's been ${hours}+ hours since I heard from you.\n\nAnything on your mind? Just send me a quick message or voice note!`,
            `🧠 Quick check-in! Haven't seen you in a while.\n\nGot any tasks floating in your head? Let's capture them before they slip away!`,
            `✨ Just checking in! ${hours} hours since last activity.\n\n/today - See your calendar\n/plan - Get your daily plan\n\nOr just tell me what's up!`
        ];

        const message = messages[Math.floor(Math.random() * messages.length)];

        try {
            await this.bot.sendMessageToUser(userId, message);
            logger.info(`🤖 Sent coaching message to user ${userId} (idle ${hours}h)`);
        } catch (error) {
            logger.error(`Failed to send coaching message to ${userId}: ${error.message}`);
        }
    }

    /**
     * Reset daily notification flags (call at midnight)
     */
    resetDailyFlags() {
        this.notifiedToday.clear();
        logger.info('🔄 Reset daily coaching flags');
    }

    /**
     * Get idle status for a user
     * @param {string|number} userId
     * @returns {Object} Status info
     */
    getStatus(userId) {
        const lastTime = this.lastInteraction.get(String(userId));
        if (!lastTime) return { recorded: false };

        const idleMs = Date.now() - lastTime;
        return {
            recorded: true,
            idleHours: Math.floor(idleMs / (60 * 60 * 1000)),
            idleMinutes: Math.floor(idleMs / (60 * 1000)),
            lastInteraction: new Date(lastTime).toISOString()
        };
    }
}

module.exports = CoachingService;
