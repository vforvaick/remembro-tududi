const ObsidianFileManager = require('../../src/obsidian/file-manager');
const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('ObsidianFileManager', () => {
  let fileManager;
  const vaultPath = '/path/to/vault';

  beforeEach(() => {
    fileManager = new ObsidianFileManager({
      vaultPath,
      dailyNotesPath: 'Daily Notes'
    });
  });

  test('creates daily note if not exists', async () => {
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();

    await fileManager.ensureDailyNote('2025-11-18');

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('2025-11-18.md'),
      expect.stringContaining('# 2025-11-18')
    );
  });

  test('appends task to daily note', async () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue('# 2025-11-18\n\n## Tasks\n');
    fs.writeFileSync = jest.fn();

    await fileManager.appendTaskToDailyNote({
      id: 123,
      title: 'Test Task',
      due_date: '2025-11-18',
      time_estimate: 30,
      energy_level: 'HIGH'
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('- [ ] Test Task')
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('[[Tududi-123]]')
    );
  });

  test('creates knowledge note', async () => {
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();

    await fileManager.createKnowledgeNote({
      title: 'Bitcoin Market Timing',
      content: 'Bitcoin dips before US open...',
      category: 'Trading/Crypto',
      tags: ['bitcoin', 'trading']
    });

    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('Trading/Crypto'),
      expect.stringContaining('# Bitcoin Market Timing')
    );
  });

  test('searches notes by keyword', async () => {
    fs.readdirSync = jest.fn().mockReturnValue([
      'note1.md',
      'note2.md'
    ]);
    fs.statSync = jest.fn().mockReturnValue({
      isDirectory: () => false
    });
    fs.readFileSync = jest.fn()
      .mockReturnValueOnce('Content about bitcoin trading')
      .mockReturnValueOnce('Content about stocks');

    const results = await fileManager.searchNotes('bitcoin');

    expect(results).toHaveLength(1);
    expect(results[0].excerpt).toContain('bitcoin');
  });

  test('generates slug from title', () => {
    const slug = fileManager.generateSlug('Bitcoin Market Timing!');
    expect(slug).toBe('bitcoin-market-timing');
  });
});
