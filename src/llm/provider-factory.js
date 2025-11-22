const ClaudeProvider = require('./providers/claude-provider');
const GeminiProvider = require('./providers/gemini-provider');
const MegaLMProvider = require('./providers/megalm-provider');
const OpenAIProvider = require('./providers/openai-provider');
const logger = require('../utils/logger');

class ProviderFactory {
  /**
   * Create an LLM provider instance based on the provider name
   * @param {string} providerName - Name of the provider (claude, gemini, megalm, openai)
   * @param {object} config - Configuration object for the provider
   * @returns {BaseLLMProvider|null} - Provider instance or null if not supported
   */
  static createProvider(providerName, config) {
    const name = providerName.toLowerCase();

    switch (name) {
      case 'claude':
        return new ClaudeProvider(config);

      case 'gemini':
        return new GeminiProvider(config);

      case 'megalm':
        return new MegaLMProvider(config);

      case 'openai':
      case 'gpt':
        return new OpenAIProvider(config);

      default:
        logger.warn(`Unknown LLM provider: ${providerName}`);
        return null;
    }
  }

  /**
   * Create multiple providers from configuration
   * @param {object} config - Full configuration object with providers list
   * @returns {Array<BaseLLMProvider>} - Array of configured providers
   */
  static createProviders(config) {
    const providers = [];
    const providerNames = config.llm?.providers || ['claude'];

    for (const providerName of providerNames) {
      const providerConfig = config[providerName.toLowerCase()];

      if (!providerConfig) {
        logger.warn(`No configuration found for provider: ${providerName}`);
        continue;
      }

      const provider = this.createProvider(providerName, providerConfig);

      if (provider && provider.isConfigured()) {
        providers.push(provider);
        logger.info(`Configured LLM provider: ${provider.name}`);
      } else {
        logger.warn(`Skipping unconfigured provider: ${providerName}`);
      }
    }

    if (providers.length === 0) {
      logger.warn('No LLM providers configured, using default Claude provider');
      // Fallback to Claude if no providers are configured
      const claudeProvider = new ClaudeProvider(config.anthropic || config.claude);
      if (claudeProvider.isConfigured()) {
        providers.push(claudeProvider);
      }
    }

    return providers;
  }
}

module.exports = ProviderFactory;
