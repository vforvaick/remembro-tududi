const ObsidianSyncWatcher = require('../../src/obsidian/sync-watcher');
const chokidar = require('chokidar');

jest.mock('chokidar');

describe('ObsidianSyncWatcher', () => {
  let watcher;
  let mockChokidarWatcher;

  beforeEach(() => {
    mockChokidarWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn()
    };
    chokidar.watch = jest.fn().mockReturnValue(mockChokidarWatcher);

    watcher = new ObsidianSyncWatcher({
      vaultPath: '/path/to/vault'
    });
  });

  test('starts watching vault directory', () => {
    watcher.start();

    expect(chokidar.watch).toHaveBeenCalledWith(
      '/path/to/vault',
      expect.objectContaining({
        persistent: true,
        ignoreInitial: true
      })
    );
  });

  test('registers change handler', () => {
    const handler = jest.fn();
    watcher.onChange(handler);
    watcher.start();

    expect(mockChokidarWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('detects task completion changes', async () => {
    const handler = jest.fn();
    watcher.onTaskChange(handler);

    const mockContent = `
# 2025-11-18

## Tasks
- [x] Test Task [[Tududi-123]]
- [ ] Another Task [[Tududi-124]]
`;

    const fs = require('fs');
    fs.readFileSync = jest.fn().mockReturnValue(mockContent);

    watcher.start();
    const changeCallback = mockChokidarWatcher.on.mock.calls.find(
      call => call[0] === 'change'
    )[1];

    await changeCallback('/path/to/vault/Daily Notes/2025-11-18.md');

    expect(handler).toHaveBeenCalledWith({
      taskId: 123,
      completed: true,
      title: 'Test Task'
    });
  });

  test('debounces rapid file changes', async () => {
    jest.useFakeTimers();
    const handler = jest.fn();
    watcher.onChange(handler);
    watcher.start();

    const changeCallback = mockChokidarWatcher.on.mock.calls.find(
      call => call[0] === 'change'
    )[1];

    // Trigger multiple changes rapidly
    changeCallback('/path/to/file.md');
    changeCallback('/path/to/file.md');
    changeCallback('/path/to/file.md');

    // Only one call after debounce
    jest.advanceTimersByTime(2000);
    expect(handler).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test('stops watching', () => {
    watcher.start();
    watcher.stop();

    expect(mockChokidarWatcher.close).toHaveBeenCalled();
  });
});
