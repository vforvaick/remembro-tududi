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

function parseUserIdList(envName, legacyEnvName) {
  // Try new multi-user format first
  const multiUserValue = process.env[envName];
  if (multiUserValue && multiUserValue.trim() !== '') {
    return multiUserValue.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
  }
  // Fall back to legacy single user
  const legacyValue = process.env[legacyEnvName];
  if (legacyValue && legacyValue.trim() !== '') {
    const parsed = parseInt(legacyValue.trim());
    if (!isNaN(parsed)) {
      return [parsed];
    }
  }
  throw new Error(`Either ${envName} or ${legacyEnvName} is required in environment variables`);
}

module.exports = {
  telegram: {
    botToken: required('TELEGRAM_BOT_TOKEN'),
    allowedUsers: parseUserIdList('TELEGRAM_ALLOWED_USERS', 'TELEGRAM_USER_ID'),
    // Deprecated: kept for backward compatibility in code that still references userId
    get userId() {
      return this.allowedUsers[0];
    },
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
  // CLIProxyAPI - Main LLM provider (deployed on fight-cuatro)
  cliproxy: {
    baseURL: optional('CLIPROXY_BASE_URL', 'http://fight-cuatro:8317/v1'),
    apiKey: optionalKey('CLIPROXY_API_KEY'),
    modelShort: optional('CLIPROXY_MODEL_SHORT', 'gemini-2.5-flash-lite'),
    modelMedium: optional('CLIPROXY_MODEL_MEDIUM', 'gemini-2.5-flash'),
    modelLong: optional('CLIPROXY_MODEL_LONG', 'gemini-3-pro-preview'),
    modelVision: optional('CLIPROXY_MODEL_VISION', 'gemini-3-pro-image-preview'),
  },
  gemini: {
    // Support multiple keys: GEMINI_API_KEYS (comma-separated) or GEMINI_API_KEY (single)
    apiKey: optionalKey('GEMINI_API_KEYS') || optionalKey('GEMINI_API_KEY'),
    // Model routing (using only available models)
    modelShort: optional('GEMINI_MODEL_SHORT', 'gemini-2.5-flash-lite'),  // Fast, for short inputs
    modelMedium: optional('GEMINI_MODEL_MEDIUM', 'gemini-2.5-flash-lite'), // Balanced
    modelLong: optional('GEMINI_MODEL_LONG', 'gemini-2.5-flash'),          // Best quality for long
    modelVision: optional('GEMINI_MODEL_VISION', 'gemini-2.5-flash'),      // Vision capable
    maxTokens: parseInteger('GEMINI_MAX_TOKENS', process.env.GEMINI_MAX_TOKENS, '4096'),
  },
  megallm: {
    apiKey: optionalKey('MEGALLM_API_KEY'),
    model: optional('MEGALLM_MODEL', 'gpt-4o-mini'),
    maxTokens: parseInteger('MEGALLM_MAX_TOKENS', process.env.MEGALLM_MAX_TOKENS, '4096'),
    baseURL: optional('MEGALLM_BASE_URL', 'https://ai.megallm.io/v1'),
  },
  openai: {
    apiKey: optionalKey('OPENAI_API_KEY'), // Optional - Whisper transcription will fail gracefully if not set
    model: optional('OPENAI_MODEL', 'gpt-4'),
    maxTokens: parseInteger('OPENAI_MAX_TOKENS', process.env.OPENAI_MAX_TOKENS, '4096'),
  },
  elevenlabs: {
    apiKey: optionalKey('ELEVENLABS_API_KEY'), // Optional - for voice diarization
  },
  tududi: {
    apiUrl: required('TUDUDI_API_URL'),
    apiToken: required('TUDUDI_API_TOKEN'),
  },
  obsidian: {
    vaultPath: required('OBSIDIAN_VAULT_PATH'),
    dailyNotesPath: optional('OBSIDIAN_DAILY_NOTES_PATH', 'Daily Notes'),
  },
  googleCalendar: {
    keyFilePath: process.env.GOOGLE_CALENDAR_KEY_FILE || null,
    calendarId: optional('GOOGLE_CALENDAR_ID', 'primary')
  },
  shiftSchedule: {
    spreadsheetId: optionalKey('SHIFT_SPREADSHEET_ID'),
    userName: optional('SHIFT_USER_NAME', 'AHMAD FAIQ NAUFAL'),
    refreshHours: parseInteger('SHIFT_REFRESH_HOURS', process.env.SHIFT_REFRESH_HOURS, '6')
  },
  // Deprecated: use shiftSchedule.spreadsheetId instead
  googleSheetId: optionalKey('SHIFT_SPREADSHEET_ID') || optionalKey('GOOGLE_SHEETS_ID'),
  timezone: optional('TIMEZONE', 'Asia/Jakarta'),
  port: parseInteger('PORT', process.env.PORT, '3001'),
};
