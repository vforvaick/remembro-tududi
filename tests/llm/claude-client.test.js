const ClaudeClient = require('../../src/llm/claude-client');
const Anthropic = require('@anthropic-ai/sdk');

jest.mock('@anthropic-ai/sdk');

describe('ClaudeClient', () => {
  let client;
  let mockAnthropic;

  beforeEach(() => {
    mockAnthropic = {
      messages: {
        create: jest.fn()
      }
    };
    Anthropic.mockImplementation(() => mockAnthropic);

    client = new ClaudeClient({
      apiKey: 'test-key',
      model: 'claude-3-5-sonnet-20241022'
    });
  });

  test('sends message to Claude and returns response', async () => {
    const mockResponse = {
      content: [{ text: 'Test response' }]
    };
    mockAnthropic.messages.create.mockResolvedValue(mockResponse);

    const result = await client.sendMessage('Test prompt');

    expect(result).toBe('Test response');
    expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test prompt' }]
      })
    );
  });

  test('handles system prompts', async () => {
    const mockResponse = {
      content: [{ text: 'Response with system prompt' }]
    };
    mockAnthropic.messages.create.mockResolvedValue(mockResponse);

    await client.sendMessage('User prompt', {
      systemPrompt: 'You are a helpful assistant'
    });

    expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'You are a helpful assistant'
      })
    );
  });

  test('handles API errors', async () => {
    mockAnthropic.messages.create.mockRejectedValue(
      new Error('API rate limit exceeded')
    );

    await expect(client.sendMessage('Test'))
      .rejects.toThrow('API rate limit exceeded');
  });
});
