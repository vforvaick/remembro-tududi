/**
 * Smart Rescheduling Service
 * 
 * Detects overdue tasks and suggests new due dates based on priority and workload.
 */

const logger = require('../utils/logger');

class ReschedulingService {
    constructor(dependencies) {
        this.tududiClient = dependencies.tududiClient;
        this.bot = dependencies.bot;
        this.calendar = dependencies.calendarService || null;
    }

    /**
     * Get all overdue tasks (due_date < today)
     * @returns {Promise<Array>} List of overdue tasks
     */
    async getOverdueTasks() {
        try {
            const allTasks = await this.tududiClient.getTasks({ completed: false });
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const overdue = allTasks.filter(task => {
                if (!task.due_date) return false;
                const dueDate = new Date(task.due_date);
                dueDate.setHours(0, 0, 0, 0);
                return dueDate < today;
            });

            logger.info(`Found ${overdue.length} overdue tasks`);
            return overdue;
        } catch (error) {
            logger.error(`Failed to get overdue tasks: ${error.message}`);
            throw error;
        }
    }

    /**
     * Suggest a new due date for an overdue task
     * Enhanced: checks calendar for busy days and shifts suggestions
     * @param {Object} task - The overdue task
     * @param {Object} busyDays - Map of dates to event counts (optional)
     * @returns {Object} Suggestion with new date and reason
     */
    suggestReschedule(task, busyDays = {}) {
        const today = new Date();
        const priority = (task.priority || 'medium').toLowerCase();

        let baseDaysToAdd;
        let reason;

        switch (priority) {
            case 'urgent':
            case 'critical':
                baseDaysToAdd = 0;
                reason = 'Urgent priority - reschedule to today';
                break;
            case 'high':
                baseDaysToAdd = 1;
                reason = 'High priority - reschedule to tomorrow';
                break;
            case 'medium':
                baseDaysToAdd = 3;
                reason = 'Medium priority - reschedule to 3 days from now';
                break;
            case 'low':
            default:
                baseDaysToAdd = 7;
                reason = 'Low priority - reschedule to next week';
                break;
        }

        // Find a date that's not too busy
        let suggestedDate = new Date(today);
        suggestedDate.setDate(suggestedDate.getDate() + baseDaysToAdd);

        // Check if suggested date is busy (3+ events = busy)
        const BUSY_THRESHOLD = 3;
        let attempts = 0;
        while (attempts < 5) {
            const dateStr = suggestedDate.toISOString().split('T')[0];
            if ((busyDays[dateStr] || 0) >= BUSY_THRESHOLD) {
                // Date is busy, try next day
                suggestedDate.setDate(suggestedDate.getDate() + 1);
                reason = `${priority} priority - shifted to avoid busy day`;
                attempts++;
            } else {
                break;
            }
        }

        return {
            taskId: task.id,
            taskName: task.name || task.title,
            originalDueDate: task.due_date,
            suggestedDate: suggestedDate.toISOString().split('T')[0],
            reason,
            priority
        };
    }

    /**
     * Get busy days map from calendar (date -> event count)
     * @param {number} days - Days to look ahead
     * @returns {Promise<Object>} Map of date strings to event counts
     */
    async getBusyDaysMap(days = 14) {
        if (!this.calendar?.isConfigured()) {
            return {};
        }

        try {
            const events = await this.calendar.getUpcomingEvents(days);
            const busyDays = {};

            for (const event of events) {
                const dateStr = event.start.dateTime
                    ? new Date(event.start.dateTime).toISOString().split('T')[0]
                    : event.start.date;
                busyDays[dateStr] = (busyDays[dateStr] || 0) + 1;
            }

            return busyDays;
        } catch (err) {
            logger.warn(`Could not get busy days: ${err.message}`);
            return {};
        }
    }

    /**
     * Apply a reschedule to a task
     * @param {string} taskId - Task ID
     * @param {string} newDate - New due date (YYYY-MM-DD)
     * @returns {Promise<Object>} Updated task
     */
    async applyReschedule(taskId, newDate) {
        try {
            logger.info(`Rescheduling task ${taskId} to ${newDate}`);
            const updated = await this.tududiClient.updateTask(taskId, {
                due_date: newDate
            });
            logger.info(`Task ${taskId} rescheduled successfully`);
            return updated;
        } catch (error) {
            logger.error(`Failed to reschedule task ${taskId}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get all overdue tasks with suggestions
     * Enhanced: uses calendar to avoid busy days
     * @returns {Promise<Array>} Overdue tasks with reschedule suggestions
     */
    async getOverdueWithSuggestions() {
        const overdueTasks = await this.getOverdueTasks();

        // Get busy days map for calendar-aware suggestions
        const busyDays = await this.getBusyDaysMap(14);

        return overdueTasks.map(task => ({
            ...task,
            suggestion: this.suggestReschedule(task, busyDays)
        }));
    }

    /**
     * Format overdue tasks message for Telegram
     * @param {Array} overdueWithSuggestions - Tasks with suggestions
     * @returns {string} Formatted message
     */
    formatOverdueMessage(overdueWithSuggestions) {
        if (overdueWithSuggestions.length === 0) {
            return '✅ No overdue tasks! You\'re all caught up.';
        }

        let message = `⏰ *${overdueWithSuggestions.length} Overdue Task${overdueWithSuggestions.length > 1 ? 's' : ''}*\n\n`;

        overdueWithSuggestions.forEach((task, i) => {
            const s = task.suggestion;
            message += `${i + 1}. *${s.taskName}*\n`;
            message += `   📅 Was due: ${s.originalDueDate}\n`;
            message += `   ➡️ Suggested: ${s.suggestedDate}\n`;
            message += `   💡 ${s.reason}\n\n`;
        });

        message += `_Use the buttons below to reschedule or dismiss._`;
        return message;
    }

    /**
     * Build inline keyboard for reschedule actions
     * @param {Array} overdueWithSuggestions - Tasks with suggestions
     * @returns {Object} Telegram inline keyboard markup
     */
    buildRescheduleKeyboard(overdueWithSuggestions) {
        const buttons = overdueWithSuggestions.map(task => {
            const s = task.suggestion;
            return [
                {
                    text: `✅ ${s.taskName.substring(0, 20)}... → ${s.suggestedDate}`,
                    callback_data: `reschedule:${task.id}:${s.suggestedDate}`
                }
            ];
        });

        // Add "Reschedule All" and "Dismiss" buttons
        if (overdueWithSuggestions.length > 1) {
            buttons.push([
                { text: '🔄 Reschedule All', callback_data: 'reschedule:all' },
                { text: '❌ Dismiss', callback_data: 'reschedule:dismiss' }
            ]);
        } else {
            buttons.push([
                { text: '❌ Dismiss', callback_data: 'reschedule:dismiss' }
            ]);
        }

        return { inline_keyboard: buttons };
    }
}

module.exports = ReschedulingService;
