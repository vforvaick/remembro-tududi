const TelegramBotAPI = require('node-telegram-bot-api');
const logger = require('../utils/logger');

class TelegramBot {
  constructor(config) {
    this.token = config.token;
    // Support both old (userId) and new (allowedUsers) config formats
    this.allowedUsers = config.allowedUsers || (config.userId ? [parseInt(config.userId)] : []);
    // Keep userId for backward compatibility (first allowed user)
    this.userId = this.allowedUsers[0];
    // Track current chat for context-aware replies
    this.currentChatId = null;
    this.bot = new TelegramBotAPI(this.token, { polling: true });

    logger.info(`Telegram bot initialized with ${this.allowedUsers.length} allowed user(s)`);
  }

  isAuthorized(msg) {
    return this.allowedUsers.includes(msg.from.id);
  }

  onMessage(handler) {
    this.bot.on('message', async (msg) => {
      if (!this.isAuthorized(msg)) {
        logger.warn(`Unauthorized access attempt from user ${msg.from.id}`);
        return;
      }

      // Skip voice messages (handled separately)
      if (msg.voice) {
        return;
      }

      // Set current chat context for replies
      this.currentChatId = msg.chat.id;

      try {
        await handler(msg);
      } catch (error) {
        logger.error(`Message handler error: ${error.message}`);
        await this.sendMessage(`❌ Error: ${error.message}`);
      }
    });
  }

  onVoiceMessage(handler) {
    this.bot.on('voice', async (msg) => {
      if (!this.isAuthorized(msg)) {
        logger.warn(`Unauthorized voice message from user ${msg.from.id}`);
        return;
      }

      // Set current chat context for replies
      this.currentChatId = msg.chat.id;

      try {
        await handler(msg);
      } catch (error) {
        logger.error(`Voice handler error: ${error.message}`);
        await this.sendMessage(`❌ Voice processing error: ${error.message}`);
      }
    });
  }

  onCommand(command, handler) {
    this.bot.onText(new RegExp(`^/${command}`), async (msg) => {
      if (!this.isAuthorized(msg)) {
        return;
      }

      // Set current chat context for replies
      this.currentChatId = msg.chat.id;

      try {
        await handler(msg);
      } catch (error) {
        logger.error(`Command handler error: ${error.message}`);
        await this.sendMessage(`❌ Error: ${error.message}`);
      }
    });
  }

  async sendMessage(text, options = {}) {
    try {
      const defaultOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      };

      // Use provided chatId, or currentChatId, or fall back to first allowed user
      const chatId = options.chatId || this.currentChatId || this.userId;
      delete options.chatId; // Remove from options before spreading

      await this.bot.sendMessage(
        chatId,
        text,
        { ...defaultOptions, ...options }
      );

      logger.info(`Message sent to user ${chatId}`);
    } catch (error) {
      logger.error(`Failed to send message: ${error.message}`);
      throw error;
    }
  }

  async sendStatusMessage(text, chatId = null) {
    try {
      const defaultOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      };

      const targetChatId = chatId || this.currentChatId || this.userId;

      const msg = await this.bot.sendMessage(
        targetChatId,
        text,
        defaultOptions
      );

      logger.info(`Status message sent with ID: ${msg.message_id} to ${targetChatId}`);
      return msg.message_id;
    } catch (error) {
      logger.error(`Failed to send status message: ${error.message}`);
      throw error;
    }
  }

  async editStatusMessage(messageId, text, chatId = null) {
    try {
      const defaultOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      };

      const targetChatId = chatId || this.currentChatId || this.userId;

      await this.bot.editMessageText(
        text,
        {
          chat_id: targetChatId,
          message_id: messageId,
          ...defaultOptions
        }
      );

      logger.info(`Status message ${messageId} updated for ${targetChatId}`);
    } catch (error) {
      logger.error(`Failed to edit status message: ${error.message}`);
      throw error;
    }
  }

  async downloadVoice(fileId) {
    try {
      const file = await this.bot.getFile(fileId);
      const downloadPath = `/tmp/${fileId}.ogg`;
      await this.bot.downloadFile(fileId, '/tmp');
      logger.info(`Voice file downloaded: ${downloadPath}`);
      return downloadPath;
    } catch (error) {
      logger.error(`Failed to download voice: ${error.message}`);
      throw error;
    }
  }

  async sendInlineKeyboard(text, buttons) {
    const keyboard = {
      inline_keyboard: buttons.map(row =>
        row.map(btn => ({
          text: btn.text,
          callback_data: btn.data
        }))
      )
    };

    await this.sendMessage(text, { reply_markup: keyboard });
  }

  onCallbackQuery(handler) {
    this.bot.on('callback_query', async (query) => {
      if (!this.allowedUsers.includes(query.from.id)) {
        logger.warn(`Unauthorized callback query from user ${query.from.id}`);
        return;
      }

      // Set current chat context
      this.currentChatId = query.message?.chat?.id || query.from.id;

      try {
        await handler(query);
        await this.bot.answerCallbackQuery(query.id);
      } catch (error) {
        logger.error(`Callback query error: ${error.message}`);
      }
    });
  }
}

module.exports = TelegramBot;
