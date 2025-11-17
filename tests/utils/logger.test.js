const logger = require('../../src/utils/logger');

describe('Logger', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('logs info messages', () => {
    logger.info('Test message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringMatching(/\[INFO\].*Test message/)
    );
  });

  test('logs error messages', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    logger.error('Error message');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('masks sensitive data in logs', () => {
    logger.info('API key: sk-ant-1234567890', { maskSensitive: true });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('sk-ant-***')
    );
  });
});
