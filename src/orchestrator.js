const logger = require('./utils/logger');

class MessageOrchestrator {
  constructor(dependencies) {
    this.taskParser = dependencies.taskParser;
    this.tududuClient = dependencies.tududuClient;
    this.fileManager = dependencies.fileManager;
    this.bot = dependencies.bot;
  }

  async handleMessage(message) {
    let statusMessageId = null;
    try {
      logger.info('Processing message...');

      // Send initial status message
      try {
        statusMessageId = await this.bot.sendStatusMessage('🤔 Let me think...');
      } catch (statusErr) {
        logger.warn(`Failed to send status message: ${statusErr.message}, continuing without it`);
      }

      // Parse message with LLM
      const parsed = await this.taskParser.parse(message);
      logger.info(`Message parsed as type: ${parsed.type}`);

      if (parsed.type === 'task') {
        await this.handleTaskMessage(parsed, statusMessageId);
      } else if (parsed.type === 'knowledge') {
        await this.handleKnowledgeMessage(parsed, statusMessageId);
      } else if (parsed.type === 'question') {
        await this.handleQuestionMessage(parsed, statusMessageId);
      }

      logger.info('Message processed successfully');
    } catch (error) {
      logger.error(`Message processing failed: ${error.message}`);
      try {
        if (statusMessageId) {
          await this.bot.editStatusMessage(
            statusMessageId,
            `❌ Error: ${error.message}`
          );
        } else {
          await this.bot.sendMessage(
            `❌ Sorry, I couldn't process that message.\n\nError: ${error.message}`
          );
        }
      } catch (editError) {
        logger.error(`Failed to send error message: ${editError.message}`);
      }
    }
  }

  async handleTaskMessage(parsed, statusMessageId) {
    const tasks = parsed.tasks;
    const createdTasks = [];
    const failedTasks = [];

    for (const taskData of tasks) {
      try {
        // Validate task title before creating
        if (!taskData.title || taskData.title.trim().length === 0) {
          throw new Error('Task title cannot be empty');
        }

        // Create task in Tududi - map title to name
        const tududiBuildTask = {
          name: taskData.title.trim(),
          description: taskData.notes || '',
          due_date: taskData.due_date,
          priority: taskData.priority
        };
        const task = await this.tududuClient.createTask(tududiBuildTask);
        logger.info(`Task created: ${task.id}`);

        // Sync to Obsidian
        try {
          await this.fileManager.appendTaskToDailyNote({
            title: taskData.title,
            due_date: taskData.due_date,
            time_estimate: taskData.time_estimate,
            energy_level: taskData.energy_level,
            project: taskData.project,
            priority: taskData.priority,
            notes: taskData.notes,
            id: task.id
          });
        } catch (obsidianError) {
          logger.warn(`Obsidian sync failed: ${obsidianError.message}`);
        }

        createdTasks.push(task);
      } catch (error) {
        logger.error(`Failed to create task "${taskData.title}": ${error.message}`);
        failedTasks.push({ title: taskData.title, error: error.message });
      }
    }

    // Send confirmation
    let response = '';
    if (createdTasks.length > 0) {
      if (createdTasks.length === 1) {
        const task = createdTasks[0];
        response = `✅ Task created: *${task.name}*\n\n` +
          `📅 Due: ${task.due_date || 'Not set'}\n` +
          `📝 Note: ${task.description || 'None'}`;
      } else {
        const taskList = createdTasks
          .map(t => `• ${t.name}`)
          .join('\n');
        response = `✅ Created ${createdTasks.length} tasks:\n\n${taskList}`;
      }

      // Add failed tasks info if any
      if (failedTasks.length > 0) {
        response += `\n\n⚠️ Failed: ${failedTasks.map(t => t.title).join(', ')}`;
      }
    } else if (failedTasks.length > 0) {
      response = `❌ Failed to create tasks:\n\n`;
      failedTasks.forEach(task => {
        response += `• ${task.title}: ${task.error}\n`;
      });
    } else {
      response = `❌ No tasks to create`;
    }

    if (statusMessageId) {
      await this.bot.editStatusMessage(statusMessageId, response);
    } else {
      await this.bot.sendMessage(response);
    }
  }

  async handleKnowledgeMessage(parsed, statusMessageId) {
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

      if (statusMessageId) {
        await this.bot.editStatusMessage(statusMessageId, response);
      } else {
        await this.bot.sendMessage(response);
      }
    } catch (error) {
      logger.error(`Failed to create knowledge: ${error.message}`);
      throw error;
    }
  }

  async handleQuestionMessage(parsed, statusMessageId) {
    // Placeholder for future semantic search
    const response = '❓ Question mode coming soon! For now, you can search manually in Obsidian.';

    if (statusMessageId) {
      await this.bot.editStatusMessage(statusMessageId, response);
    } else {
      await this.bot.sendMessage(response);
    }
  }
}

module.exports = MessageOrchestrator;
