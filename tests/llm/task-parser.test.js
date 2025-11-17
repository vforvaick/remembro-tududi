const TaskParser = require('../../src/llm/task-parser');

describe('TaskParser', () => {
  let parser;
  let mockClaudeClient;

  beforeEach(() => {
    mockClaudeClient = {
      parseJSON: jest.fn()
    };
    parser = new TaskParser(mockClaudeClient);
  });

  test('parses simple task from text', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Beli susu anak',
        due_date: '2025-11-18',
        time_estimate: 15,
        energy_level: 'LOW',
        project: 'Shopping'
      }]
    });

    const result = await parser.parse('beli susu anak');

    expect(result.type).toBe('task');
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Beli susu anak');
  });

  test('parses multiple tasks from one message', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [
        { title: 'Beli susu anak', due_date: '2025-11-18' },
        { title: 'Ultah mama tanggal 25', due_date: '2025-11-25' }
      ]
    });

    const result = await parser.parse('beli susu anak, ultah mama tanggal 25');

    expect(result.tasks).toHaveLength(2);
  });

  test('handles natural language dates', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Meeting with client',
        due_date: '2025-11-19', // tomorrow
        time_estimate: 60
      }]
    });

    const result = await parser.parse('besok meeting with client');

    expect(result.tasks[0].due_date).toBe('2025-11-19');
  });

  test('detects knowledge vs task', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'knowledge',
      title: 'Bitcoin Market Timing',
      content: 'Bitcoin dips before US open...',
      category: 'Trading/Crypto',
      tags: ['bitcoin', 'trading', 'timing']
    });

    const result = await parser.parse(
      'bitcoin dips before US open, rebounds Asia session'
    );

    expect(result.type).toBe('knowledge');
    expect(result.category).toBe('Trading/Crypto');
  });

  test('handles Indonesian language', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Antar istri ke dokter',
        due_date: '2025-11-19',
        time_estimate: 120,
        energy_level: 'MEDIUM'
      }]
    });

    const result = await parser.parse('besok antar istri ke dokter');

    expect(result.tasks[0].title).toContain('istri');
  });
});
