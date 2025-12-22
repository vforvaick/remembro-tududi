const logger = require('../utils/logger');

/**
 * ChaosMode - Manages chaos mode state and task filtering
 * When active, only shows urgent and quick tasks to reduce overwhelm
 */
class ChaosMode {
    constructor() {
        this.isActive = false;
        this.activatedAt = null;
        this.userChatIds = new Map(); // Per-user chaos mode state for multi-user support
    }

    /**
     * Activate chaos mode for a specific user
     * @param {number} chatId - Telegram chat ID
     */
    activate(chatId) {
        this.userChatIds.set(chatId, {
            isActive: true,
            activatedAt: new Date()
        });
        logger.info(`Chaos mode activated for chat ${chatId}`);
    }

    /**
     * Deactivate chaos mode for a specific user
     * @param {number} chatId - Telegram chat ID
     */
    deactivate(chatId) {
        this.userChatIds.set(chatId, {
            isActive: false,
            activatedAt: null
        });
        logger.info(`Chaos mode deactivated for chat ${chatId}`);
    }

    /**
     * Check if chaos mode is active for a user
     * @param {number} chatId - Telegram chat ID
     * @returns {boolean}
     */
    isActiveFor(chatId) {
        const state = this.userChatIds.get(chatId);
        return state?.isActive || false;
    }

    /**
     * Get chaos mode status for a user
     * @param {number} chatId - Telegram chat ID
     * @returns {Object} Status object
     */
    getStatus(chatId) {
        const state = this.userChatIds.get(chatId);
        return {
            isActive: state?.isActive || false,
            activatedAt: state?.activatedAt || null,
            duration: state?.activatedAt
                ? Math.round((Date.now() - state.activatedAt.getTime()) / 60000)
                : 0
        };
    }

    /**
     * Filter tasks to only show urgent/quick ones during chaos mode
     * @param {Array} tasks - List of tasks
     * @param {number} chatId - Telegram chat ID
     * @returns {Array} Filtered tasks
     */
    filterTasks(tasks, chatId) {
        if (!this.isActiveFor(chatId)) {
            return tasks;
        }

        return tasks.filter(task => {
            // Keep tasks that are:
            // 1. Quick (≤15 minutes)
            const isQuick = task.time_estimate && task.time_estimate <= 15;

            // 2. High priority or urgent
            const isUrgent = ['high', 'urgent', 'critical'].includes(
                (task.priority || '').toLowerCase()
            );

            // 3. Due today
            const isDueToday = this.isDueToday(task.due_date);

            return isQuick || isUrgent || isDueToday;
        });
    }

    /**
     * Check if a date is today
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {boolean}
     */
    isDueToday(dateStr) {
        if (!dateStr) return false;
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    }

    /**
     * Format chaos mode response for /chaos command
     * @param {Array} filteredTasks - Filtered task list
     * @returns {string} Formatted message
     */
    formatChaosModeMessage(filteredTasks) {
        if (filteredTasks.length === 0) {
            return '🌪️ *Chaos Mode Activated*\n\n' +
                '✨ No urgent tasks! Take a breath.\n\n' +
                '_Use /normal when you\'re ready to plan again._';
        }

        const taskList = filteredTasks
            .slice(0, 5) // Max 5 tasks in chaos mode
            .map((t, i) => {
                const time = t.time_estimate ? `⏱️${t.time_estimate}m` : '';
                const priority = t.priority ? `⚡${t.priority.toUpperCase()}` : '';
                return `${i + 1}. ${t.name || t.title} ${time} ${priority}`.trim();
            })
            .join('\n');

        return '🌪️ *Chaos Mode Activated*\n\n' +
            `Focus only on these ${filteredTasks.length} task(s):\n\n` +
            `${taskList}\n\n` +
            '_Everything else is hidden. Use /normal when ready._';
    }

    /**
     * Format normal mode response for /normal command
     * @param {number} durationMinutes - How long chaos mode was active
     * @returns {string} Formatted message
     */
    formatNormalModeMessage(durationMinutes) {
        const durationText = durationMinutes > 0
            ? `(Chaos mode was active for ${durationMinutes} minutes)`
            : '';

        return '✅ *Normal Mode Restored*\n\n' +
            `${durationText}\n\n` +
            '📝 How much time do you have to plan?\n' +
            '_Reply with a number (e.g., "30" for 30 minutes) or use /plan_';
    }
}

module.exports = ChaosMode;
