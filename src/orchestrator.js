const logger = require('./utils/logger');

class MessageOrchestrator {
  constructor(dependencies) {
    this.taskParser = dependencies.taskParser;
    this.tududuClient = dependencies.tududuClient;
    this.fileManager = dependencies.fileManager;
    this.bot = dependencies.bot;
  }

  async handleMessage(message) {
    try {
      logger.info('Processing message...');

      // Parse message with LLM
      const parsed = await this.taskParser.parse(message);

      if (parsed.type === 'task') {
        await this.handleTaskMessage(parsed);
      } else if (parsed.type === 'knowledge') {
        await this.handleKnowledgeMessage(parsed);
      } else if (parsed.type === 'question') {
        await this.handleQuestionMessage(parsed);
      }

      logger.info('Message processed successfully');
    } catch (error) {
      logger.error(`Message processing failed: ${error.message}`);
      await this.bot.sendMessage(
        `❌ Sorry, I couldn't process that message.\n\nError: ${error.message}`
      );
    }
  }

  async handleTaskMessage(parsed) {
    const tasks = parsed.tasks;
    const createdTasks = [];

    for (const taskData of tasks) {
      try {
        // Create task in Tududi
        const task = await this.tududuClient.createTask(taskData);
        logger.info(`Task created: ${task.id}`);

        // Sync to Obsidian
        await this.fileManager.appendTaskToDailyNote({
          ...taskData,
          id: task.id
        });

        createdTasks.push(task);
      } catch (error) {
        logger.error(`Failed to create task: ${error.message}`);
      }
    }

    // Send confirmation
    if (createdTasks.length === 1) {
      const task = createdTasks[0];
      await this.bot.sendMessage(
        `✅ Task created: *${task.title}*\n\n` +
        `📅 Due: ${task.due_date || 'Not set'}\n` +
        `⏱️ Estimate: ${task.time_estimate || 30}m\n` +
        `⚡ Energy: ${task.energy_level || 'MEDIUM'}\n` +
        `📁 Project: ${task.project || 'Inbox'}`
      );
    } else if (createdTasks.length > 1) {
      const taskList = createdTasks
        .map(t => `• ${t.title}`)
        .join('\n');
      await this.bot.sendMessage(
        `✅ Created ${createdTasks.length} tasks:\n\n${taskList}`
      );
    }
  }

  async handleKnowledgeMessage(parsed) {
    try {
      // Create knowledge note in Obsidian
      const notePath = await this.fileManager.createKnowledgeNote({
        title: parsed.title,
        content: parsed.content,
        category: parsed.category,
        tags: parsed.tags
      });

      let response = `💡 Knowledge captured: *${parsed.title}*\n\n` +
        `📂 Category: ${parsed.category}\n` +
        `🏷️ Tags: ${parsed.tags.join(', ')}\n` +
        `📝 Note: \`${notePath.split('/').pop()}\``;

      // If actionable, also create task
      if (parsed.actionable && parsed.actionTask) {
        const task = await this.tududuClient.createTask(parsed.actionTask);
        await this.fileManager.appendTaskToDailyNote({
          ...parsed.actionTask,
          id: task.id
        });

        response += `\n\n✅ Action task created: *${task.title}*`;
      }

      await this.bot.sendMessage(response);
    } catch (error) {
      logger.error(`Failed to create knowledge: ${error.message}`);
      throw error;
    }
  }

  async handleQuestionMessage(parsed) {
    // Placeholder for future semantic search
    await this.bot.sendMessage(
      '❓ Question mode coming soon! For now, you can search manually in Obsidian.'
    );
  }
}

module.exports = MessageOrchestrator;
