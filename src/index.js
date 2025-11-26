const config = require('./config');
const logger = require('./utils/logger');

// Initialize clients and services
const TelegramBot = require('./bot/telegram-bot');
const VoiceTranscriber = require('./bot/voice-transcriber');
const LLMClient = require('./llm/llm-client');
const TaskParser = require('./llm/task-parser');
const DailyPlanner = require('./llm/daily-planner');
const TududuClient = require('./tududi/client');
const ObsidianFileManager = require('./obsidian/file-manager');
const ObsidianSyncWatcher = require('./obsidian/sync-watcher');
const MessageOrchestrator = require('./orchestrator');
const { initializeShiftSchedule } = require('./shift-schedule');

async function main() {
  try {
    logger.info('Starting AI-Powered ADHD Task Management System...');

    // Initialize services
    const bot = new TelegramBot({
      token: config.telegram.botToken,
      userId: config.telegram.userId
    });

    const transcriber = new VoiceTranscriber({
      apiKey: config.openai.apiKey
    });

    const llmClient = new LLMClient(config);

    const taskParser = new TaskParser(llmClient);

    const tududuClient = new TududuClient({
      apiUrl: config.tududi.apiUrl,
      apiToken: config.tududi.apiToken
    });

    const fileManager = new ObsidianFileManager({
      vaultPath: config.obsidian.vaultPath,
      dailyNotesPath: config.obsidian.dailyNotesPath
    });

    const dailyPlanner = new DailyPlanner(llmClient, tududuClient);

    // Initialize shift schedule if Google Sheets ID is configured
    let shiftSchedule = null;
    if (config.googleSheetId) {
      try {
        shiftSchedule = await initializeShiftSchedule({
          googleSheetId: config.googleSheetId,
          shiftDataPath: '.cache/shifts.json',
          autoFetch: true
        });
        logger.info('✅ Shift schedule initialized');
      } catch (error) {
        logger.warn(`⚠️ Shift schedule initialization failed: ${error.message}. Continuing without shift awareness.`);
      }
    }

    const orchestrator = new MessageOrchestrator({
      taskParser,
      tududuClient,
      fileManager,
      bot,
      shiftManager: shiftSchedule?.manager
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
      } catch (error) {
        logger.error(`Failed to sync task completion: ${error.message}`);
      }
    });

    syncWatcher.start();

    // Set up Telegram bot handlers
    bot.onMessage(async (msg) => {
      const message = msg.text;
      logger.info(`Received message: ${message}`);
      await orchestrator.handleMessage(message);
    });

    bot.onVoiceMessage(async (msg) => {
      try {
        logger.info('Received voice message');
        await bot.sendMessage('🎤 Transcribing voice message...');

        // Download and transcribe
        const voiceFilePath = await bot.downloadVoice(msg.voice.file_id);
        const transcription = await transcriber.transcribe(voiceFilePath);

        logger.info(`Transcription: ${transcription}`);
        await bot.sendMessage(`📝 Transcribed: "${transcription}"\n\nProcessing...`);

        // Process transcribed message
        await orchestrator.handleMessage(transcription);
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
        '/chaos - Enable chaos mode\n' +
        '/normal - Disable chaos mode\n' +
        '/status - Show system status'
      );
    });

    bot.onCommand('help', async () => {
      await bot.sendMessage(
        '**How to use:**\n\n' +
        '• Just send a message with tasks or ideas\n' +
        '• Use voice messages for faster capture\n' +
        '• Tasks are automatically parsed and organized\n' +
        '• Knowledge is saved to Obsidian\n\n' +
        '**Examples:**\n' +
        '• "beli susu anak besok"\n' +
        '• "meeting with client next Monday 2pm"\n' +
        '• "bitcoin dips before US open" (knowledge)\n\n' +
        '**Special features:**\n' +
        '• Natural language dates (besok, next week, etc.)\n' +
        '• Multiple tasks in one message\n' +
        '• Indonesian language support'
      );
    });

    bot.onCommand('status', async () => {
      const tasks = await tududuClient.getTasks({ completed: false });
      const providerNames = llmClient.getProviderNames();
      await bot.sendMessage(
        `**System Status** ✅\n\n` +
        `📋 Active tasks: ${tasks.length}\n` +
        `🧠 LLM Providers: ${providerNames.join(' → ')}\n` +
        `🎯 Primary: ${llmClient.getPrimaryProvider()}\n` +
        `💾 Obsidian: Connected\n` +
        `📡 Tududi API: Connected`
      );
    });

    bot.onCommand('plan', async (msg) => {
      try {
        await bot.sendMessage('🤔 Generating your daily plan...');

        // For now, assume 8 hours available (can be improved with calendar integration)
        const plan = await dailyPlanner.generatePlan({
          available_hours: 8,
          description: '8 hours free time today'
        });

        const message = dailyPlanner.formatPlanMessage(plan);
        await bot.sendMessage(message);
      } catch (error) {
        await bot.sendMessage(`❌ Failed to generate plan: ${error.message}`);
      }
    });

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
