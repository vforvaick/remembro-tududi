const Anthropic = require('@anthropic-ai/sdk');
const BaseLLMProvider = require('./base-provider');
const logger = require('../../utils/logger');

class ClaudeProvider extends BaseLLMProvider {
  constructor(config) {
    super('Claude', config);
    this.model = config.model || 'claude-3-5-sonnet-20241022';
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

      logger.info(`${this.name}: Sending message to API`);
      const response = await this.anthropic.messages.create(messageParams);

      if (!response.content || response.content.length === 0 || !response.content[0].text) {
        throw new Error('Invalid response structure from Claude API');
      }
      const responseText = response.content[0].text;
      logger.info(`${this.name}: Received response from API`);

      return responseText;
    } catch (error) {
      logger.error(`${this.name}: API error: ${error.message}`);
      throw error;
    }
  }

  isConfigured() {
    return !!this.config?.apiKey && !!this.anthropic;
  }
}

module.exports = ClaudeProvider;
