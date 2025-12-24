/**
 * Smart Rescheduling Service
 * 
 * Detects overdue tasks and suggests new due dates based on priority and workload.
 */

const logger = require('../utils/logger');

class ReschedulingService {
    constructor(dependencies) {
        this.tududuClient = dependencies.tududuClient;
        this.bot = dependencies.bot;
    }

    /**
     * Get all overdue tasks (due_date < today)
     * @returns {Promise<Array>} List of overdue tasks
     */
    async getOverdueTasks() {
        try {
            const allTasks = await this.tududuClient.getTasks({ completed: false });
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
     * @param {Object} task - The overdue task
     * @returns {Object} Suggestion with new date and reason
     */
    suggestReschedule(task) {
        const today = new Date();
        const priority = (task.priority || 'medium').toLowerCase();

        let daysToAdd;
        let reason;

        switch (priority) {
            case 'urgent':
            case 'critical':
                daysToAdd = 0; // Today
                reason = 'Urgent priority - reschedule to today';
                break;
            case 'high':
                daysToAdd = 1; // Tomorrow
                reason = 'High priority - reschedule to tomorrow';
                break;
            case 'medium':
                daysToAdd = 3; // 3 days
                reason = 'Medium priority - reschedule to 3 days from now';
                break;
            case 'low':
            default:
                daysToAdd = 7; // Next week
                reason = 'Low priority - reschedule to next week';
                break;
        }

        const suggestedDate = new Date(today);
        suggestedDate.setDate(suggestedDate.getDate() + daysToAdd);

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
     * Apply a reschedule to a task
     * @param {string} taskId - Task ID
     * @param {string} newDate - New due date (YYYY-MM-DD)
     * @returns {Promise<Object>} Updated task
     */
    async applyReschedule(taskId, newDate) {
        try {
            logger.info(`Rescheduling task ${taskId} to ${newDate}`);
            const updated = await this.tududuClient.updateTask(taskId, {
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
     * @returns {Promise<Array>} Overdue tasks with reschedule suggestions
     */
    async getOverdueWithSuggestions() {
        const overdueTasks = await this.getOverdueTasks();
        return overdueTasks.map(task => ({
            ...task,
            suggestion: this.suggestReschedule(task)
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
