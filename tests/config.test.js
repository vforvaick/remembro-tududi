// Store original env to restore after tests
const originalEnv = { ...process.env };

describe('Configuration', () => {
  beforeEach(() => {
    // Clear module cache before each test
    jest.resetModules();
  });

  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
  });

  test('loads environment variables', () => {
    const config = require('../src/config');
    expect(config.telegram.botToken).toBeDefined();
    expect(config.anthropic.apiKey).toBeDefined();
    expect(config.tududi.apiUrl).toBeDefined();
  });

  test('has default values for optional configs', () => {
    const config = require('../src/config');
    expect(config.timezone).toBe('Asia/Jakarta');
    expect(config.claude.model).toContain('claude-3-5-sonnet');
  });

  test('throws error if required env vars missing', () => {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../.env');
    const backupPath = path.join(__dirname, '../.env.backup');

    // Temporarily move .env file
    if (fs.existsSync(envPath)) {
      fs.renameSync(envPath, backupPath);
    }

    // Delete all required env vars to ensure the test works
    delete process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_USER_ID;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.TUDUDI_API_URL;
    delete process.env.TUDUDI_API_TOKEN;
    delete process.env.OBSIDIAN_VAULT_PATH;

    try {
      expect(() => {
        require('../src/config');
      }).toThrow('is required in environment variables');
    } finally {
      // Restore .env file
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, envPath);
      }
    }
  });

  test('rejects empty string values for required fields', () => {
    process.env.TELEGRAM_BOT_TOKEN = '';

    expect(() => {
      require('../src/config');
    }).toThrow('TELEGRAM_BOT_TOKEN is required');
  });

  test('validates numeric values', () => {
    process.env.PORT = 'invalid';

    expect(() => {
      require('../src/config');
    }).toThrow('PORT must be a valid number');
  });
});
