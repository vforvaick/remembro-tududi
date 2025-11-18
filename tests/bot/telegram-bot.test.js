const TelegramBot = require('../../src/bot/telegram-bot');
const TelegramBotAPI = require('node-telegram-bot-api');

jest.mock('node-telegram-bot-api');

describe('TelegramBot', () => {
  let bot;
  let mockBotAPI;

  beforeEach(() => {
    mockBotAPI = {
      on: jest.fn(),
      sendMessage: jest.fn(),
      onText: jest.fn(),
      downloadFile: jest.fn(),
      getFile: jest.fn()
    };
    TelegramBotAPI.mockImplementation(() => mockBotAPI);

    bot = new TelegramBot({
      token: 'test-token',
      userId: '123456'
    });
  });

  test('initializes with polling', () => {
    expect(TelegramBotAPI).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({ polling: true })
    );
  });

  test('registers message handler', () => {
    const handler = jest.fn();
    bot.onMessage(handler);

    expect(mockBotAPI.on).toHaveBeenCalledWith('message', expect.any(Function));
  });

  test('sends message to user', async () => {
    mockBotAPI.sendMessage.mockResolvedValue({});

    await bot.sendMessage('Test message');

    expect(mockBotAPI.sendMessage).toHaveBeenCalledWith(
      '123456',
      'Test message',
      expect.any(Object)
    );
  });

  test('only processes messages from authorized user', () => {
    const handler = jest.fn();
    bot.onMessage(handler);

    const messageCallback = mockBotAPI.on.mock.calls[0][1];

    // Message from unauthorized user
    messageCallback({ from: { id: 999 }, text: 'Test' });
    expect(handler).not.toHaveBeenCalled();

    // Message from authorized user
    messageCallback({ from: { id: 123456 }, text: 'Test' });
    expect(handler).toHaveBeenCalled();
  });

  test('handles voice messages', async () => {
    const handler = jest.fn();
    bot.onVoiceMessage(handler);

    expect(mockBotAPI.on).toHaveBeenCalledWith('voice', expect.any(Function));
  });

  test('downloads voice file', async () => {
    mockBotAPI.getFile.mockResolvedValue({ file_path: 'voice/file-id-123.ogg' });
    mockBotAPI.downloadFile.mockResolvedValue('/tmp/voice.ogg');

    const filePath = await bot.downloadVoice('file-id-123');

    expect(filePath).toBe('/tmp/file-id-123.ogg');
    expect(mockBotAPI.downloadFile).toHaveBeenCalledWith('file-id-123', expect.any(String));
  });
});
