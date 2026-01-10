/**
 * Weekly Review Service
 * 
 * Generates a summary of completed tasks and productivity stats for the past week.
 */

const logger = require('../utils/logger');

class WeeklyReviewService {
    constructor(dependencies) {
        this.tududiClient = dependencies.tududiClient;
        this.llmClient = dependencies.llmClient || null;
    }

    /**
     * Get tasks completed in the last N days
     * @param {number} days - Number of days to look back (default 7)
     * @returns {Promise<Array>} Completed tasks
     */
    async getCompletedTasks(days = 7) {
        try {
            const allTasks = await this.tududiClient.getTasks({ completed: true });

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);
            cutoffDate.setHours(0, 0, 0, 0);

            // Filter tasks completed within the date range
            // Tududi tasks have updated_at which reflects completion time
            const completed = allTasks.filter(task => {
                const taskDate = new Date(task.updated_at || task.completed_at || task.created_at);
                return taskDate >= cutoffDate;
            });

            logger.info(`Found ${completed.length} tasks completed in last ${days} days`);
            return completed;
        } catch (error) {
            logger.error(`Failed to get completed tasks: ${error.message}`);
            throw error;
        }
    }

    /**
     * Calculate productivity statistics
     * @param {Array} completedTasks - List of completed tasks
     * @returns {Object} Statistics object
     */
    calculateStats(completedTasks) {
        const stats = {
            total: completedTasks.length,
            byPriority: { urgent: 0, high: 0, medium: 0, low: 0 },
            byDay: {},
            avgPerDay: 0,
            busiestDay: null,
            busiestDayCount: 0
        };

        if (completedTasks.length === 0) {
            return stats;
        }

        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        completedTasks.forEach(task => {
            // Count by priority
            const priority = (task.priority || 'medium').toLowerCase();
            if (stats.byPriority[priority] !== undefined) {
                stats.byPriority[priority]++;
            } else {
                stats.byPriority.medium++;
            }

            // Count by day of week
            const taskDate = new Date(task.updated_at || task.completed_at || task.created_at);
            const dayName = dayNames[taskDate.getDay()];
            stats.byDay[dayName] = (stats.byDay[dayName] || 0) + 1;
        });

        // Calculate busiest day
        for (const [day, count] of Object.entries(stats.byDay)) {
            if (count > stats.busiestDayCount) {
                stats.busiestDay = day;
                stats.busiestDayCount = count;
            }
        }

        // Calculate average per day
        stats.avgPerDay = Math.round((stats.total / 7) * 10) / 10;

        return stats;
    }

    /**
     * Generate a full weekly review with AI insights
     * @returns {Promise<Object>} Review with tasks, stats, and AI insight
     */
    async generateReview() {
        const completedTasks = await this.getCompletedTasks(7);
        const stats = this.calculateStats(completedTasks);

        // Generate AI insight if LLM is available
        let insight = null;
        if (this.llmClient && stats.total > 0) {
            try {
                insight = await this._generateInsight(stats, completedTasks);
            } catch (err) {
                logger.warn(`Could not generate AI insight: ${err.message}`);
            }
        }

        return {
            tasks: completedTasks,
            stats,
            insight,
            formatted: this.formatReviewMessage(stats, completedTasks, insight)
        };
    }

    /**
     * Generate AI insight from weekly data
     */
    async _generateInsight(stats, tasks) {
        const taskNames = tasks.slice(0, 10).map(t => t.name || t.title).join(', ');
        const prompt = `Based on this weekly productivity data, give ONE brief insight (max 2 sentences) about patterns or suggestions:

Completed: ${stats.total} tasks
Best day: ${stats.busiestDay} (${stats.busiestDayCount} tasks)
By priority: Urgent=${stats.byPriority.urgent}, High=${stats.byPriority.high}, Medium=${stats.byPriority.medium}, Low=${stats.byPriority.low}
Sample tasks: ${taskNames}

Be specific, actionable, and encouraging. Reply in Indonesian.`;

        const response = await this.llmClient.sendMessage(prompt, {
            systemPrompt: 'You are a productivity coach. Give brief, actionable insights.',
            model: 'flash'
        });

        return response.trim();
    }

    /**
     * Format the review as a Telegram message
     * @param {Object} stats - Statistics object
     * @param {Array} tasks - Completed tasks
     * @param {string} insight - AI-generated insight (optional)
     * @returns {string} Formatted message
     */
    formatReviewMessage(stats, tasks, insight = null) {
        let message = `📊 *Weekly Review*\n\n`;

        if (stats.total === 0) {
            message += `No tasks completed this week.\n\n`;
            message += `_Time to get started! 💪_`;
            return message;
        }

        message += `✅ *${stats.total} tasks completed*\n`;
        message += `📈 Avg: ${stats.avgPerDay}/day\n`;

        if (stats.busiestDay) {
            message += `🏆 Best day: ${stats.busiestDay} (${stats.busiestDayCount} tasks)\n`;
        }

        message += `\n*By Priority:*\n`;
        if (stats.byPriority.urgent > 0) message += `🔴 Urgent: ${stats.byPriority.urgent}\n`;
        if (stats.byPriority.high > 0) message += `🟠 High: ${stats.byPriority.high}\n`;
        if (stats.byPriority.medium > 0) message += `🟡 Medium: ${stats.byPriority.medium}\n`;
        if (stats.byPriority.low > 0) message += `🟢 Low: ${stats.byPriority.low}\n`;

        // Show recent completed tasks (max 5)
        if (tasks.length > 0) {
            message += `\n*Recent Completions:*\n`;
            const recentTasks = tasks.slice(0, 5);
            recentTasks.forEach(task => {
                message += `• ${task.name || task.title}\n`;
            });
            if (tasks.length > 5) {
                message += `_...and ${tasks.length - 5} more_\n`;
            }
        }

        // Add AI insight if available
        if (insight) {
            message += `\n💡 *Insight:* ${insight}\n`;
        }

        message += `\n_Keep up the great work! 🚀_`;
        return message;
    }
}

module.exports = WeeklyReviewService;
