const BaseLLMProvider = require('./base-provider');
const logger = require('../../utils/logger');

class GeminiProvider extends BaseLLMProvider {
  constructor(config) {
    super('Gemini', config);
    this.model = config.model || 'gemini-pro';
    this.visionModel = config.visionModel || 'gemini-1.5-flash';
    this.maxTokens = config.maxTokens || 4096;
    this.sdkAvailable = false;

    // Lazy load Google Generative AI SDK
    if (config?.apiKey) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        this.genAI = new GoogleGenerativeAI(config.apiKey);
        this.modelInstance = this.genAI.getGenerativeModel({ model: this.model });
        this.visionModelInstance = this.genAI.getGenerativeModel({ model: this.visionModel });
        this.sdkAvailable = true;
      } catch (error) {
        logger.warn(`${this.name}: SDK not installed. Run: npm install @google/generative-ai`);
        this.genAI = null;
        this.modelInstance = null;
        this.visionModelInstance = null;
        this.sdkAvailable = false;
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

  /**
   * Send message with image for vision tasks
   * @param {string} prompt - Text prompt
   * @param {Buffer} imageBuffer - Image data as Buffer
   * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
   */
  async sendMessageWithImage(prompt, imageBuffer, mimeType = 'image/jpeg') {
    if (!this.visionModelInstance) {
      throw new Error(`${this.name}: Vision model not properly configured or SDK not installed`);
    }

    try {
      logger.info(`${this.name}: Sending image to Vision API (${this.visionModel})`);

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const result = await this.visionModelInstance.generateContent([prompt, imagePart]);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Invalid response structure from Gemini Vision API');
      }

      logger.info(`${this.name}: Received vision response from API`);
      return responseText;
    } catch (error) {
      logger.error(`${this.name}: Vision API error: ${error.message}`);
      throw error;
    }
  }

  isConfigured() {
    return !!this.config?.apiKey && this.sdkAvailable;
  }

  isVisionConfigured() {
    return !!this.visionModelInstance && this.sdkAvailable;
  }
}

module.exports = GeminiProvider;

