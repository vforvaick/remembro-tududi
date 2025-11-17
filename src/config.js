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

module.exports = {
  telegram: {
    botToken: required('TELEGRAM_BOT_TOKEN'),
    userId: required('TELEGRAM_USER_ID'),
  },
  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
  },
  openai: {
    apiKey: required('OPENAI_API_KEY'),
  },
  tududi: {
    apiUrl: required('TUDUDI_API_URL'),
    apiToken: required('TUDUDI_API_TOKEN'),
  },
  obsidian: {
    vaultPath: required('OBSIDIAN_VAULT_PATH'),
    dailyNotesPath: optional('OBSIDIAN_DAILY_NOTES_PATH', 'Daily Notes'),
  },
  claude: {
    model: optional('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
    maxTokens: parseInteger('CLAUDE_MAX_TOKENS', process.env.CLAUDE_MAX_TOKENS, '4096'),
  },
  timezone: optional('TIMEZONE', 'Asia/Jakarta'),
  port: parseInteger('PORT', process.env.PORT, '3001'),
};
