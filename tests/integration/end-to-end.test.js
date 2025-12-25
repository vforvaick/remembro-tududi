const fs = require('fs');
const path = require('path');

// Mock external APIs
jest.mock('node-telegram-bot-api');
jest.mock('@anthropic-ai/sdk');
jest.mock('axios');

const MessageOrchestrator = require('../../src/orchestrator');
const TaskParser = require('../../src/llm/task-parser');
const TududiClient = require('../../src/tududi/client');
const ObsidianFileManager = require('../../src/obsidian/file-manager');

describe('End-to-End Integration', () => {
  let orchestrator;
  let mockBot;
  const testVaultPath = '/tmp/test-vault-' + Date.now();

  beforeAll(() => {
    // Create test vault
    fs.mkdirSync(testVaultPath, { recursive: true });
  });

  afterAll(() => {
    // Cleanup test vault
    fs.rmSync(testVaultPath, { recursive: true, force: true });
  });

  beforeEach(() => {
    const mockClaudeClient = {
      parseJSON: jest.fn()
    };

    const taskParser = new TaskParser(mockClaudeClient);

    const mockTududiClient = {
      createTask: jest.fn().mockImplementation((data) => ({
        id: Math.floor(Math.random() * 1000),
        ...data
      })),
      getTasks: jest.fn().mockResolvedValue([]),
      updateTask: jest.fn()
    };

    const fileManager = new ObsidianFileManager({
      vaultPath: testVaultPath,
      dailyNotesPath: 'Daily Notes'
    });

    mockBot = {
      sendMessage: jest.fn()
    };

    orchestrator = new MessageOrchestrator({
      taskParser,
      tududiClient: mockTududiClient,
      fileManager,
      bot: mockBot
    });

    // Default mock response
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Test Task',
        due_date: '2025-11-18',
        time_estimate: 30,
        energy_level: 'MEDIUM',
        project: 'Test'
      }]
    });
  });

  test('completes full task capture flow', async () => {
    await orchestrator.handleMessage('beli susu anak besok');

    // Verify task created in Tududi
    expect(orchestrator.tududiClient.createTask).toHaveBeenCalled();

    // Verify confirmation sent
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('✅')
    );

    // Verify daily note created
    const dailyNotePath = path.join(testVaultPath, 'Daily Notes', '2025-11-18.md');
    const noteExists = fs.existsSync(dailyNotePath);
    expect(noteExists).toBe(true);

    // Verify task in daily note
    if (noteExists) {
      const content = fs.readFileSync(dailyNotePath, 'utf-8');
      expect(content).toContain('Test Task');
      expect(content).toContain('[[Tududi-');
    }
  });

  test('handles multi-task message', async () => {
    orchestrator.taskParser.claude.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [
        { title: 'Task 1', due_date: '2025-11-18', time_estimate: 15 },
        { title: 'Task 2', due_date: '2025-11-19', time_estimate: 30 }
      ]
    });

    await orchestrator.handleMessage('task 1 and task 2');

    expect(orchestrator.tududiClient.createTask).toHaveBeenCalledTimes(2);
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('Created 2 tasks')
    );
  });

  test('handles knowledge capture', async () => {
    orchestrator.taskParser.claude.parseJSON.mockResolvedValue({
      type: 'knowledge',
      title: 'Test Knowledge',
      content: 'Some useful information',
      category: 'Testing',
      tags: ['test', 'integration'],
      actionable: false
    });

    await orchestrator.handleMessage('important insight about testing');

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('💡 Knowledge captured')
    );

    // Verify knowledge note created
    const knowledgeDir = path.join(testVaultPath, 'Knowledge', 'Testing');
    if (fs.existsSync(knowledgeDir)) {
      const files = fs.readdirSync(knowledgeDir);
      expect(files.length).toBeGreaterThan(0);
    }
  });
});
