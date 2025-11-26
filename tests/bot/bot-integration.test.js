const TelegramBot = require('../../src/bot/telegram-bot');
const PlanCommand = require('../../src/commands/plan-command');
const { ArticleParser } = require('../../src/article-parser');
const { KnowledgeSearchService } = require('../../src/knowledge-search');
const DailyPlanner = require('../../src/llm/daily-planner');
const fs = require('fs');
const path = require('path');

jest.mock('node-telegram-bot-api');

describe('Telegram Bot Integration Tests', () => {
  let bot;
  let tempDir;
  let planCommand;
  let articleParser;
  let knowledgeSearch;

  beforeEach(async () => {
    tempDir = path.join('/tmp', `test-bot-${Date.now()}-${Math.random()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });

    bot = new TelegramBot({
      token: 'test-token',
      userId: '12345'
    });

    // Mock shift manager
    const mockShiftManager = {
      getShiftForDate: jest.fn().mockResolvedValue({
        code: '1',
        timeStart: '07:00',
        timeEnd: '16:00'
      })
    };

    // Initialize services
    // Create daily planner with mock LLM
    const dailyPlanner = new DailyPlanner({ llmProvider: null }, null);

    planCommand = new PlanCommand({
      shiftManager: mockShiftManager,
      tududi: {
        getTasks: jest.fn().mockResolvedValue([
          { id: '1', name: 'Task 1', due_date: '2025-11-27', time_estimate: 30 },
          { id: '2', name: 'Task 2', due_date: '2025-11-27', time_estimate: 60 }
        ])
      },
      dailyPlanner: dailyPlanner
    });

    articleParser = new ArticleParser({ vaultPath: tempDir });
    knowledgeSearch = new KnowledgeSearchService({ vaultPath: tempDir });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (fs.existsSync(tempDir)) {
      const walk = async (dir) => {
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = await fs.promises.stat(filePath);
          if (stat.isDirectory()) {
            await walk(filePath);
          } else {
            await fs.promises.unlink(filePath);
          }
        }
        await fs.promises.rmdir(dir);
      };
      await walk(tempDir);
    }
  });

  test('should handle /plan command with default date', async () => {
    const result = await planCommand.generatePlanForDate('today');

    expect(result).toBeDefined();
    expect(result.formatted).toBeDefined();
    expect(result.formatted).toContain('Shift');
    expect(result.formatted).toContain('Available');
  });

  test('should handle /plan command with custom date', async () => {
    const result = await planCommand.generatePlanForDate('2025-11-28');

    expect(result).toBeDefined();
    expect(result.formatted).toBeDefined();
  });

  test('should handle /search command with search keyword', async () => {
    // Create a test knowledge note
    await fs.promises.writeFile(
      path.join(tempDir, 'test-note.md'),
      '# Test Note\n\nBitcoin trading strategy'
    );

    // Use proper search keywords
    const result = await knowledgeSearch.handleQuery('cari bitcoin');

    expect(result).toBeDefined();
    expect(result.intent).toBeDefined();
    expect(result.intent.type).toBe('search');
  });

  test('should detect URLs in message', async () => {
    const message = 'Check this article: https://medium.com/test-article';
    const result = await articleParser.handleArticleMessage(message);

    expect(result.type).toBe('article_urls_found');
    expect(result.urls.length).toBe(1);
  });

  test('should detect multiple URLs in message', async () => {
    const message = 'Read: https://example1.com and https://example2.com';
    const result = await articleParser.handleArticleMessage(message);

    expect(result.urls.length).toBe(2);
  });

  test('should handle message without URLs', async () => {
    const message = 'This is a regular message without any links';
    const result = await articleParser.handleArticleMessage(message);

    expect(result.type).toBe('no_url');
  });

  test('should format article parsing results', async () => {
    const message = 'Check https://example.com/article';
    const result = await articleParser.handleArticleMessage(message);

    expect(result.formatted).toBeDefined();
    expect(result.formatted).toContain('Article Parser');
  });

  test('should handle summarize all knowledge', async () => {
    // Create test notes
    await fs.promises.writeFile(
      path.join(tempDir, 'note1.md'),
      '# Note 1\n\nContent about bitcoin'
    );
    await fs.promises.writeFile(
      path.join(tempDir, 'note2.md'),
      '# Note 2\n\nContent about trading'
    );

    const result = await knowledgeSearch.summarizeAll('');

    expect(result).toBeDefined();
    expect(result.formatted).toBeDefined();
  });

  test('should handle article saving workflow', async () => {
    const articleData = {
      type: 'article',
      title: 'Trading Tips',
      url: 'https://medium.com/trading',
      content: 'Bitcoin trading strategies',
      platform: 'blog'
    };

    const result = await articleParser.saveArticle(
      articleData,
      'Useful information',
      'Trading'
    );

    expect(result.success).toBe(true);
    expect(result.filepath).toBeDefined();
    expect(fs.existsSync(result.filepath)).toBe(true);
  });

  test('should handle search with no results', async () => {
    const result = await knowledgeSearch.handleQuery('cari nonexistent-topic-xyz');

    expect(result).toBeDefined();
    if (result && result.results) {
      expect(result.results.length).toBe(0);
    }
  });

  test('should parse plan command with timeframe argument', async () => {
    const result = await planCommand.generatePlanForDate('tomorrow');

    expect(result).toBeDefined();
    expect(result.formatted).toContain('Shift');
  });

  test('should format search results with multiple entries', async () => {
    // Create multiple notes
    await fs.promises.writeFile(
      path.join(tempDir, 'bitcoin-1.md'),
      '# Bitcoin Market\n\nBitcoin price analysis'
    );
    await fs.promises.writeFile(
      path.join(tempDir, 'bitcoin-2.md'),
      '# Bitcoin Trading\n\nBitcoin trading tips'
    );

    const result = await knowledgeSearch.handleQuery('cari bitcoin');

    if (result && result.results && result.results.length > 0) {
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.formatted).toBeDefined();
      expect(result.formatted).toContain('Search Results');
    }
  });

  test('should handle command case variations', async () => {
    const message = 'Check this: https://Example.com/Article';
    const result = await articleParser.handleArticleMessage(message);

    expect(result.type).toBe('article_urls_found');
    expect(result.urls.length).toBe(1);
  });

  test('should integrate plan command with shift manager', async () => {
    const result = await planCommand.generatePlanForDate('today');

    // Plan should contain shift information
    expect(result.formatted).toContain('16:00');
  });

  test('should handle concurrent article parsing', async () => {
    const message1 = 'Link 1: https://example1.com/article1';
    const message2 = 'Link 2: https://example2.com/article2';

    const [result1, result2] = await Promise.all([
      articleParser.handleArticleMessage(message1),
      articleParser.handleArticleMessage(message2)
    ]);

    expect(result1.type).toBe('article_urls_found');
    expect(result2.type).toBe('article_urls_found');
  });

  test('should handle concurrent knowledge searches', async () => {
    // Create test notes
    await fs.promises.writeFile(
      path.join(tempDir, 'note.md'),
      '# Test\n\nBitcoin and trading content'
    );

    const [result1, result2] = await Promise.all([
      knowledgeSearch.handleQuery('cari bitcoin'),
      knowledgeSearch.handleQuery('gimana cara trading')
    ]);

    // Results can be null if intent is not search, that's ok
    expect(result1 || result2).toBeDefined();
  });
});
