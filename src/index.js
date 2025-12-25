const config = require('./config');
const logger = require('./utils/logger');
const schedule = require('node-schedule');

// Initialize clients and services
const TelegramBot = require('./bot/telegram-bot');
const VoiceTranscriber = require('./bot/voice-transcriber');
const LLMClient = require('./llm/llm-client');
const TaskParser = require('./llm/task-parser');
const EventParser = require('./llm/event-parser');
const DailyPlanner = require('./llm/daily-planner');
const TududuClient = require('./tududi/client');
const ObsidianFileManager = require('./obsidian/file-manager');
const ObsidianSyncWatcher = require('./obsidian/sync-watcher');
const MessageOrchestrator = require('./orchestrator');
const {
  initializeShiftSchedule,
  formatTodayShiftMessage,
  formatWeekShiftMessage,
  refreshShiftData,
  syncShiftsToCalendar
} = require('./shift-schedule');
const PlanCommand = require('./commands/plan-command');
const { ArticleParser } = require('./article-parser');
const { KnowledgeSearchService } = require('./knowledge-search');
const ChaosMode = require('./chaos-mode');
const ReschedulingService = require('./rescheduling');
const RecurringService = require('./recurring');
const WeeklyReviewService = require('./weekly-review');
const ElevenLabsTranscriber = require('./bot/elevenlabs-transcriber');
const GoogleCalendarService = require('./calendar/google-calendar');

async function main() {
  try {
    logger.info('Starting AI-Powered ADHD Task Management System...');

    // Initialize services
    const bot = new TelegramBot({
      token: config.telegram.botToken,
      allowedUsers: config.telegram.allowedUsers
    });

    const transcriber = new VoiceTranscriber({
      apiKey: config.openai.apiKey
    });

    const llmClient = new LLMClient(config);

    const taskParser = new TaskParser(llmClient);
    const eventParser = new EventParser(llmClient);

    const tududuClient = new TududuClient({
      apiUrl: config.tududi.apiUrl,
      apiToken: config.tududi.apiToken
    });

    const fileManager = new ObsidianFileManager({
      vaultPath: config.obsidian.vaultPath,
      dailyNotesPath: config.obsidian.dailyNotesPath
    });

    const dailyPlanner = new DailyPlanner(llmClient, tududuClient);

    // Initialize shift schedule if configured
    let shiftSchedule = null;
    const sheetId = config.shiftSchedule?.spreadsheetId || config.googleSheetId;
    if (sheetId) {
      try {
        shiftSchedule = await initializeShiftSchedule({
          googleSheetId: sheetId,
          userName: config.shiftSchedule?.userName,
          shiftDataPath: '.cache/shifts.json',
          autoFetch: true
        });
        logger.info('✅ Shift schedule initialized');
      } catch (error) {
        logger.warn(`⚠️ Shift schedule initialization failed: ${error.message}. Continuing without shift awareness.`);
      }
    }

    // Initialize article parser
    const articleParser = new ArticleParser({
      vaultPath: config.obsidian.vaultPath
    });
    logger.info('✅ Article parser initialized');

    // Initialize knowledge search
    const knowledgeSearch = new KnowledgeSearchService({
      vaultPath: config.obsidian.vaultPath
    });
    logger.info('✅ Knowledge search service initialized');

    // Initialize plan command
    const planCommand = new PlanCommand({
      shiftManager: shiftSchedule?.manager,
      tududi: tududuClient,
      dailyPlanner: dailyPlanner
    });
    logger.info('✅ Plan command initialized');

    // Initialize chaos mode service
    const chaosMode = new ChaosMode();
    logger.info('✅ Chaos mode service initialized');

    // Initialize rescheduling service
    const rescheduler = new ReschedulingService({
      tududuClient,
      bot
    });
    logger.info('✅ Rescheduling service initialized');

    // Initialize recurring tasks service
    const recurringService = new RecurringService({
      tududuClient,
      storagePath: '.cache/recurring-tasks.json'
    });
    await recurringService.initialize();
    logger.info('✅ Recurring tasks service initialized');

    // Initialize weekly review service
    const weeklyReview = new WeeklyReviewService({
      tududuClient
    });
    logger.info('✅ Weekly review service initialized');

    // Initialize ElevenLabs transcriber if API key is configured
    let elevenLabsTranscriber = null;
    if (config.elevenlabs?.apiKey) {
      elevenLabsTranscriber = new ElevenLabsTranscriber({
        apiKey: config.elevenlabs.apiKey
      });
      logger.info('✅ ElevenLabs transcriber initialized (diarization enabled)');
    } else {
      logger.info('ℹ️ ElevenLabs not configured, using OpenAI Whisper without diarization');
    }

    // Initialize Google Calendar service
    const calendarService = new GoogleCalendarService({
      keyFilePath: config.googleCalendar?.keyFilePath,
      calendarId: config.googleCalendar?.calendarId
    });
    await calendarService.initialize();

    const orchestrator = new MessageOrchestrator({
      taskParser,
      tududuClient,
      fileManager,
      bot,
      shiftManager: shiftSchedule?.manager,
      articleParser,
      knowledgeSearch
    });

    // Set up Obsidian sync watcher
    const syncWatcher = new ObsidianSyncWatcher({
      vaultPath: config.obsidian.vaultPath
    });

    syncWatcher.onTaskChange(async (change) => {
      try {
        logger.info(`Syncing task ${change.taskId} completion to Tududi`);
        await tududuClient.updateTask(change.taskId, {
          completed: change.completed
        });

        // If task completed and it's recurring, generate next instance
        if (change.completed) {
          const nextTask = await recurringService.generateNextInstance(change.taskId);
          if (nextTask) {
            await bot.sendMessage(
              `🔁 Recurring task completed! Next instance created:\n` +
              `*${nextTask.name}* - due ${nextTask.due_date}`
            );
          }
        }
      } catch (error) {
        logger.error(`Failed to sync task completion: ${error.message}`);
      }
    });

    syncWatcher.start();

    // Set up Telegram bot handlers
    bot.onMessage(async (msg) => {
      const message = msg.text;
      logger.info(`Received message: ${message}`);

      // Check if message contains URLs (for article parsing)
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = message.match(urlRegex);

      if (urls && urls.length > 0) {
        try {
          logger.info(`Found ${urls.length} URL(s) in message, attempting article parsing`);
          const articleResult = await articleParser.handleArticleMessage(message);

          if (articleResult.type === 'article_urls_found') {
            await bot.sendMessage(articleResult.formatted);

            // Offer to save articles
            for (const result of articleResult.results) {
              if (result.parseResult.success) {
                const suggestedTopic = result.suggestedTopics[0] || 'Uncategorized';
                await bot.sendMessage(
                  `📖 Found: ${result.parseResult.content.title}\n` +
                  `📁 Save as: *${suggestedTopic}*?`,
                  {
                    reply_markup: {
                      inline_keyboard: [[
                        { text: '✅ Save', callback_data: `save_article:${result.url}:${suggestedTopic}` },
                        { text: '⏭️ Skip', callback_data: 'skip_article' }
                      ]]
                    }
                  }
                );
              }
            }
            return;
          }
        } catch (articleError) {
          logger.warn(`Article parsing failed: ${articleError.message}, falling back to normal handling`);
        }
      }

      // Fall back to orchestrator for normal message handling
      await orchestrator.handleMessage(message);
    });

    bot.onVoiceMessage(async (msg) => {
      try {
        logger.info('Received voice message');

        // Use ElevenLabs if configured (has diarization), otherwise OpenAI Whisper
        if (elevenLabsTranscriber && elevenLabsTranscriber.isConfigured()) {
          await bot.sendMessage('🎤 Transcribing with speaker detection...');
          const voiceFilePath = await bot.downloadVoice(msg.voice.file_id);
          const result = await elevenLabsTranscriber.transcribeWithDiarization(voiceFilePath);

          if (result.speakerCount > 1) {
            logger.info(`Detected ${result.speakerCount} speakers`);
            await bot.sendMessage(`📝 *Transcription (${result.speakerCount} speakers):*\n\n${result.formatted}\n\nProcessing...`);
          } else {
            await bot.sendMessage(`📝 Transcribed: "${result.text}"\n\nProcessing...`);
          }

          await orchestrator.handleMessage(result.text);
        } else {
          await bot.sendMessage('🎤 Transcribing voice message...');
          const voiceFilePath = await bot.downloadVoice(msg.voice.file_id);
          const transcription = await transcriber.transcribe(voiceFilePath);

          logger.info(`Transcription: ${transcription}`);
          await bot.sendMessage(`📝 Transcribed: "${transcription}"\n\nProcessing...`);

          await orchestrator.handleMessage(transcription);
        }
      } catch (error) {
        logger.error(`Voice processing error: ${error.message}`);
        await bot.sendMessage('❌ Failed to process voice message');
      }
    });

    // Register commands
    bot.onCommand('start', async () => {
      await bot.sendMessage(
        '👋 Welcome to your AI-powered task assistant!\n\n' +
        'Send me tasks, ideas, or knowledge and I\'ll organize them for you.\n\n' +
        '**Commands:**\n' +
        '/help - Show help\n' +
        '/plan - Generate daily plan\n' +
        '/shift - View work shift schedule\n' +
        '/chaos - Enable chaos mode\n' +
        '/normal - Disable chaos mode\n' +
        '/reschedule - View and reschedule overdue tasks\n' +
        '/recurring - View registered recurring tasks\n' +
        '/review - Weekly productivity summary\n' +
        '/status - Show system status\n' +
        '/today - Today\'s calendar events\n' +
        '/calendar - Upcoming events\n' +
        '/schedule - Create a new event'
      );
    });

    bot.onCommand('help', async () => {
      await bot.sendMessage(
        '**How to use:**\n\n' +
        '• Just send a message with tasks or ideas\n' +
        '• Use voice messages for faster capture\n' +
        '• Tasks are automatically parsed and organized\n' +
        '• Share article links to save them\n' +
        '• Search your knowledge base\n\n' +
        '**Commands:**\n' +
        '/plan [today|tomorrow|YYYY-MM-DD] - Generate shift-aware daily plan\n' +
        '/search <query> - Search your knowledge notes\n' +
        '/summary - Get summary of all knowledge\n' +
        '/status - System status\n\n' +
        '**Examples:**\n' +
        '• "beli susu anak besok"\n' +
        '• "meeting with client next Monday 2pm"\n' +
        '• "bitcoin dips before US open"\n' +
        '• https://medium.com/article-link\n' +
        '• /search bitcoin\n' +
        '• /plan tomorrow\n\n' +
        '**Special features:**\n' +
        '• Natural language dates (besok, next week, etc.)\n' +
        '• Multiple tasks in one message\n' +
        '• Shift-aware time blocking\n' +
        '• Multi-source article parsing\n' +
        '• Indonesian language support'
      );
    });

    bot.onCommand('status', async () => {
      const tasks = await tududuClient.getTasks({ completed: false });
      const providerNames = llmClient.getProviderNames();
      const shiftStatus = shiftSchedule ? '✅ Enabled' : '⏸️ Disabled';

      await bot.sendMessage(
        `**System Status** ✅\n\n` +
        `📋 Active tasks: ${tasks.length}\n` +
        `🧠 LLM Providers: ${providerNames.join(' → ')}\n` +
        `🎯 Primary: ${llmClient.getPrimaryProvider()}\n` +
        `⏰ Shift Schedule: ${shiftStatus}\n` +
        `💾 Obsidian: Connected\n` +
        `🔍 Knowledge Search: Enabled\n` +
        `📖 Article Parser: Enabled\n` +
        `📡 Tududi API: Connected`
      );
    });

    bot.onCommand('plan', async (msg) => {
      try {
        const commandText = msg.text || '/plan';
        const timeframeArg = commandText.split(' ').slice(1).join(' ').trim();

        await bot.sendMessage('🤔 Generating your shift-aware daily plan...');

        const result = await planCommand.generatePlanForDate(timeframeArg || 'today');
        await bot.sendMessage(result.formatted);
      } catch (error) {
        await bot.sendMessage(`❌ Failed to generate plan: ${error.message}`);
      }
    });

    bot.onCommand('chaos', async (msg) => {
      try {
        const chatId = msg.chat.id;
        chaosMode.activate(chatId);

        // Fetch incomplete tasks and filter them
        const allTasks = await tududuClient.getTasks({ completed: false });
        const filteredTasks = chaosMode.filterTasks(allTasks, chatId);

        const response = chaosMode.formatChaosModeMessage(filteredTasks);
        await bot.sendMessage(response);
      } catch (error) {
        logger.error(`Chaos mode activation failed: ${error.message}`);
        await bot.sendMessage(`❌ Failed to activate chaos mode: ${error.message}`);
      }
    });

    bot.onCommand('normal', async (msg) => {
      try {
        const chatId = msg.chat.id;
        const status = chaosMode.getStatus(chatId);
        chaosMode.deactivate(chatId);

        const response = chaosMode.formatNormalModeMessage(status.duration);
        await bot.sendMessage(response);
      } catch (error) {
        logger.error(`Normal mode restoration failed: ${error.message}`);
        await bot.sendMessage(`❌ Failed to restore normal mode: ${error.message}`);
      }
    });

    // Reschedule command handler
    bot.onCommand('reschedule', async (msg) => {
      try {
        const overdueWithSuggestions = await rescheduler.getOverdueWithSuggestions();
        const message = rescheduler.formatOverdueMessage(overdueWithSuggestions);

        if (overdueWithSuggestions.length > 0) {
          const keyboard = rescheduler.buildRescheduleKeyboard(overdueWithSuggestions);
          await bot.sendMessage(message, { reply_markup: keyboard });
        } else {
          await bot.sendMessage(message);
        }
      } catch (error) {
        logger.error(`Reschedule command failed: ${error.message}`);
        await bot.sendMessage(`❌ Failed to check overdue tasks: ${error.message}`);
      }
    });

    // Recurring tasks command handler
    bot.onCommand('recurring', async (msg) => {
      try {
        const recurring = recurringService.getAll();

        if (recurring.length === 0) {
          await bot.sendMessage(
            '🔁 *No recurring tasks registered*\n\n' +
            '_Create a task with phrases like "every day", "weekly", or "every Monday" to make it recurring._'
          );
          return;
        }

        let message = `🔁 *${recurring.length} Recurring Task${recurring.length > 1 ? 's' : ''}*\n\n`;

        recurring.forEach((r, i) => {
          const pattern = recurringService.formatPattern(r.pattern);
          message += `${i + 1}. *${r.template.name || r.template.title}*\n`;
          message += `   📅 ${pattern}\n`;
          message += `   🕗 Last: ${r.lastGenerated.split('T')[0]}\n\n`;
        });

        await bot.sendMessage(message);
      } catch (error) {
        logger.error(`Recurring command failed: ${error.message}`);
        await bot.sendMessage(`❌ Failed to get recurring tasks: ${error.message}`);
      }
    });

    // Weekly review command handler
    bot.onCommand('review', async (msg) => {
      try {
        const review = await weeklyReview.generateReview();
        await bot.sendMessage(review.formatted);
      } catch (error) {
        logger.error(`Review command failed: ${error.message}`);
        await bot.sendMessage(`❌ Failed to generate review: ${error.message}`);
      }
    });

    // Today's calendar command handler
    bot.onCommand('today', async (msg) => {
      try {
        if (!calendarService.isConfigured()) {
          await bot.sendMessage('📅 Google Calendar not configured.\n\n_Set up with GOOGLE_CALENDAR_KEY_FILE in .env_');
          return;
        }
        const message = await calendarService.formatTodayMessage();
        await bot.sendMessage(message);
      } catch (error) {
        logger.error(`Today command failed: ${error.message}`);
        await bot.sendMessage(`❌ Failed to get calendar: ${error.message}`);
      }
    });

    // Upcoming calendar command handler
    bot.onCommand('calendar', async (msg) => {
      try {
        if (!calendarService.isConfigured()) {
          await bot.sendMessage('📅 Google Calendar not configured.\n\n_Set up with GOOGLE_CALENDAR_KEY_FILE in .env_');
          return;
        }
        const commandText = msg.text || '/calendar';
        const daysArg = commandText.replace('/calendar', '').trim();
        const days = parseInt(daysArg, 10) || 7;
        const message = await calendarService.formatUpcomingMessage(days);
        await bot.sendMessage(message);
      } catch (error) {
        logger.error(`Calendar command failed: ${error.message}`);
        await bot.sendMessage(`❌ Failed to get calendar: ${error.message}`);
      }
    });

    // Shift schedule command handler
    bot.onCommand('shift', async (msg) => {
      try {
        if (!shiftSchedule) {
          await bot.sendMessage('⏰ Shift schedule not configured.\n\n_Set up with SHIFT_SPREADSHEET_ID in .env_');
          return;
        }

        const commandText = msg.text || '/shift';
        const subCommand = commandText.replace('/shift', '').trim().toLowerCase();

        if (subCommand === 'week') {
          // Show this week's shifts
          const message = await formatWeekShiftMessage(shiftSchedule.manager, shiftSchedule.parser);
          await bot.sendMessage(message);
        } else if (subCommand === 'sync') {
          // Sync shifts to Google Calendar
          if (!calendarService.isConfigured()) {
            await bot.sendMessage('📅 Google Calendar not configured.\n\n_Set up with GOOGLE_CALENDAR_KEY_FILE in .env to enable sync._');
            return;
          }
          await bot.sendMessage('🔄 Syncing shifts to Google Calendar...');
          const result = await syncShiftsToCalendar(calendarService, shiftSchedule.manager, shiftSchedule.parser);
          await bot.sendMessage(
            `✅ *Calendar Sync Complete*\n\n` +
            `📅 Created: ${result.created} events\n` +
            `⏭️ Skipped: ${result.skipped} (off days)\n` +
            `❌ Errors: ${result.errors}`
          );
        } else if (subCommand === 'refresh') {
          // Force refresh shift data from Google Sheets
          await bot.sendMessage('🔄 Refreshing shift data from Google Sheets...');
          await refreshShiftData(shiftSchedule);
          const data = await shiftSchedule.manager.getShiftData();
          await bot.sendMessage(
            `✅ *Shift Data Refreshed*\n\n` +
            `📅 Month: ${data.monthLabel || 'Unknown'}\n` +
            `👤 User: ${data.userName || 'Unknown'}\n` +
            `📊 Shifts: ${data.shifts?.length || 0} days\n` +
            `🕐 Updated: ${new Date().toLocaleTimeString('id-ID')}`
          );
        } else {
          // Default: show today's shift
          const message = await formatTodayShiftMessage(shiftSchedule.manager, shiftSchedule.parser);
          await bot.sendMessage(message);
        }
      } catch (error) {
        logger.error(`Shift command failed: ${error.message}`);
        await bot.sendMessage(`❌ Failed to get shift schedule: ${error.message}`);
      }
    });

    // Schedule event command handler
    bot.onCommand('schedule', async (msg) => {
      try {
        if (!calendarService.isConfigured()) {
          await bot.sendMessage('📅 Google Calendar not configured.\n\n_Set up with GOOGLE_CALENDAR_KEY_FILE in .env_');
          return;
        }

        const commandText = msg.text || '/schedule';
        const eventText = commandText.replace('/schedule', '').trim();

        if (!eventText) {
          await bot.sendMessage('❓ Please describe the event.\n\n*Example:* /schedule Meeting with John tomorrow at 2pm');
          return;
        }

        await bot.sendMessage('🤔 Parsing event details...');

        try {
          const eventDetails = await eventParser.parseEvent(eventText);

          const createdEvent = await calendarService.createEvent(eventDetails);

          // Helper to format date based on whether it is a full ISO string (dateTime) or just date (date)
          const date = new Date(createdEvent.start.dateTime || createdEvent.start.date).toLocaleDateString('id-ID', {
            weekday: 'short', day: 'numeric', month: 'short'
          });

          // Helper to format time
          const time = calendarService.formatEventTime(createdEvent);

          await bot.sendMessage(
            `✅ *Event Created!*\n\n` +
            `📝 *${createdEvent.summary}*\n` +
            `📅 ${date}\n` +
            `⏰ ${time}\n` +
            (createdEvent.location ? `📍 ${createdEvent.location}` : '')
          );
        } catch (parseError) {
          await bot.sendMessage(`❌ Failed to create event: ${parseError.message}`);
        }

      } catch (error) {
        logger.error(`Schedule command failed: ${error.message}`);
        await bot.sendMessage(`❌ Schedule command failed: ${error.message}`);
      }
    });

    bot.onCommand('search', async (msg) => {
      try {
        const commandText = msg.text || '/search';
        const query = commandText.replace('/search', '').trim();

        if (!query) {
          await bot.sendMessage('❓ Please provide a search query.\n\n*Examples:*\n/search bitcoin\n/search trading strategies');
          return;
        }

        await bot.sendMessage('🔍 Searching your knowledge base...');

        const result = await knowledgeSearch.handleQuery(query);

        if (result.results && result.results.length > 0) {
          await bot.sendMessage(result.formatted);
        } else {
          await bot.sendMessage(`❌ No results found for: *${query}*`);
        }
      } catch (error) {
        logger.error(`Search failed: ${error.message}`);
        await bot.sendMessage(`❌ Search failed: ${error.message}`);
      }
    });

    bot.onCommand('summary', async (msg) => {
      try {
        await bot.sendMessage('📊 Generating knowledge summary...');

        const result = await knowledgeSearch.summarizeAll();

        if (result.success) {
          await bot.sendMessage(result.formatted);
        } else {
          await bot.sendMessage(`❌ Failed to generate summary: ${result.error}`);
        }
      } catch (error) {
        logger.error(`Summary failed: ${error.message}`);
        await bot.sendMessage(`❌ Summary failed: ${error.message}`);
      }
    });

    // Helper function to validate URLs (prevent SSRF attacks)
    const isValidUrl = (url) => {
      try {
        const parsed = new URL(url);
        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return false;
        }
        const hostname = parsed.hostname;
        // Block private IP ranges and localhost
        if (hostname === 'localhost' ||
          hostname === '127.0.0.1' ||
          hostname.match(/^127\./) ||
          hostname.match(/^10\./) ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./) ||
          hostname.match(/^192\.168\./) ||
          hostname.match(/^169\.254\./) ||
          hostname.match(/^::1/) || // IPv6 localhost
          hostname.match(/^fc00:|^fe80:/) // IPv6 private ranges
        ) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    };

    // Handle article saving callback
    // Note: Authorization is already handled by bot.onCallbackQuery
    bot.onCallbackQuery(async (query) => {
      const data = query.data;

      if (data.startsWith('save_article:')) {
        try {
          const parts = data.split(':');
          const url = parts.slice(1, -1).join(':'); // Handle URLs with colons
          const topic = parts[parts.length - 1];

          // Validate URL before processing (SSRF prevention)
          if (!isValidUrl(url)) {
            await bot.sendMessage('❌ Invalid or untrusted URL');
            logger.warn(`Rejected invalid URL: ${url}`);
            return;
          }

          // Parse the article
          const parseResult = await articleParser.parseUrl(url);

          if (parseResult.success) {
            const saveResult = await articleParser.saveArticle(
              parseResult.content,
              'Saved from Telegram',
              topic
            );

            await bot.sendMessage(
              `✅ Saved to 📁 *${topic}*\n\n${saveResult.message}`
            );
            logger.info(`Article saved: ${url}`);
          } else {
            await bot.sendMessage(`❌ Failed to save article: ${parseResult.error}`);
          }
        } catch (error) {
          logger.error(`Article saving failed: ${error.message}`);
          await bot.sendMessage(`❌ Error saving article: ${error.message}`);
        }
      } else if (data === 'skip_article') {
        await bot.sendMessage('⏭️ Article skipped');
      } else if (data.startsWith('reschedule:')) {
        // Handle reschedule callback
        try {
          const parts = data.split(':');
          const action = parts[1];

          if (action === 'dismiss') {
            await bot.sendMessage('👍 Overdue tasks dismissed. Use /reschedule to view them again.');
          } else if (action === 'all') {
            // Reschedule all overdue tasks
            const overdueWithSuggestions = await rescheduler.getOverdueWithSuggestions();
            let rescheduled = 0;
            for (const task of overdueWithSuggestions) {
              try {
                await rescheduler.applyReschedule(task.id, task.suggestion.suggestedDate);
                rescheduled++;
              } catch (e) {
                logger.error(`Failed to reschedule task ${task.id}: ${e.message}`);
              }
            }
            await bot.sendMessage(`✅ Rescheduled ${rescheduled} task${rescheduled !== 1 ? 's' : ''}!`);
          } else {
            // Reschedule single task
            const taskId = action;
            const newDate = parts[2];
            await rescheduler.applyReschedule(taskId, newDate);
            await bot.sendMessage(`✅ Task rescheduled to ${newDate}`);
          }
        } catch (error) {
          logger.error(`Reschedule callback failed: ${error.message}`);
          await bot.sendMessage(`❌ Reschedule failed: ${error.message}`);
        }
      }
    });

    // Schedule automatic daily plan generation (8 AM)
    schedule.scheduleJob('0 8 * * *', async () => {
      try {
        logger.info('⏰ Running scheduled daily plan generation...');
        const result = await planCommand.generatePlanForDate('today');

        await bot.sendMessage(
          '📅 *Good morning!* Here\'s your shift-aware daily plan:\n\n' +
          result.formatted
        );
        logger.info('✅ Daily plan sent successfully');
      } catch (error) {
        logger.error(`Failed to generate scheduled plan: ${error.message}`);
        // Notify user of failure for scheduled tasks
        try {
          await bot.sendMessage(
            '⚠️ Daily plan generation failed. Please use /plan to retry manually.'
          );
        } catch (notifyError) {
          logger.error(`Failed to notify user of plan generation failure: ${notifyError.message}`);
        }
      }
    });
    logger.info('📅 Scheduled daily plan generation at 08:00');

    // Schedule daily recurring task check (7 AM, before daily plan)
    schedule.scheduleJob('0 7 * * *', async () => {
      try {
        logger.info('🔁 Checking for due recurring tasks...');
        const generated = await recurringService.checkAndGenerate();
        if (generated.length > 0) {
          const taskList = generated.map(t => `• ${t.name}`).join('\n');
          await bot.sendMessage(
            `🔁 *${generated.length} Recurring Task${generated.length > 1 ? 's' : ''} Generated*\n\n${taskList}`
          );
        }
      } catch (error) {
        logger.error(`Recurring task check failed: ${error.message}`);
      }
    });
    logger.info('🔁 Scheduled recurring task check at 07:00');

    logger.info('System started successfully! 🚀');
    logger.info('Bot is now listening for messages...');

  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Start application
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
