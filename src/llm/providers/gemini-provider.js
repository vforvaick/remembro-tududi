const BaseLLMProvider = require('./base-provider');
const logger = require('../../utils/logger');

class GeminiProvider extends BaseLLMProvider {
  constructor(config) {
    super('Gemini', config);
    this.model = config.model || 'gemini-pro';
    this.maxTokens = config.maxTokens || 4096;

    // Lazy load Google Generative AI SDK
    if (this.isConfigured()) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.genAI = new GoogleGenerativeAI(config.apiKey);
        this.modelInstance = this.genAI.getGenerativeModel({ model: this.model });
      } catch (error) {
        logger.warn(`${this.name}: SDK not installed. Run: npm install @google/generative-ai`);
        this.genAI = null;
      }
    }
  }

  async sendMessage(userMessage, options = {}) {
    if (!this.modelInstance) {
      throw new Error(`${this.name}: Provider not properly configured or SDK not installed`);
    }

    try {
      logger.info(`${this.name}: Sending message to API`);

      // Build the prompt with system prompt if provided
      let fullPrompt = userMessage;
      if (options.systemPrompt) {
        fullPrompt = `${options.systemPrompt}\n\n${userMessage}`;
      }

      const result = await this.modelInstance.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Invalid response structure from Gemini API');
      }

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

module.exports = GeminiProvider;
