const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class ClaudeClient {
  constructor(config) {
    this.model = config.model;
    this.maxTokens = config.maxTokens || 4096;
    this.anthropic = new Anthropic({
      apiKey: config.apiKey
    });
  }

  async sendMessage(userMessage, options = {}) {
    try {
      const messageParams = {
        model: this.model,
        max_tokens: options.maxTokens || this.maxTokens,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      };

      if (options.systemPrompt) {
        messageParams.system = options.systemPrompt;
      }

      logger.info('Sending message to Claude API');
      const response = await this.anthropic.messages.create(messageParams);

      const responseText = response.content[0].text;
      logger.info('Received response from Claude API');

      return responseText;
    } catch (error) {
      logger.error(`Claude API error: ${error.message}`);
      throw error;
    }
  }

  async parseJSON(userMessage, options = {}) {
    try {
      const response = await this.sendMessage(userMessage, {
        ...options,
        systemPrompt: (options.systemPrompt || '') +
          '\n\nYou must respond with valid JSON only. No explanation, just JSON.'
      });

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7, -3).trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3, -3).trim();
      }

      return JSON.parse(jsonText);
    } catch (error) {
      logger.error(`Failed to parse JSON from Claude: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ClaudeClient;
