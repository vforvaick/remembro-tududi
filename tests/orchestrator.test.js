const MessageOrchestrator = require('../src/orchestrator');

describe('MessageOrchestrator', () => {
  let orchestrator;
  let mockLLMClient;
  let mockTududiClient;
  let mockFileManager;
  let mockBot;

  beforeEach(() => {
    mockLLMClient = {
      sendMessage: jest.fn(),
      parseJSON: jest.fn()
    };
    mockTududiClient = {
      createTask: jest.fn()
    };
    mockFileManager = {
      appendTaskToDailyNote: jest.fn(),
      createKnowledgeNote: jest.fn()
    };
    mockBot = {
      sendMessage: jest.fn(),
      sendStatusMessage: jest.fn().mockResolvedValue(123),
      editStatusMessage: jest.fn()
    };

    const mockPeopleService = {
      getKnownPeopleForPrompt: jest.fn().mockReturnValue([]),
      incrementTaskCount: jest.fn(),
      markAsPending: jest.fn()
    };

    const mockProjectService = {
      getKnownProjectsForPrompt: jest.fn().mockReturnValue([]),
      incrementTaskCount: jest.fn(),
      markAsPending: jest.fn()
    };

    orchestrator = new MessageOrchestrator({
      llmClient: mockLLMClient,
      tududiClient: mockTududiClient,
      fileManager: mockFileManager,
      bot: mockBot,
      peopleService: mockPeopleService,
      projectService: mockProjectService
    });
  });

  test('handles task message end-to-end', async () => {
    mockLLMClient.parseJSON.mockResolvedValue({
      type: 'task',
      confidence: 0.9,
      tasks: [{
        title: 'Beli susu anak',
        due_date: '2025-11-18',
        time_estimate: 15,
        energy_level: 'LOW',
        project: 'Shopping'
      }],
      people_mentioned: [],
      projects_mentioned: [],
      needs_confirmation: false
    });

    mockTududiClient.createTask.mockResolvedValue({
      id: 123,
      name: 'Beli susu anak'
    });

    mockLLMClient.sendMessage.mockResolvedValue('✅ Task created');

    await orchestrator.handleMessage('beli susu anak');

    expect(mockLLMClient.parseJSON).toHaveBeenCalled();
    expect(mockTududiClient.createTask).toHaveBeenCalled();
    expect(mockFileManager.appendTaskToDailyNote).toHaveBeenCalled();
    expect(mockBot.editStatusMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('✅')
    );
  });

  test('handles multiple tasks in one message', async () => {
    mockLLMClient.parseJSON.mockResolvedValue({
      type: 'task',
      confidence: 0.9,
      tasks: [
        { title: 'Task 1', due_date: '2025-11-18' },
        { title: 'Task 2', due_date: '2025-11-19' }
      ],
      people_mentioned: [],
      projects_mentioned: [],
      needs_confirmation: false
    });

    mockTududiClient.createTask
      .mockResolvedValueOnce({ id: 1, name: 'Task 1' })
      .mockResolvedValueOnce({ id: 2, name: 'Task 2' });

    mockLLMClient.sendMessage.mockResolvedValue('Created 2 tasks');

    await orchestrator.handleMessage('task 1 and task 2');

    expect(mockTududiClient.createTask).toHaveBeenCalledTimes(2);
    expect(mockFileManager.appendTaskToDailyNote).toHaveBeenCalledTimes(2);
  });

  test('handles knowledge message', async () => {
    mockLLMClient.parseJSON.mockResolvedValue({
      type: 'knowledge',
      confidence: 0.9,
      title: 'Bitcoin Timing',
      content: 'Bitcoin dips before US open',
      category: 'Trading/Crypto',
      tags: ['bitcoin', 'trading'],
      people_mentioned: [],
      projects_mentioned: [],
      needs_confirmation: false
    });

    mockFileManager.createKnowledgeNote.mockResolvedValue(
      '/vault/Knowledge/Trading/bitcoin-timing.md'
    );

    mockLLMClient.sendMessage.mockResolvedValue('💡 Knowledge captured');

    await orchestrator.handleMessage('bitcoin dips before US open');

    expect(mockFileManager.createKnowledgeNote).toHaveBeenCalled();
    expect(mockBot.editStatusMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('💡')
    );
  });

  test('handles greeting message', async () => {
    mockLLMClient.parseJSON.mockResolvedValue({
      type: 'greeting',
      confidence: 0.95,
      needs_confirmation: false
    });

    mockLLMClient.sendMessage.mockResolvedValue('Halo! Ada yang bisa aku bantu?');

    await orchestrator.handleMessage('halo');

    expect(mockBot.editStatusMessage).toHaveBeenCalled();
  });

  test('handles errors gracefully', async () => {
    mockLLMClient.parseJSON.mockRejectedValue(new Error('Parsing failed'));

    await orchestrator.handleMessage('invalid message');

    // Error handler sends message via bot
    expect(mockBot.editStatusMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('❌')
    );
  });
});
