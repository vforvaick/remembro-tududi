const FullTextSearcher = require('../../src/knowledge-search/full-text-searcher');
const fs = require('fs');
const path = require('path');

describe('FullTextSearcher', () => {
  let searcher;
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join('/tmp', `test-knowledge-${Date.now()}-${Math.random()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });

    // Create test notes
    await fs.promises.writeFile(
      path.join(tempDir, 'bitcoin-timing.md'),
      '# Bitcoin Market Timing\n\nBitcoin dips before US open at 14:30 UTC'
    );
    await fs.promises.writeFile(
      path.join(tempDir, 'trading-strategy.md'),
      '# Trading Strategy\n\nUse technical analysis for timing trades'
    );

    searcher = new FullTextSearcher({
      vaultPath: tempDir
    });
  });

  afterEach(async () => {
    if (fs.existsSync(tempDir)) {
      const files = await fs.promises.readdir(tempDir);
      for (const file of files) {
        await fs.promises.unlink(path.join(tempDir, file));
      }
      await fs.promises.rmdir(tempDir);
    }
  });

  test('should search notes by keyword', async () => {
    const results = await searcher.search('bitcoin');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].filename).toContain('bitcoin');
  });

  test('should rank results by relevance', async () => {
    const results = await searcher.search('bitcoin timing');
    expect(results[0].relevanceScore).toBeGreaterThan(0.5);
  });

  test('should handle no results', async () => {
    const results = await searcher.search('quantum computing');
    expect(results).toEqual([]);
  });

  test('should limit results to top 5', async () => {
    // Create more files
    for (let i = 0; i < 10; i++) {
      await fs.promises.writeFile(
        path.join(tempDir, `note-${i}.md`),
        `# Note ${i}\n\nThis is about trading`
      );
    }

    const results = await searcher.search('trading');
    expect(results.length).toBeLessThanOrEqual(5);
  });

  test('should extract snippets from notes', async () => {
    const results = await searcher.search('bitcoin');
    expect(results[0].snippet).toBeDefined();
    expect(results[0].snippet.length).toBeLessThan(200);
  });

  test('should case-insensitive search', async () => {
    const results1 = await searcher.search('BITCOIN');
    const results2 = await searcher.search('bitcoin');
    expect(results1.length).toBe(results2.length);
  });
});
