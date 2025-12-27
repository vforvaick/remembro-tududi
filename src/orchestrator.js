const logger = require('./utils/logger');
const conversationState = require('./state/conversation-state');

class MessageOrchestrator {
  constructor(dependencies) {
    this.taskParser = dependencies.taskParser;
    this.tududiClient = dependencies.tududiClient;
    this.fileManager = dependencies.fileManager;
    this.bot = dependencies.bot;
    this.knowledgeSearch = dependencies.knowledgeSearch;
    this.peopleService = dependencies.peopleService;
  }

  /**
   * Main entry point for message handling
   * @param {string} message - The message text
   * @param {object} context - Optional context (userId, source, etc.)
   */
  async handleMessage(message, context = {}) {
    const userId = context.userId || 'default';
    let statusMessageId = null;

    try {
      // Check for pending confirmation first (story flow)
      const pendingState = conversationState.get(userId);
      if (pendingState && pendingState.type === 'story_confirmation') {
        return await this.handleStoryConfirmation(message, pendingState, userId);
      }

      logger.info('Processing message...');

      // Send initial status message
      try {
        statusMessageId = await this.bot.sendStatusMessage('🤔 Let me think...');
      } catch (statusErr) {
        logger.warn(`Failed to send status message: ${statusErr.message}, continuing without it`);
      }

      // Parse message with LLM
      const parsed = await this.taskParser.parse(message, { source: context.source || 'text' });
      logger.info(`Message parsed as type: ${parsed.type}`);

      // Route to appropriate handler
      switch (parsed.type) {
        case 'greeting':
          await this.handleGreetingMessage(parsed, statusMessageId);
          break;
        case 'chitchat':
          await this.handleChitchatMessage(parsed, statusMessageId);
          break;
        case 'story':
          await this.handleStoryMessage(parsed, statusMessageId, userId);
          break;
        case 'task':
          await this.handleTaskMessage(parsed, statusMessageId);
          break;
        case 'knowledge':
          await this.handleKnowledgeMessage(parsed, statusMessageId);
          break;
        case 'question':
          await this.handleQuestionMessage(parsed, statusMessageId);
          break;
        default:
          // Fallback - treat as task
          logger.warn(`Unknown message type: ${parsed.type}, treating as task`);
          await this.handleTaskMessage(parsed, statusMessageId);
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

  /**
   * Handle greeting messages
   */
  async handleGreetingMessage(parsed, statusMessageId) {
    const response = parsed.response || 'Halo! 👋 Ada yang bisa aku bantu hari ini?';

    if (statusMessageId) {
      await this.bot.editStatusMessage(statusMessageId, response);
    } else {
      await this.bot.sendMessage(response);
    }
  }

  /**
   * Handle chitchat messages
   */
  async handleChitchatMessage(parsed, statusMessageId) {
    const response = parsed.response || '😊 Aku di sini kalau butuh bantuan ya!';

    if (statusMessageId) {
      await this.bot.editStatusMessage(statusMessageId, response);
    } else {
      await this.bot.sendMessage(response);
    }
  }

  /**
   * Handle story messages - extract potential tasks and offer confirmation
   */
  async handleStoryMessage(parsed, statusMessageId, userId) {
    const tasks = parsed.potential_tasks || [];
    const summary = parsed.summary || 'I understood your message';

    if (tasks.length === 0) {
      // No tasks extracted, just acknowledge
      const response = `📝 ${summary}\n\n_Ada yang perlu aku bantu?_`;
      if (statusMessageId) {
        await this.bot.editStatusMessage(statusMessageId, response);
      } else {
        await this.bot.sendMessage(response);
      }
      return;
    }

    // Build confirmation message with task list
    let response = `📖 *Aku paham:* ${summary}\n\n`;
    response += `📋 *Suggested tasks:*\n`;
    tasks.forEach((t, i) => {
      response += `${i + 1}. ${t.title}`;
      if (t.sequence_order && tasks.length > 1) {
        response += ` _(step ${t.sequence_order})_`;
      }
      response += `\n`;
    });
    response += `\n_Reply dengan nomor (cth: "1,2") atau "all" / "skip"_`;

    // Store state for confirmation
    conversationState.set(userId, {
      type: 'story_confirmation',
      summary: summary,
      potential_tasks: tasks,
      people_mentioned: parsed.people_mentioned || []
    });

    if (statusMessageId) {
      await this.bot.editStatusMessage(statusMessageId, response);
    } else {
      await this.bot.sendMessage(response);
    }
  }

  /**
   * Handle story confirmation response
   */
  async handleStoryConfirmation(message, state, userId) {
    const input = message.toLowerCase().trim();

    // Handle skip/cancel
    if (input === 'skip' || input === 'tidak' || input === 'no' || input === 'batal') {
      conversationState.clear(userId);
      await this.bot.sendMessage('👍 Okay, tidak ada task yang dibuat.');
      return;
    }

    const tasks = state.potential_tasks;
    let selectedIndices = [];

    // Handle "all" or "yes"
    if (input === 'all' || input === 'semua' || input === 'yes' || input === 'ya' || input === 'iya') {
      selectedIndices = tasks.map((_, i) => i);
    } else {
      // Parse "1,2,3" or "1 2 3" or "1"
      selectedIndices = input.split(/[,\s]+/)
        .map(n => parseInt(n) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < tasks.length);
    }

    if (selectedIndices.length === 0) {
      await this.bot.sendMessage('❓ Aku tidak mengerti. Reply dengan nomor, "all", atau "skip".');
      return;
    }

    // Create selected tasks
    const selectedTasks = selectedIndices.map(i => tasks[i]);
    const storyId = `story-${Date.now()}`;
    const createdTasks = [];
    const failedTasks = [];

    for (const [index, task] of selectedTasks.entries()) {
      try {
        // Build notes with story context
        const notes = [
          task.context || '',
          `📖 Story: ${storyId}`,
          `🔢 Sequence: ${task.sequence_order || index + 1}/${selectedTasks.length}`,
          index > 0 ? `⬅️ After: ${selectedTasks[index - 1].title}` : ''
        ].filter(Boolean).join('\n');

        const taskData = {
          name: task.title.trim(),
          description: notes,
          due_date: task.due_date || null,
          priority: task.priority || 'medium'
        };

        const created = await this.tududiClient.createTask(taskData);
        logger.info(`Story task created: ${created.id}`);

        // Sync to Obsidian
        try {
          await this.fileManager.appendTaskToDailyNote({
            title: task.title,
            due_date: task.due_date,
            priority: task.priority,
            notes: notes,
            id: created.id
          });
        } catch (obsidianError) {
          logger.warn(`Obsidian sync failed: ${obsidianError.message}`);
        }

        createdTasks.push(created);
      } catch (error) {
        logger.error(`Failed to create task "${task.title}": ${error.message}`);
        failedTasks.push({ title: task.title, error: error.message });
      }
    }

    // Track people mentioned
    if (this.peopleService && state.people_mentioned?.length > 0) {
      for (const personName of state.people_mentioned) {
        try {
          this.peopleService.markAsPending(personName, state.summary);
        } catch (err) {
          logger.warn(`Failed to track person ${personName}: ${err.message}`);
        }
      }
    }

    // Clear conversation state
    conversationState.clear(userId);

    // Build response
    let response = '';
    if (createdTasks.length > 0) {
      if (createdTasks.length === 1) {
        response = `✅ Task created: *${createdTasks[0].name}*`;
      } else {
        const taskList = createdTasks.map((t, i) => `${i + 1}. ${t.name}`).join('\n');
        response = `✅ Created ${createdTasks.length} tasks:\n\n${taskList}`;
      }

      if (selectedTasks.length > 1) {
        response += `\n\n📎 _Linked as sequence (Story: ${storyId.slice(-8)})_`;
      }

      if (failedTasks.length > 0) {
        response += `\n\n⚠️ Failed: ${failedTasks.map(t => t.title).join(', ')}`;
      }
    } else if (failedTasks.length > 0) {
      response = `❌ Failed to create tasks:\n\n`;
      failedTasks.forEach(task => {
        response += `• ${task.title}: ${task.error}\n`;
      });
    }

    await this.bot.sendMessage(response);
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
        const task = await this.tududiClient.createTask(tududiBuildTask);
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

    // Track people mentioned in the message (async, non-blocking)
    if (this.peopleService && parsed.people_mentioned && parsed.people_mentioned.length > 0) {
      for (const personName of parsed.people_mentioned) {
        try {
          const wasPending = this.peopleService.markAsPending(
            personName,
            tasks.map(t => t.title).join(', ')
          );
          if (wasPending) {
            logger.info(`Queued unknown person: ${personName}`);
          } else {
            // Person is known, increment their task count
            this.peopleService.incrementTaskCount(personName);
          }
        } catch (err) {
          logger.warn(`Failed to track person ${personName}: ${err.message}`);
        }
      }
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
        const task = await this.tududiClient.createTask(parsed.actionTask);
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
    try {
      // Use knowledge search if available
      if (this.knowledgeSearch) {
        const query = parsed.query || parsed.content || parsed.title;
        logger.info(`Searching knowledge base for: ${query}`);

        const result = await this.knowledgeSearch.handleQuery(query);

        let response;
        if (result && result.results && result.results.length > 0) {
          response = result.formatted;
        } else {
          response = `❓ No matching knowledge found for "${query}".\n\n` +
            `_Try a different search term or use /search <query>._`;
        }

        if (statusMessageId) {
          await this.bot.editStatusMessage(statusMessageId, response);
        } else {
          await this.bot.sendMessage(response);
        }
      } else {
        // Fallback if knowledge search not configured
        const response = '❓ Knowledge search is not configured. Use /search <query> instead.';

        if (statusMessageId) {
          await this.bot.editStatusMessage(statusMessageId, response);
        } else {
          await this.bot.sendMessage(response);
        }
      }
    } catch (error) {
      logger.error(`Question handling failed: ${error.message}`);
      const response = `❌ Search failed: ${error.message}`;

      if (statusMessageId) {
        await this.bot.editStatusMessage(statusMessageId, response);
      } else {
        await this.bot.sendMessage(response);
      }
    }
  }
}

module.exports = MessageOrchestrator;

