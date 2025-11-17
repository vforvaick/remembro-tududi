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
        // Ensure each task has required fields
        parsed.tasks = parsed.tasks.map(task => ({
          title: task.title || 'Untitled Task',
          due_date: task.due_date || null,
          time_estimate: task.time_estimate || 30,
          energy_level: task.energy_level || 'MEDIUM',
          project: task.project || 'Inbox',
          priority: task.priority || 'medium',
          notes: task.notes || ''
        }));
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
