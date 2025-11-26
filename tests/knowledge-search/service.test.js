const { KnowledgeSearchService } = require('../../src/knowledge-search');
const fs = require('fs');
const path = require('path');

describe('KnowledgeSearchService', () => {
  let service;
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join('/tmp', `test-knowledge-service-${Date.now()}-${Math.random()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });

    // Create test notes
    await fs.promises.writeFile(
      path.join(tempDir, 'bitcoin.md'),
      '# Bitcoin Insights\n\n#trading Bitcoin is a volatile asset'
    );
    await fs.promises.writeFile(
      path.join(tempDir, 'ethereum.md'),
      '# Ethereum Analysis\n\n#blockchain Smart contracts enable DeFi'
    );

    service = new KnowledgeSearchService({ vaultPath: tempDir });
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

  test('should detect search intent and execute search', async () => {
    const result = await service.handleQuery('dulu aku pernah baca tentang bitcoin');
    expect(result).toBeDefined();
    expect(result.intent.type).toBe('search');
    expect(result.results.length).toBeGreaterThan(0);
  });

  test('should not process capture intent', async () => {
    const result = await service.handleQuery('Bitcoin prices are rising');
    expect(result).toBeNull();
  });

  test('should summarize all results for topic', async () => {
    const result = await service.summarizeAll('bitcoin');
    expect(result).toBeDefined();
    expect(result.keyPoints).toBeDefined();
    expect(result.sources.length).toBeGreaterThan(0);
  });

  test('should format search results', async () => {
    const result = await service.handleQuery('cari bitcoin');
    expect(result.formatted).toBeDefined();
    expect(result.formatted).toContain('Search Results');
  });

  test('should format summary', async () => {
    const result = await service.summarizeAll('blockchain');
    expect(result.formatted).toBeDefined();
    expect(result.formatted).toContain('Summary');
  });

  test('should handle case-insensitive queries', async () => {
    const result1 = await service.handleQuery('cari BITCOIN');
    const result2 = await service.handleQuery('cari bitcoin');
    expect(result1.count).toBe(result2.count);
  });
});
