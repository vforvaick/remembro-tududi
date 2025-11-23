const TelegramBotAPI = require('node-telegram-bot-api');
const logger = require('../utils/logger');

class TelegramBot {
  constructor(config) {
    this.token = config.token;
    this.userId = config.userId;
    this.bot = new TelegramBotAPI(this.token, { polling: true });

    logger.info('Telegram bot initialized');
  }

  isAuthorized(msg) {
    return msg.from.id === parseInt(this.userId);
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

      await this.bot.sendMessage(
        this.userId,
        text,
        { ...defaultOptions, ...options }
      );

      logger.info('Message sent to user');
    } catch (error) {
      logger.error(`Failed to send message: ${error.message}`);
      throw error;
    }
  }

  async sendStatusMessage(text) {
    try {
      const defaultOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      };

      const msg = await this.bot.sendMessage(
        this.userId,
        text,
        defaultOptions
      );

      logger.info(`Status message sent with ID: ${msg.message_id}`);
      return msg.message_id;
    } catch (error) {
      logger.error(`Failed to send status message: ${error.message}`);
      throw error;
    }
  }

  async editStatusMessage(messageId, text) {
    try {
      const defaultOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      };

      await this.bot.editMessageText(
        text,
        {
          chat_id: this.userId,
          message_id: messageId,
          ...defaultOptions
        }
      );

      logger.info(`Status message ${messageId} updated`);
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
      if (query.from.id !== parseInt(this.userId)) {
        return;
      }

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
