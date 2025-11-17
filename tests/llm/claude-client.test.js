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

  test('parses plain JSON response', async () => {
    const jsonData = { task: 'test', completed: false };
    mockAnthropic.messages.create.mockResolvedValue({
      content: [{ text: JSON.stringify(jsonData) }]
    });

    const result = await client.parseJSON('Test prompt');

    expect(result).toEqual(jsonData);
  });

  test('extracts JSON from markdown code blocks (json)', async () => {
    const jsonData = { task: 'test', completed: false };
    const response = '```json\n' + JSON.stringify(jsonData) + '\n```';
    mockAnthropic.messages.create.mockResolvedValue({
      content: [{ text: response }]
    });

    const result = await client.parseJSON('Test prompt');

    expect(result).toEqual(jsonData);
  });

  test('extracts JSON from markdown code blocks (generic)', async () => {
    const jsonData = { task: 'test', completed: false };
    const response = '```\n' + JSON.stringify(jsonData) + '\n```';
    mockAnthropic.messages.create.mockResolvedValue({
      content: [{ text: response }]
    });

    const result = await client.parseJSON('Test prompt');

    expect(result).toEqual(jsonData);
  });

  test('handles invalid JSON responses', async () => {
    mockAnthropic.messages.create.mockResolvedValue({
      content: [{ text: 'This is not JSON' }]
    });

    await expect(client.parseJSON('Test prompt'))
      .rejects.toThrow();
  });

  test('handles empty responses', async () => {
    mockAnthropic.messages.create.mockResolvedValue({
      content: [{ text: '' }]
    });

    await expect(client.parseJSON('Test prompt'))
      .rejects.toThrow();
  });
});
