const BaseLLMProvider = require('./base-provider');
const logger = require('../../utils/logger');

class OpenAIProvider extends BaseLLMProvider {
  constructor(config) {
    super('OpenAI', config);
    this.model = config.model || 'gpt-4';
    this.maxTokens = config.maxTokens || 4096;
    this.openai = null;

    // Lazy load OpenAI SDK (reuse existing package)
    if (config?.apiKey) {
      try {
        const OpenAI = require('openai');
        this.openai = new OpenAI({
          apiKey: config.apiKey
        });
      } catch (error) {
        logger.warn(`${this.name}: SDK not installed. Run: npm install openai`);
        this.openai = null;
      }
    }
  }

  async sendMessage(userMessage, options = {}) {
    if (!this.openai) {
      throw new Error(`${this.name}: Provider not properly configured or SDK not installed`);
    }

    try {
      logger.info(`${this.name}: Sending message to API`);

      // Build messages array
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

      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || 0.7
      });

      if (!completion.choices?.[0]?.message?.content) {
        throw new Error('Invalid response structure from OpenAI API');
      }

      const responseText = completion.choices[0].message.content;
      logger.info(`${this.name}: Received response from API`);

      return responseText;
    } catch (error) {
      logger.error(`${this.name}: API error: ${error.message}`);
      throw error;
    }
  }

  isConfigured() {
    return !!this.config?.apiKey && !!this.openai;
  }
}

module.exports = OpenAIProvider;
