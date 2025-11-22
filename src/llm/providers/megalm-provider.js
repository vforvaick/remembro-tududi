const BaseLLMProvider = require('./base-provider');
const logger = require('../../utils/logger');

class MegaLMProvider extends BaseLLMProvider {
  constructor(config) {
    super('MegaLM', config);
    this.model = config.model || 'megalm-default';
    this.maxTokens = config.maxTokens || 4096;
    this.baseURL = config.baseURL || 'https://api.megalm.ai/v1'; // Default endpoint

    // Lazy load axios for HTTP requests
    if (this.isConfigured()) {
      try {
        this.axios = require('axios');
      } catch (error) {
        logger.warn(`${this.name}: axios not installed. Run: npm install axios`);
        this.axios = null;
      }
    }
  }

  async sendMessage(userMessage, options = {}) {
    if (!this.axios) {
      throw new Error(`${this.name}: Provider not properly configured or axios not installed`);
    }

    try {
      logger.info(`${this.name}: Sending message to API`);

      // Build messages array (OpenAI-compatible format)
      const messages = [];

      if (options.systemPrompt) {
        messages.push({
          role: 'system',
          content: options.systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: userMessage
      });

      const response = await this.axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: messages,
          max_tokens: options.maxTokens || this.maxTokens,
          temperature: options.temperature || 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure from MegaLM API');
      }

      const responseText = response.data.choices[0].message.content;
      logger.info(`${this.name}: Received response from API`);

      return responseText;
    } catch (error) {
      logger.error(`${this.name}: API error: ${error.message}`);
      throw error;
    }
  }

  isConfigured() {
    return !!this.config?.apiKey;
  }
}

module.exports = MegaLMProvider;
