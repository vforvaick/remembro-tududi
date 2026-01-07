const BaseLLMProvider = require('./base-provider');
const logger = require('../../utils/logger');

/**
 * GeminiProvider with:
 * - Smart model routing based on input length
 * - Multi-key rotation on rate limit (429)
 * - Retry with exponential backoff
 */
class GeminiProvider extends BaseLLMProvider {
  constructor(config) {
    super('Gemini', config);

    // Parse multiple API keys (comma-separated)
    this.apiKeys = this._parseApiKeys(config.apiKey || config.apiKeys);
    this.currentKeyIndex = 0;

    // Model configuration
    this.models = {
      short: config.modelShort || 'gemma-3-27b',      // < 100 chars, 30 RPM
      medium: config.modelMedium || 'gemini-2.5-flash-lite', // 100-500 chars, 10 RPM
      long: config.modelLong || 'gemini-2.5-flash',   // > 500 chars, 5 RPM
      vision: config.modelVision || 'gemini-2.0-flash' // Photo parsing (updated for compatibility)
    };

    this.maxTokens = config.maxTokens || 4096;
    this.maxRetries = config.maxRetries || 3;
    this.sdkAvailable = false;
    this.genAIInstances = [];

    // Initialize SDK with all keys
    this._initializeSDK();
  }

  _parseApiKeys(keyInput) {
    if (!keyInput) return [];
    if (Array.isArray(keyInput)) return keyInput;
    return keyInput.split(',').map(k => k.trim()).filter(k => k.length > 0);
  }

  _initializeSDK() {
    if (this.apiKeys.length === 0) {
      logger.warn(`${this.name}: No API keys provided`);
      return;
    }

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');

      // Create a GenAI instance for each key
      for (const key of this.apiKeys) {
        this.genAIInstances.push(new GoogleGenerativeAI(key));
      }

      this.sdkAvailable = true;
      logger.info(`${this.name}: Initialized with ${this.apiKeys.length} API key(s)`);
      logger.info(`${this.name}: Models - short:${this.models.short}, medium:${this.models.medium}, long:${this.models.long}`);
    } catch (error) {
      logger.warn(`${this.name}: SDK not installed. Run: npm install @google/generative-ai`);
      this.sdkAvailable = false;
    }
  }

  /**
   * Select appropriate model based on input length
   */
  selectModel(inputText) {
    const charCount = inputText?.length || 0;

    if (charCount < 100) {
      return this.models.short;
    } else if (charCount < 500) {
      return this.models.medium;
    } else {
      return this.models.long;
    }
  }

  /**
   * Get current GenAI instance and rotate on failure
   */
  _getCurrentGenAI() {
    return this.genAIInstances[this.currentKeyIndex];
  }

  _rotateKey() {
    const oldIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.genAIInstances.length;
    logger.info(`${this.name}: Rotated API key ${oldIndex + 1} → ${this.currentKeyIndex + 1}`);
    return this.currentKeyIndex !== oldIndex; // Returns false if we've cycled through all
  }

  async _executeWithRetry(fn, retries = this.maxRetries) {
    let lastError;
    let keysExhausted = false;
    const startKeyIndex = this.currentKeyIndex;

    for (let attempt = 0; attempt < retries && !keysExhausted; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        const isRateLimit = error.message?.includes('429') ||
          error.message?.includes('quota') ||
          error.message?.includes('rate');

        if (isRateLimit && this.genAIInstances.length > 1) {
          logger.warn(`${this.name}: Rate limited, rotating key...`);
          this._rotateKey();

          // Check if we've cycled through all keys
          if (this.currentKeyIndex === startKeyIndex) {
            keysExhausted = true;
            logger.error(`${this.name}: All API keys exhausted`);
          }
        } else if (attempt < retries - 1) {
          // Exponential backoff for non-rate-limit errors
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(`${this.name}: Retry ${attempt + 1}/${retries} after ${delay}ms`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }

  async sendMessage(userMessage, options = {}) {
    if (!this.sdkAvailable || this.genAIInstances.length === 0) {
      throw new Error(`${this.name}: Provider not properly configured`);
    }

    return this._executeWithRetry(async () => {
      const genAI = this._getCurrentGenAI();
      const modelName = options.model || this.selectModel(userMessage);
      const modelInstance = genAI.getGenerativeModel({ model: modelName });

      logger.info(`${this.name}: Using model ${modelName} (key ${this.currentKeyIndex + 1}/${this.genAIInstances.length})`);

      // Build the prompt with system prompt if provided
      let fullPrompt = userMessage;
      if (options.systemPrompt) {
        fullPrompt = `${options.systemPrompt}\n\n${userMessage}`;
      }

      const result = await modelInstance.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Invalid response structure from Gemini API');
      }

      logger.info(`${this.name}: Received response from ${modelName}`);
      return responseText;
    });
  }

  /**
   * Send message with image for vision tasks
   */
  async sendMessageWithImage(prompt, imageBuffer, mimeType = 'image/jpeg') {
    if (!this.sdkAvailable || this.genAIInstances.length === 0) {
      throw new Error(`${this.name}: Provider not properly configured`);
    }

    return this._executeWithRetry(async () => {
      const genAI = this._getCurrentGenAI();
      const modelInstance = genAI.getGenerativeModel({ model: this.models.vision });

      logger.info(`${this.name}: Vision with ${this.models.vision} (key ${this.currentKeyIndex + 1})`);

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: mimeType
        }
      };

      const result = await modelInstance.generateContent([prompt, imagePart]);
      const response = await result.response;
      const responseText = response.text();

      if (!responseText) {
        throw new Error('Invalid response structure from Gemini Vision API');
      }

      logger.info(`${this.name}: Received vision response`);
      return responseText;
    });
  }

  isConfigured() {
    return this.apiKeys.length > 0 && this.sdkAvailable;
  }

  isVisionConfigured() {
    return this.isConfigured();
  }

  getStats() {
    return {
      totalKeys: this.apiKeys.length,
      currentKeyIndex: this.currentKeyIndex,
      models: this.models,
      sdkAvailable: this.sdkAvailable
    };
  }
}

module.exports = GeminiProvider;


