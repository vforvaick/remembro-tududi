const logger = require('./utils/logger');
const conversationState = require('./state/conversation-state');
const extractorPrompt = require('./llm/prompts/extractor-prompt');
const companionPrompt = require('./llm/prompts/companion-prompt');

class MessageOrchestrator {
  constructor(dependencies) {
    this.llmClient = dependencies.llmClient;
    this.tududiClient = dependencies.tududiClient;
    this.fileManager = dependencies.fileManager;
    this.bot = dependencies.bot;
    this.knowledgeSearch = dependencies.knowledgeSearch;
    this.peopleService = dependencies.peopleService;
    this.projectService = dependencies.projectService;
    this.photoParser = dependencies.photoParser;
  }

  /**
   * Main entry point for message handling - Two-stage processing
   * Stage 1: Extract (pro model) -> strict JSON
   * Stage 2: Respond (flash model) -> empathetic reply
   */
  async handleMessage(message, context = {}) {
    const userId = context.userId || 'default';
    let statusMessageId = null;

    try {
      // Check for pending confirmation first
      const pendingState = conversationState.get(userId);
      if (pendingState) {
        if (pendingState.type === 'story_confirmation') {
          return await this.handleStoryConfirmation(message, pendingState, userId);
        }
        if (pendingState.type === 'tentative') {
          return await this.handleTentativeConfirmation(message, pendingState, userId);
        }
      }

      logger.info('Processing message with two-stage loop...');

      // Send initial status message
      try {
        statusMessageId = await this.bot.sendStatusMessage('🤔 Let me think...');
      } catch (statusErr) {
        logger.warn(`Failed to send status message: ${statusErr.message}`);
      }

      // === STAGE 1: EXTRACTION (pro model) ===
      const extracted = await this.extractIntent(message, context);
      logger.info(`Extracted intent: ${extracted.type} (confidence: ${extracted.confidence || 'N/A'})`);

      // Handle tentative state - needs confirmation before action
      if (extracted.needs_confirmation) {
        await this.handleTentativeExtraction(extracted, userId, statusMessageId);
        return;
      }

      // === EXECUTE ACTION based on extracted intent ===
      const actionResult = await this.executeAction(extracted, userId);

      // === STAGE 2: GENERATE RESPONSE (flash model) ===
      const response = await this.generateResponse(extracted, actionResult, message);

      if (statusMessageId) {
        await this.bot.editStatusMessage(statusMessageId, response);
      } else {
        await this.bot.sendMessage(response);
      }

      logger.info('Message processed successfully');
    } catch (error) {
      logger.error(`Message processing failed: ${error.message}`);
      await this.handleError(error, statusMessageId);
    }
  }

  /**
   * Stage 1: Extract intent and entities using pro model
   */
  async extractIntent(message, context = {}) {
    // Get known entities for prompt injection
    const knownPeople = this.peopleService?.getKnownPeopleForPrompt() || [];
    const knownProjects = this.projectService?.getKnownProjectsForPrompt() || [];

    const { systemPrompt, userPrompt } = extractorPrompt.buildPrompt(message, {
      source: context.source || 'text',
      knownPeople,
      knownProjects
    });

    const extracted = await this.llmClient.parseJSON(userPrompt, {
      systemPrompt,
      model: 'pro' // Use pro model for extraction
    });

    return extracted;
  }

  /**
   * Stage 2: Generate empathetic response using flash model
   */
  async generateResponse(extracted, actionResult, originalMessage) {
    const { systemPrompt, userPrompt } = companionPrompt.buildPrompt(
      extracted,
      actionResult,
      originalMessage
    );

    const response = await this.llmClient.sendMessage(userPrompt, {
      systemPrompt,
      model: 'flash' // Use flash model for response
    });

    return response;
  }

  /**
   * Execute action based on extracted intent
   */
  async executeAction(extracted, userId) {
    const result = { action: null, data: null };

    switch (extracted.type) {
      case 'greeting':
      case 'chitchat':
        result.action = 'acknowledged';
        break;

      case 'story':
        if (extracted.potential_tasks?.length > 0) {
          // Store for confirmation
          conversationState.set(userId, {
            type: 'story_confirmation',
            summary: extracted.summary,
            potential_tasks: extracted.potential_tasks,
            people_mentioned: extracted.people_mentioned || []
          });
          result.action = 'awaiting_confirmation';
          result.data = { taskCount: extracted.potential_tasks.length };
        } else {
          result.action = 'acknowledged';
        }
        break;

      case 'task':
        if (extracted.tasks?.length > 0) {
          result.action = 'tasks_created';
          result.data = await this.createTasks(extracted.tasks, extracted.people_mentioned);
        }
        break;

      case 'knowledge':
        result.action = 'knowledge_saved';
        result.data = await this.saveKnowledge(extracted);
        break;

      case 'question':
        result.action = 'search_performed';
        result.data = await this.handleQuestion(extracted.query);
        break;

      default:
        result.action = 'unknown';
    }

    // Track entities
    this.trackEntities(extracted);

    return result;
  }

  /**
   * Handle tentative extraction - ask for confirmation
   */
  async handleTentativeExtraction(extracted, userId, statusMessageId) {
    conversationState.set(userId, {
      type: 'tentative',
      extracted,
      reason: extracted.confirmation_reason
    });

    let response = `🤔 Aku mau konfirmasi dulu:\n\n`;
    response += extracted.confirmation_reason || 'Ada beberapa hal yang kurang jelas.';
    response += `\n\n_Reply "ya" untuk lanjut, atau koreksi kalau ada yang salah._`;

    if (statusMessageId) {
      await this.bot.editStatusMessage(statusMessageId, response);
    } else {
      await this.bot.sendMessage(response);
    }
  }

  /**
   * Handle tentative confirmation response
   */
  async handleTentativeConfirmation(message, state, userId) {
    const input = message.toLowerCase().trim();

    if (input === 'ya' || input === 'yes' || input === 'iya' || input === 'ok' || input === 'oke') {
      // Clear tentative flag and proceed
      const extracted = { ...state.extracted, needs_confirmation: false };
      conversationState.clear(userId);

      const actionResult = await this.executeAction(extracted, userId);
      const response = await this.generateResponse(extracted, actionResult, message);
      await this.bot.sendMessage(response);
    } else if (input === 'tidak' || input === 'no' || input === 'batal' || input === 'skip') {
      conversationState.clear(userId);
      await this.bot.sendMessage('👍 Oke, dibatalkan.');
    } else {
      // Treat as a correction - re-process with the new message
      conversationState.clear(userId);
      await this.handleMessage(message, { userId });
    }
  }

  /**
   * Create tasks in Tududi
   */
  async createTasks(tasks, peopleMentioned = []) {
    const created = [];
    const failed = [];

    for (const taskData of tasks) {
      try {
        if (!taskData.title?.trim()) continue;

        const tududiTask = {
          name: taskData.title.trim(),
          description: taskData.notes || '',
          due_date: taskData.due_date,
          priority: taskData.priority
        };

        const task = await this.tududiClient.createTask(tududiTask);
        logger.info(`Task created: ${task.id}`);

        // Sync to Obsidian
        try {
          await this.fileManager?.appendTaskToDailyNote({
            title: taskData.title,
            due_date: taskData.due_date,
            time_estimate: taskData.time_estimate,
            energy_level: taskData.energy_level,
            project: taskData.project,
            priority: taskData.priority,
            notes: taskData.notes,
            id: task.id
          });
        } catch (err) {
          logger.warn(`Obsidian sync failed: ${err.message}`);
        }

        created.push(task);
      } catch (error) {
        logger.error(`Failed to create task: ${error.message}`);
        failed.push({ title: taskData.title, error: error.message });
      }
    }

    return { created, failed };
  }

  /**
   * Save knowledge to Obsidian
   */
  async saveKnowledge(extracted) {
    const notePath = await this.fileManager?.createKnowledgeNote({
      title: extracted.title,
      content: extracted.content,
      category: extracted.category,
      tags: extracted.tags || []
    });

    return { path: notePath };
  }

  /**
   * Handle question/search
   */
  async handleQuestion(query) {
    if (!this.knowledgeSearch) {
      return { found: false, message: 'Knowledge search not configured' };
    }

    const result = await this.knowledgeSearch.handleQuery(query);
    return {
      found: result?.results?.length > 0,
      results: result?.results || [],
      formatted: result?.formatted
    };
  }

  /**
   * Track entities mentioned (people/projects)
   */
  trackEntities(extracted) {
    // Track people
    if (this.peopleService && extracted.people_mentioned?.length > 0) {
      for (const person of extracted.people_mentioned) {
        try {
          if (person.is_known) {
            this.peopleService.incrementTaskCount(person.name);
          } else {
            this.peopleService.markAsPending(person.name, extracted.summary || '');
          }
        } catch (err) {
          logger.warn(`Failed to track person: ${err.message}`);
        }
      }
    }

    // Track projects
    if (this.projectService && extracted.projects_mentioned?.length > 0) {
      for (const project of extracted.projects_mentioned) {
        try {
          if (project.is_known) {
            this.projectService.incrementTaskCount(project.name);
          } else {
            this.projectService.markAsPending(project.name, extracted.summary || '');
          }
        } catch (err) {
          logger.warn(`Failed to track project: ${err.message}`);
        }
      }
    }
  }

  /**
   * Handle story confirmation flow
   */
  async handleStoryConfirmation(message, state, userId) {
    const input = message.toLowerCase().trim();

    if (input === 'skip' || input === 'tidak' || input === 'no' || input === 'batal') {
      conversationState.clear(userId);
      await this.bot.sendMessage('👍 Okay, tidak ada task yang dibuat.');
      return;
    }

    const tasks = state.potential_tasks;
    let selectedIndices = [];

    if (input === 'all' || input === 'semua' || input === 'yes' || input === 'ya' || input === 'iya') {
      selectedIndices = tasks.map((_, i) => i);
    } else {
      selectedIndices = input.split(/[,\s]+/)
        .map(n => parseInt(n) - 1)
        .filter(n => !isNaN(n) && n >= 0 && n < tasks.length);
    }

    if (selectedIndices.length === 0) {
      await this.bot.sendMessage('❓ Reply dengan nomor, "all", atau "skip".');
      return;
    }

    const selectedTasks = selectedIndices.map(i => tasks[i]);
    const { created, failed } = await this.createTasks(selectedTasks, state.people_mentioned);

    conversationState.clear(userId);

    // Build response
    let response = '';
    if (created.length > 0) {
      if (created.length === 1) {
        response = `✅ Task created: *${created[0].name}*`;
      } else {
        response = `✅ Created ${created.length} tasks:\n${created.map((t, i) => `${i + 1}. ${t.name}`).join('\n')}`;
      }
      if (failed.length > 0) {
        response += `\n\n⚠️ Failed: ${failed.map(t => t.title).join(', ')}`;
      }
    } else if (failed.length > 0) {
      response = `❌ Failed to create tasks:\n${failed.map(t => `• ${t.title}: ${t.error}`).join('\n')}`;
    }

    await this.bot.sendMessage(response);
  }

  /**
   * Handle photo messages
   */
  async handlePhotoMessage(imageBuffer, mimeType, context = {}) {
    const userId = context.userId || 'default';

    try {
      if (!this.photoParser) {
        await this.bot.sendMessage('📸 Photo parsing tidak aktif.');
        return;
      }

      const parsed = await this.photoParser.parse(imageBuffer, mimeType);

      if (!parsed.potential_tasks?.length) {
        await this.bot.sendMessage(`📸 *Analyzed:* ${parsed.summary}\n\n_Tidak ada task terdeteksi._`);
        return;
      }

      // Reuse story confirmation flow
      let response = `📸 Image: ${parsed.summary}\n\n`;
      response += `📋 *Found ${parsed.potential_tasks.length} potential task(s):*\n`;
      parsed.potential_tasks.forEach((t, i) => {
        response += `${i + 1}. ${t.title}\n`;
      });
      response += `\n_Reply dengan nomor atau "all" / "skip"_`;

      conversationState.set(userId, {
        type: 'story_confirmation',
        summary: parsed.summary,
        potential_tasks: parsed.potential_tasks,
        people_mentioned: parsed.people_mentioned || []
      });

      await this.bot.sendMessage(response);
    } catch (error) {
      logger.error(`Photo handling failed: ${error.message}`);
      await this.bot.sendMessage(`❌ Gagal menganalisis gambar: ${error.message}`);
    }
  }

  /**
   * Handle errors
   */
  async handleError(error, statusMessageId) {
    let userMessage = `❌ Sorry, couldn't process that.\n\nError: ${error.message}`;

    const isQuotaError = error.message.includes('429') ||
      error.message.toLowerCase().includes('quota') ||
      error.message.toLowerCase().includes('rate limit');

    if (isQuotaError) {
      userMessage = '⚠️ **AI Quota Exhausted**\n\nMaaf, kuota AI habis. Tunggu sebentar ya.';
    }

    try {
      if (statusMessageId) {
        await this.bot.editStatusMessage(statusMessageId, userMessage);
      } else {
        await this.bot.sendMessage(userMessage);
      }
    } catch (editError) {
      logger.error(`Failed to send error message: ${editError.message}`);
    }
  }
}

module.exports = MessageOrchestrator;
