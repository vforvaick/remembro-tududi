const TududuClient = require('../../src/tududi/client');
const axios = require('axios');

jest.mock('axios');

describe('TududuClient', () => {
  let client;
  let mockAxiosInstance;

  beforeEach(() => {
    mockAxiosInstance = {
      post: jest.fn(),
      get: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    };

    axios.create.mockReturnValue(mockAxiosInstance);

    client = new TududuClient({
      apiUrl: 'http://localhost:3000',
      apiToken: 'test-token'
    });
  });

  test('creates a new task', async () => {
    const mockTask = {
      id: 1,
      name: 'Test Task',
      due_date: '2025-11-20'
    };

    mockAxiosInstance.post.mockResolvedValue({ data: mockTask });

    const result = await client.createTask({
      name: 'Test Task',
      due_date: '2025-11-20'
    });

    expect(result).toEqual(mockTask);
    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/api/task',
      expect.any(Object)
    );
  });

  test('gets all tasks', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1' },
      { id: 2, title: 'Task 2' }
    ];

    mockAxiosInstance.get.mockResolvedValue({ data: mockTasks });

    const result = await client.getTasks();

    expect(result).toEqual(mockTasks);
  });

  test('updates a task', async () => {
    const mockTask = { id: 1, title: 'Updated Task', completed: true };
    mockAxiosInstance.patch.mockResolvedValue({ data: mockTask });

    const result = await client.updateTask(1, { completed: true });

    expect(result).toEqual(mockTask);
  });

  test('handles API errors gracefully', async () => {
    mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

    await expect(client.createTask({ name: 'Test' }))
      .rejects.toThrow('Network error');
  });

  test('rejects tasks with empty names', async () => {
    await expect(client.createTask({ name: '' }))
      .rejects.toThrow('Task name is required and cannot be empty');

    await expect(client.createTask({ name: '   ' }))
      .rejects.toThrow('Task name is required and cannot be empty');

    await expect(client.createTask({}))
      .rejects.toThrow('Task name is required and cannot be empty');
  });

  test('trims whitespace from task names', async () => {
    const mockTask = {
      id: 1,
      name: 'Test Task',
      due_date: '2025-11-20'
    };

    mockAxiosInstance.post.mockResolvedValue({ data: mockTask });

    await client.createTask({
      name: '  Test Task  ',
      due_date: '2025-11-20'
    });

    expect(mockAxiosInstance.post).toHaveBeenCalledWith(
      '/api/task',
      expect.objectContaining({
        name: 'Test Task'
      })
    );
  });
});
