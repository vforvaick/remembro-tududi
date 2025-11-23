const ProviderFactory = require('./provider-factory');
const logger = require('../utils/logger');

/**
 * LLM Client with automatic fallback support
 * Tries providers in order until one succeeds
 */
class LLMClient {
  constructor(config) {
    this.providers = ProviderFactory.createProviders(config);

    if (this.providers.length === 0) {
      throw new Error('No LLM providers configured. Please check your configuration.');
    }

    logger.info(`LLM Client initialized with ${this.providers.length} provider(s): ${this.providers.map(p => p.name).join(', ')}`);
  }

  /**
   * Send a message using fallback strategy
   * Tries each provider in order until one succeeds
   * @param {string} userMessage - The message to send
   * @param {object} options - Options including systemPrompt, maxTokens
   * @returns {Promise<string>} - The LLM response text
   */
  async sendMessage(userMessage, options = {}) {
    const errors = [];

    for (const provider of this.providers) {
      try {
        logger.info(`Attempting to use ${provider.name} provider`);
        const response = await provider.sendMessage(userMessage, options);
        logger.info(`Successfully used ${provider.name} provider`);
        return response;
      } catch (error) {
        logger.warn(`${provider.name} provider failed: ${error.message}`);
        errors.push({
          provider: provider.name,
          error: error.message
        });

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    const errorMessage = `All LLM providers failed:\n${errors.map(e => `- ${e.provider}: ${e.error}`).join('\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Send a message and parse the response as JSON
   * Uses fallback strategy across providers
   * @param {string} userMessage - The message to send
   * @param {object} options - Options including systemPrompt, maxTokens
   * @returns {Promise<object>} - Parsed JSON object
   */
  async parseJSON(userMessage, options = {}) {
    const errors = [];

    for (const provider of this.providers) {
      try {
        logger.info(`Attempting to use ${provider.name} provider for JSON parsing`);
        const response = await provider.parseJSON(userMessage, options);
        logger.info(`Successfully used ${provider.name} provider for JSON parsing`);
        return response;
      } catch (error) {
        logger.warn(`${provider.name} provider failed for JSON parsing: ${error.message}`);
        errors.push({
          provider: provider.name,
          error: error.message
        });

        // Continue to next provider
        continue;
      }
    }

    // All providers failed
    const errorMessage = `All LLM providers failed for JSON parsing:\n${errors.map(e => `- ${e.provider}: ${e.error}`).join('\n')}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  /**
   * Get the list of configured provider names
   * @returns {Array<string>}
   */
  getProviderNames() {
    return this.providers.map(p => p.name);
  }

  /**
   * Get the primary (first) provider name
   * @returns {string}
   */
  getPrimaryProvider() {
    return this.providers[0]?.name || 'None';
  }
}

module.exports = LLMClient;
