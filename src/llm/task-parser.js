const logger = require('../utils/logger');
const { buildPrompt } = require('./prompts/parse-task');

class TaskParser {
  constructor(claudeClient) {
    this.claude = claudeClient;
  }

  async parse(message, context = {}) {
    try {
      logger.info(`Parsing message: ${message.substring(0, 50)}...`);

      const { systemPrompt, userPrompt } = buildPrompt(message, context);

      const parsed = await this.claude.parseJSON(userPrompt, {
        systemPrompt
      });

      logger.info(`Parsed as type: ${parsed.type}`);

      // Validate parsed data
      if (parsed.type === 'task') {
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          throw new Error('Invalid task parsing: tasks array missing');
        }
        // Validate and filter tasks with empty titles
        const validTasks = [];
        const invalidTasks = [];

        for (const task of parsed.tasks) {
          const title = task.title?.trim();
          if (!title || title.length === 0) {
            invalidTasks.push('Empty or missing task title');
            continue;
          }

          validTasks.push({
            title: title,
            due_date: task.due_date || null,
            time_estimate: task.time_estimate || 30,
            energy_level: task.energy_level || 'MEDIUM',
            project: task.project || 'Inbox',
            priority: task.priority || 'medium',
            notes: task.notes || ''
          });
        }

        // If all tasks were invalid, throw error
        if (validTasks.length === 0 && invalidTasks.length > 0) {
          throw new Error('Cannot create tasks with empty titles. Please provide a task description.');
        }

        parsed.tasks = validTasks;
      }

      return parsed;
    } catch (error) {
      logger.error(`Failed to parse message: ${error.message}`);
      throw error;
    }
  }

  async parseBatch(messages) {
    const results = [];
    for (const message of messages) {
      try {
        const parsed = await this.parse(message);
        results.push({ success: true, data: parsed });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }
}

module.exports = TaskParser;
