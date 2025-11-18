const logger = require('../utils/logger');
const { buildPrompt } = require('./prompts/daily-plan');

class DailyPlanner {
  constructor(claudeClient, tududuClient) {
    this.claude = claudeClient;
    this.tududi = tududuClient;
  }

  async generatePlan(schedule, options = {}) {
    try {
      logger.info('Generating daily plan...');

      // Fetch incomplete tasks
      const tasks = await this.tududi.getTasks({
        completed: false
      });

      if (tasks.length === 0) {
        return {
          summary: 'No tasks to plan!',
          available_time: schedule.available_hours * 60,
          planned_time: 0,
          buffer_time: schedule.available_hours * 60,
          priority_tasks: [],
          skipped_tasks: []
        };
      }

      // Build prompt and generate plan
      const { systemPrompt, userPrompt } = buildPrompt(tasks, schedule);
      const plan = await this.claude.parseJSON(userPrompt, { systemPrompt });

      logger.info(`Plan generated: ${plan.priority_tasks.length} tasks scheduled`);

      return plan;
    } catch (error) {
      logger.error(`Failed to generate plan: ${error.message}`);
      throw error;
    }
  }

  formatPlanMessage(plan) {
    let message = `📅 **Daily Plan**\n\n`;
    message += `${plan.summary}\n\n`;
    message += `⏱️ Available: ${plan.available_time}m | Planned: ${plan.planned_time}m | Buffer: ${plan.buffer_time}m\n\n`;

    if (plan.priority_tasks.length > 0) {
      message += `**Priority Tasks (${plan.priority_tasks.length}):**\n\n`;
      plan.priority_tasks.forEach((task, i) => {
        message += `${i + 1}. *${task.title}*\n`;
        message += `   ⏰ ${task.time_slot} (${task.duration}m) ⚡${task.energy}\n`;
        if (task.reason) {
          message += `   💡 ${task.reason}\n`;
        }
        message += `\n`;
      });
    }

    if (plan.skipped_tasks && plan.skipped_tasks.length > 0) {
      message += `\n**Skipped (${plan.skipped_tasks.length}):**\n`;
      plan.skipped_tasks.forEach(task => {
        message += `• ${task.title} - ${task.reason}\n`;
      });
    }

    if (plan.warnings && plan.warnings.length > 0) {
      message += `\n⚠️ **Warnings:**\n`;
      plan.warnings.forEach(warning => {
        message += `• ${warning}\n`;
      });
    }

    return message;
  }
}

module.exports = DailyPlanner;
