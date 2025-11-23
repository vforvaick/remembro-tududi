const ClaudeProvider = require('./providers/claude-provider');
const GeminiProvider = require('./providers/gemini-provider');
const MegaLLMProvider = require('./providers/megallm-provider');
const OpenAIProvider = require('./providers/openai-provider');
const logger = require('../utils/logger');

class ProviderFactory {
  /**
   * Create an LLM provider instance based on the provider name
   * @param {string} providerName - Name of the provider (claude, gemini, megallm, openai)
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

      case 'megallm':
        return new MegaLLMProvider(config);

      case 'openai':
      case 'gpt':
        return new OpenAIProvider(config);

      default:
        logger.warn(`Unknown LLM provider: ${providerName}`);
        return null;
    }
  }

  /**
   * Normalize provider alias to config key
   * @param {string} providerName - Provider name or alias
   * @returns {string} - Config key for the provider
   */
  static normalizeProviderKey(providerName) {
    const normalized = providerName.toLowerCase();
    // Map aliases to actual config keys
    const aliasMap = {
      'gpt': 'openai'
    };
    return aliasMap[normalized] || normalized;
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
      // Normalize provider name to get correct config key (e.g., 'gpt' -> 'openai')
      const configKey = this.normalizeProviderKey(providerName);
      const providerConfig = config[configKey];

      if (!providerConfig) {
        logger.warn(`No configuration found for provider: ${providerName} (config key: ${configKey})`);
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
