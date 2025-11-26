const { ArticleParser } = require('../../src/article-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

jest.mock('axios');

describe('ArticleParser Service', () => {
  let parser;
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join('/tmp', `test-parser-${Date.now()}-${Math.random()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    parser = new ArticleParser({ vaultPath: tempDir });

    // Reset axios mock
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

  test('should detect URLs in message', async () => {
    const message = 'Check this article https://medium.com/test-article';
    const result = await parser.handleArticleMessage(message);
    expect(result.type).toBe('article_urls_found');
    expect(result.urls.length).toBe(1);
  });

  test('should detect multiple URLs', async () => {
    const message = 'Read these: https://example1.com/article and https://example2.com/article';
    const result = await parser.handleArticleMessage(message);
    expect(result.urls.length).toBe(2);
  });

  test('should handle message without URL', async () => {
    const message = 'This is just text without any link';
    const result = await parser.handleArticleMessage(message);
    expect(result.type).toBe('no_url');
  });

  test('should format parse results', async () => {
    const message = 'Check https://unsupported.com/article';
    const result = await parser.handleArticleMessage(message);
    expect(result.formatted).toBeDefined();
    expect(result.formatted).toContain('Article Parser');
  });

  test('should save article with metadata', async () => {
    const article = {
      type: 'article',
      title: 'Test Article',
      url: 'https://example.com',
      content: 'Test content',
      platform: 'blog'
    };

    const result = await parser.saveArticle(article, 'My reason', 'Testing');
    expect(result.success).toBe(true);
    expect(result.filepath).toBeDefined();
  });

  test('should parse URL to extract article', async () => {
    axios.get.mockResolvedValue({
      data: '<h1>Test Article</h1><p>Content here</p>'
    });

    const result = await parser.parseUrl('https://medium.com/test');
    expect(result.success).toBe(true);
    expect(result.extractor).toBe('blog');
  });

  test('should handle unsupported URLs gracefully', async () => {
    const result = await parser.parseUrl('https://example.com/article');
    expect(result.success).toBe(true);
    expect(result.extractor).toBe('unsupported');
    expect(result.content.type).toBe('unsupported');
  });
});
