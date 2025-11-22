require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`${name} is required in environment variables`);
  }
  return value;
}

function optional(name, defaultValue) {
  return process.env[name] || defaultValue;
}

function parseInteger(name, value, defaultValue) {
  const toparse = value || defaultValue;
  const parsed = parseInt(toparse);
  if (isNaN(parsed)) {
    throw new Error(`${name} must be a valid number, got: ${toparse}`);
  }
  return parsed;
}

function parseProviderList(value, defaultValue) {
  if (!value || value.trim() === '') {
    return defaultValue;
  }
  // Split by comma and trim whitespace
  return value.split(',').map(p => p.trim()).filter(p => p.length > 0);
}

function optionalKey(name) {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    return null;
  }
  return value;
}

module.exports = {
  telegram: {
    botToken: required('TELEGRAM_BOT_TOKEN'),
    userId: required('TELEGRAM_USER_ID'),
  },
  // LLM Provider List (fallback order)
  llm: {
    providers: parseProviderList(process.env.LLM_PROVIDERS, ['claude']),
  },
  // Provider-specific configurations
  anthropic: {
    apiKey: optionalKey('ANTHROPIC_API_KEY'),
    model: optional('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
    maxTokens: parseInteger('CLAUDE_MAX_TOKENS', process.env.CLAUDE_MAX_TOKENS, '4096'),
  },
  claude: {
    apiKey: optionalKey('ANTHROPIC_API_KEY'),
    model: optional('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
    maxTokens: parseInteger('CLAUDE_MAX_TOKENS', process.env.CLAUDE_MAX_TOKENS, '4096'),
  },
  gemini: {
    apiKey: optionalKey('GEMINI_API_KEY'),
    model: optional('GEMINI_MODEL', 'gemini-pro'),
    maxTokens: parseInteger('GEMINI_MAX_TOKENS', process.env.GEMINI_MAX_TOKENS, '4096'),
  },
  megalm: {
    apiKey: optionalKey('MEGALM_API_KEY'),
    model: optional('MEGALM_MODEL', 'megalm-default'),
    maxTokens: parseInteger('MEGALM_MAX_TOKENS', process.env.MEGALM_MAX_TOKENS, '4096'),
    baseURL: optional('MEGALM_BASE_URL', 'https://api.megalm.ai/v1'),
  },
  openai: {
    apiKey: optionalKey('OPENAI_API_KEY') || required('OPENAI_API_KEY'), // Keep required for backward compatibility with Whisper
    model: optional('OPENAI_MODEL', 'gpt-4'),
    maxTokens: parseInteger('OPENAI_MAX_TOKENS', process.env.OPENAI_MAX_TOKENS, '4096'),
  },
  tududi: {
    apiUrl: required('TUDUDI_API_URL'),
    apiToken: required('TUDUDI_API_TOKEN'),
  },
  obsidian: {
    vaultPath: required('OBSIDIAN_VAULT_PATH'),
    dailyNotesPath: optional('OBSIDIAN_DAILY_NOTES_PATH', 'Daily Notes'),
  },
  timezone: optional('TIMEZONE', 'Asia/Jakarta'),
  port: parseInteger('PORT', process.env.PORT, '3001'),
};
