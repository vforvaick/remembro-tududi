const CLIProxyProvider = require('./providers/cliproxy-provider');
const logger = require('../utils/logger');

/**
 * LLM Client - Simplified, CLIProxy-centric
 * Uses CLIProxy as the sole provider with model aliases (flash/pro)
 */
class LLMClient {
  constructor(config) {
    const cliproxyConfig = config.cliproxy || config;
    this.provider = new CLIProxyProvider(cliproxyConfig);

    if (!this.provider.isConfigured()) {
      throw new Error('CLIProxy provider is not configured. Check CLIPROXY_API_KEY and CLIPROXY_BASE_URL.');
    }

    logger.info(`LLM Client initialized with CLIProxy (${this.provider.baseURL})`);
  }

  /**
   * Send a message to the LLM
   * @param {string} userMessage - The message to send
   * @param {object} options - Options including systemPrompt, maxTokens, model
   * @returns {Promise<string>} - The LLM response text
   */
  async sendMessage(userMessage, options = {}) {
    return this.provider.sendMessage(userMessage, options);
  }

  /**
   * Send a message and parse the response as JSON
   * @param {string} userMessage - The message to send
   * @param {object} options - Options including systemPrompt, maxTokens, model
   * @returns {Promise<object>} - Parsed JSON object
   */
  async parseJSON(userMessage, options = {}) {
    return this.provider.parseJSON(userMessage, options);
  }

  /**
   * Send a message with an image (vision)
   */
  async sendMessageWithImage(prompt, imageBuffer, mimeType = 'image/jpeg') {
    return this.provider.sendMessageWithImage(prompt, imageBuffer, mimeType);
  }

  /**
   * Get provider info
   */
  getProviderName() {
    return this.provider.name;
  }

  getStats() {
    return this.provider.getStats();
  }
}

module.exports = LLMClient;
