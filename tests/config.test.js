describe('Configuration', () => {
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
    const originalEnv = process.env.TELEGRAM_BOT_TOKEN;
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(__dirname, '../.env');
    let envContent;

    // Backup .env file
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
      // Temporarily remove TELEGRAM_BOT_TOKEN from .env
      const modifiedEnv = envContent.split('\n')
        .filter(line => !line.startsWith('TELEGRAM_BOT_TOKEN='))
        .join('\n');
      fs.writeFileSync(envPath, modifiedEnv);
    }

    delete process.env.TELEGRAM_BOT_TOKEN;

    expect(() => {
      jest.resetModules();
      require('../src/config');
    }).toThrow('TELEGRAM_BOT_TOKEN is required');

    // Restore .env file
    if (envContent) {
      fs.writeFileSync(envPath, envContent);
    }
    process.env.TELEGRAM_BOT_TOKEN = originalEnv;
  });
});
