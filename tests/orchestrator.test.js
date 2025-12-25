const MessageOrchestrator = require('../src/orchestrator');

describe('MessageOrchestrator', () => {
  let orchestrator;
  let mockTaskParser;
  let mockTududiClient;
  let mockFileManager;
  let mockBot;

  beforeEach(() => {
    mockTaskParser = {
      parse: jest.fn()
    };
    mockTududiClient = {
      createTask: jest.fn()
    };
    mockFileManager = {
      appendTaskToDailyNote: jest.fn(),
      createKnowledgeNote: jest.fn()
    };
    mockBot = {
      sendMessage: jest.fn()
    };

    orchestrator = new MessageOrchestrator({
      taskParser: mockTaskParser,
      tududiClient: mockTududiClient,
      fileManager: mockFileManager,
      bot: mockBot
    });
  });

  test('handles task message end-to-end', async () => {
    mockTaskParser.parse.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Beli susu anak',
        due_date: '2025-11-18',
        time_estimate: 15,
        energy_level: 'LOW',
        project: 'Shopping'
      }]
    });

    mockTududiClient.createTask.mockResolvedValue({
      id: 123,
      title: 'Beli susu anak'
    });

    await orchestrator.handleMessage('beli susu anak');

    expect(mockTaskParser.parse).toHaveBeenCalledWith('beli susu anak');
    expect(mockTududiClient.createTask).toHaveBeenCalled();
    expect(mockFileManager.appendTaskToDailyNote).toHaveBeenCalled();
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('✅')
    );
  });

  test('handles multiple tasks in one message', async () => {
    mockTaskParser.parse.mockResolvedValue({
      type: 'task',
      tasks: [
        { title: 'Task 1', due_date: '2025-11-18' },
        { title: 'Task 2', due_date: '2025-11-19' }
      ]
    });

    mockTududiClient.createTask
      .mockResolvedValueOnce({ id: 1, title: 'Task 1' })
      .mockResolvedValueOnce({ id: 2, title: 'Task 2' });

    await orchestrator.handleMessage('task 1 and task 2');

    expect(mockTududiClient.createTask).toHaveBeenCalledTimes(2);
    expect(mockFileManager.appendTaskToDailyNote).toHaveBeenCalledTimes(2);
  });

  test('handles knowledge message', async () => {
    mockTaskParser.parse.mockResolvedValue({
      type: 'knowledge',
      title: 'Bitcoin Timing',
      content: 'Bitcoin dips before US open',
      category: 'Trading/Crypto',
      tags: ['bitcoin', 'trading'],
      actionable: false
    });

    mockFileManager.createKnowledgeNote.mockResolvedValue(
      '/vault/Knowledge/Trading/bitcoin-timing.md'
    );

    await orchestrator.handleMessage('bitcoin dips before US open');

    expect(mockFileManager.createKnowledgeNote).toHaveBeenCalled();
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('💡')
    );
  });

  test('handles knowledge with actionable task', async () => {
    mockTaskParser.parse.mockResolvedValue({
      type: 'knowledge',
      title: 'Bitcoin Timing',
      content: 'Bitcoin dips before US open',
      category: 'Trading/Crypto',
      tags: ['bitcoin'],
      actionable: true,
      actionTask: {
        title: 'Test Bitcoin 30-min strategy',
        due_date: '2025-11-20'
      }
    });

    mockFileManager.createKnowledgeNote.mockResolvedValue(
      '/vault/Knowledge/Trading/bitcoin-timing.md'
    );

    mockTududiClient.createTask.mockResolvedValue({
      id: 456,
      title: 'Test Bitcoin 30-min strategy'
    });

    await orchestrator.handleMessage('bitcoin dips before US open');

    expect(mockFileManager.createKnowledgeNote).toHaveBeenCalled();
    expect(mockTududiClient.createTask).toHaveBeenCalled();
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('💡 Knowledge captured')
    );
  });

  test('handles errors gracefully', async () => {
    mockTaskParser.parse.mockRejectedValue(new Error('Parsing failed'));

    await orchestrator.handleMessage('invalid message');

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('❌')
    );
  });
});
