const fs = require('fs');
const path = require('path');

// Mock external APIs
jest.mock('node-telegram-bot-api');
jest.mock('@anthropic-ai/sdk');
jest.mock('axios');

const MessageOrchestrator = require('../../src/orchestrator');
const TududiClient = require('../../src/tududi/client');
const ObsidianFileManager = require('../../src/obsidian/file-manager');

describe('End-to-End Integration', () => {
  let orchestrator;
  let mockBot;
  let mockLLMClient;
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
    // Mock LLM client (new architecture)
    mockLLMClient = {
      sendMessage: jest.fn(),
      parseJSON: jest.fn()
    };

    const mockTududiClient = {
      createTask: jest.fn().mockImplementation((data) => ({
        id: Math.floor(Math.random() * 1000),
        name: data.name,
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
      fileManager,
      bot: mockBot,
      peopleService: mockPeopleService,
      projectService: mockProjectService
    });

    // Default mock response (extraction stage)
    mockLLMClient.parseJSON.mockResolvedValue({
      type: 'task',
      confidence: 0.9,
      tasks: [{
        title: 'Test Task',
        due_date: '2025-11-18',
        time_estimate: 30,
        energy_level: 'MEDIUM',
        project: 'Test'
      }],
      people_mentioned: [],
      projects_mentioned: [],
      needs_confirmation: false
    });

    // Default companion response
    mockLLMClient.sendMessage.mockResolvedValue('✅ Task created: Test Task');
  });

  test('completes full task capture flow', async () => {
    await orchestrator.handleMessage('beli susu anak besok');

    // Verify task created in Tududi
    expect(orchestrator.tududiClient.createTask).toHaveBeenCalled();

    // Verify response sent
    expect(mockBot.editStatusMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('✅')
    );
  });

  test('handles multi-task message', async () => {
    mockLLMClient.parseJSON.mockResolvedValue({
      type: 'task',
      confidence: 0.9,
      tasks: [
        { title: 'Task 1', due_date: '2025-11-18', time_estimate: 15 },
        { title: 'Task 2', due_date: '2025-11-19', time_estimate: 30 }
      ],
      people_mentioned: [],
      projects_mentioned: [],
      needs_confirmation: false
    });

    mockLLMClient.sendMessage.mockResolvedValue('✅ Created 2 tasks');

    await orchestrator.handleMessage('task 1 and task 2');

    expect(orchestrator.tududiClient.createTask).toHaveBeenCalledTimes(2);
  });

  test('handles knowledge capture', async () => {
    mockLLMClient.parseJSON.mockResolvedValue({
      type: 'knowledge',
      confidence: 0.9,
      title: 'Test Knowledge',
      content: 'Some useful information',
      category: 'Testing',
      tags: ['test', 'integration'],
      people_mentioned: [],
      projects_mentioned: [],
      needs_confirmation: false
    });

    mockLLMClient.sendMessage.mockResolvedValue('💡 Knowledge captured: Test Knowledge');

    await orchestrator.handleMessage('important insight about testing');

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

    mockLLMClient.sendMessage.mockResolvedValue('Halo! 👋 Ada yang bisa aku bantu?');

    await orchestrator.handleMessage('halo');

    expect(mockBot.editStatusMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Halo')
    );
  });

  test('handles story with potential tasks', async () => {
    mockLLMClient.parseJSON.mockResolvedValue({
      type: 'story',
      confidence: 0.85,
      summary: 'User has a meeting tomorrow',
      potential_tasks: [
        { title: 'Meeting with Affan', due_date: '2025-11-19', due_time: '10:00' }
      ],
      people_mentioned: [{ name: 'Affan', is_known: false }],
      projects_mentioned: [],
      needs_confirmation: false
    });

    mockLLMClient.sendMessage.mockResolvedValue('Found 1 potential task');

    await orchestrator.handleMessage('besok ada meeting jam 10 sama Affan');

    // Story sets confirmation state, no immediate task creation
    expect(mockBot.editStatusMessage).toHaveBeenCalled();
  });
});
