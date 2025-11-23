const logger = require('../../utils/logger');

/**
 * Base class for LLM providers
 * All LLM providers must implement sendMessage and parseJSON methods
 */
class BaseLLMProvider {
  constructor(name, config) {
    this.name = name;
    this.config = config;
  }

  /**
   * Send a message to the LLM and get a text response
   * @param {string} userMessage - The message to send
   * @param {object} options - Options including systemPrompt, maxTokens
   * @returns {Promise<string>} - The LLM response text
   */
  async sendMessage(userMessage, options = {}) {
    throw new Error(`${this.name} provider must implement sendMessage()`);
  }

  /**
   * Send a message and parse the response as JSON
   * @param {string} userMessage - The message to send
   * @param {object} options - Options including systemPrompt, maxTokens
   * @returns {Promise<object>} - Parsed JSON object
   */
  async parseJSON(userMessage, options = {}) {
    try {
      const response = await this.sendMessage(userMessage, {
        ...options,
        systemPrompt: (options.systemPrompt || '') +
          '\n\nYou must respond with valid JSON only. No explanation, just JSON.'
      });

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = response.trim();
      // Extract JSON from markdown code blocks
      const jsonMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      return JSON.parse(jsonText);
    } catch (error) {
      logger.error(`${this.name}: Failed to parse JSON: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if this provider is properly configured
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.config?.apiKey;
  }
}

module.exports = BaseLLMProvider;
