/**
 * Recurring Tasks Service
 * 
 * Manages recurring/repeating tasks with pattern storage in a local JSON file.
 * Generates new task instances when due based on recurrence patterns.
 */

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class RecurringService {
    constructor(dependencies) {
        this.tududuClient = dependencies.tududuClient;
        this.storagePath = dependencies.storagePath || '.cache/recurring-tasks.json';
        this.patterns = new Map(); // taskId -> recurrence pattern
    }

    /**
     * Initialize the service by loading existing patterns from storage
     */
    async initialize() {
        try {
            await this._ensureStorageDir();
            const data = await this._loadPatterns();
            this.patterns = new Map(Object.entries(data));
            logger.info(`Loaded ${this.patterns.size} recurring task patterns`);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                logger.error(`Failed to load recurring patterns: ${error.message}`);
            }
            this.patterns = new Map();
        }
    }

    /**
     * Parse recurrence pattern from natural language
     * @param {string} text - Input text like "every day", "weekly", "every monday"
     * @returns {Object|null} Parsed pattern or null if no recurrence detected
     */
    parseRecurrence(text) {
        const lowerText = text.toLowerCase();

        // Daily patterns
        if (/\b(every\s*day|daily|setiap\s*hari)\b/.test(lowerText)) {
            return { type: 'daily', interval: 1 };
        }

        // Weekly patterns
        if (/\b(every\s*week|weekly|setiap\s*minggu)\b/.test(lowerText)) {
            return { type: 'weekly', interval: 1, dayOfWeek: new Date().getDay() };
        }

        // Specific day of week
        const dayPatterns = [
            { regex: /\bevery\s*(monday|senin)\b/, day: 1 },
            { regex: /\bevery\s*(tuesday|selasa)\b/, day: 2 },
            { regex: /\bevery\s*(wednesday|rabu)\b/, day: 3 },
            { regex: /\bevery\s*(thursday|kamis)\b/, day: 4 },
            { regex: /\bevery\s*(friday|jumat)\b/, day: 5 },
            { regex: /\bevery\s*(saturday|sabtu)\b/, day: 6 },
            { regex: /\bevery\s*(sunday|minggu)\b/, day: 0 }
        ];

        for (const { regex, day } of dayPatterns) {
            if (regex.test(lowerText)) {
                return { type: 'weekly', interval: 1, dayOfWeek: day };
            }
        }

        // Monthly patterns
        if (/\b(every\s*month|monthly|setiap\s*bulan)\b/.test(lowerText)) {
            return { type: 'monthly', interval: 1, dayOfMonth: new Date().getDate() };
        }

        // Specific day of month (e.g., "every 15th", "every 1st")
        const dayOfMonthMatch = lowerText.match(/every\s*(\d{1,2})(?:st|nd|rd|th)?(?:\s*of\s*the\s*month)?/);
        if (dayOfMonthMatch) {
            return { type: 'monthly', interval: 1, dayOfMonth: parseInt(dayOfMonthMatch[1], 10) };
        }

        return null;
    }

    /**
     * Register a task as recurring
     * @param {string} taskId - Tududi task ID
     * @param {Object} pattern - Recurrence pattern from parseRecurrence
     * @param {Object} taskTemplate - Task data template for generating new instances
     */
    async registerRecurring(taskId, pattern, taskTemplate) {
        const record = {
            taskId,
            pattern,
            template: taskTemplate,
            createdAt: new Date().toISOString(),
            lastGenerated: new Date().toISOString()
        };

        this.patterns.set(taskId, record);
        await this._savePatterns();
        logger.info(`Registered recurring task: ${taskId} with pattern: ${pattern.type}`);
        return record;
    }

    /**
     * Calculate the next due date based on a pattern
     * @param {Object} pattern - Recurrence pattern
     * @param {Date} fromDate - Date to calculate from
     * @returns {Date} Next due date
     */
    calculateNextDueDate(pattern, fromDate = new Date()) {
        const next = new Date(fromDate);
        next.setHours(0, 0, 0, 0);

        switch (pattern.type) {
            case 'daily':
                next.setDate(next.getDate() + pattern.interval);
                break;

            case 'weekly':
                // Find next occurrence of the day of week
                const currentDay = next.getDay();
                const targetDay = pattern.dayOfWeek;
                let daysUntil = targetDay - currentDay;
                if (daysUntil <= 0) daysUntil += 7;
                next.setDate(next.getDate() + daysUntil);
                break;

            case 'monthly':
                next.setMonth(next.getMonth() + pattern.interval);
                next.setDate(pattern.dayOfMonth);
                break;

            default:
                next.setDate(next.getDate() + 1);
        }

        return next;
    }

    /**
     * Generate the next instance of a recurring task
     * @param {string} taskId - Original task ID
     * @returns {Promise<Object|null>} New task or null if not recurring
     */
    async generateNextInstance(taskId) {
        const record = this.patterns.get(taskId);
        if (!record) return null;

        try {
            const nextDate = this.calculateNextDueDate(record.pattern);
            const newTaskData = {
                ...record.template,
                due_date: nextDate.toISOString().split('T')[0],
                name: record.template.name || record.template.title
            };

            const newTask = await this.tududuClient.createTask(newTaskData);

            // Update the record with new task ID
            record.lastGenerated = new Date().toISOString();
            record.taskId = newTask.id;
            this.patterns.delete(taskId);
            this.patterns.set(newTask.id, record);
            await this._savePatterns();

            logger.info(`Generated next instance of recurring task: ${newTask.id} due ${newTaskData.due_date}`);
            return newTask;
        } catch (error) {
            logger.error(`Failed to generate recurring task instance: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check all recurring tasks and generate due instances
     * Called periodically (e.g., daily cron)
     */
    async checkAndGenerate() {
        const generated = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const [taskId, record] of this.patterns.entries()) {
            const nextDate = this.calculateNextDueDate(record.pattern, new Date(record.lastGenerated));

            if (nextDate <= today) {
                try {
                    const newTask = await this.generateNextInstance(taskId);
                    if (newTask) generated.push(newTask);
                } catch (error) {
                    logger.error(`Skipped recurring task ${taskId}: ${error.message}`);
                }
            }
        }

        logger.info(`Generated ${generated.length} recurring task instances`);
        return generated;
    }

    /**
     * Remove a recurring pattern
     * @param {string} taskId - Task ID to stop recurring
     */
    async removeRecurring(taskId) {
        if (this.patterns.has(taskId)) {
            this.patterns.delete(taskId);
            await this._savePatterns();
            logger.info(`Removed recurring pattern for task: ${taskId}`);
            return true;
        }
        return false;
    }

    /**
     * Get all registered recurring tasks
     */
    getAll() {
        return Array.from(this.patterns.entries()).map(([id, record]) => ({
            taskId: id,
            ...record
        }));
    }

    /**
     * Format recurring status for display
     * @param {Object} pattern - Recurrence pattern
     * @returns {string} Human-readable recurrence description
     */
    formatPattern(pattern) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        switch (pattern.type) {
            case 'daily':
                return pattern.interval === 1 ? 'Every day' : `Every ${pattern.interval} days`;
            case 'weekly':
                return pattern.dayOfWeek !== undefined
                    ? `Every ${days[pattern.dayOfWeek]}`
                    : 'Every week';
            case 'monthly':
                return `Every month on the ${pattern.dayOfMonth}${this._ordinalSuffix(pattern.dayOfMonth)}`;
            default:
                return 'Custom recurrence';
        }
    }

    _ordinalSuffix(n) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return s[(v - 20) % 10] || s[v] || s[0];
    }

    async _ensureStorageDir() {
        const dir = path.dirname(this.storagePath);
        try {
            await fs.mkdir(dir, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') throw error;
        }
    }

    async _loadPatterns() {
        const data = await fs.readFile(this.storagePath, 'utf8');
        return JSON.parse(data);
    }

    async _savePatterns() {
        const data = Object.fromEntries(this.patterns);
        await fs.writeFile(this.storagePath, JSON.stringify(data, null, 2));
    }
}

module.exports = RecurringService;
