const NoteCreator = require('../../src/article-parser/note-creator');
const fs = require('fs');
const path = require('path');

describe('Article Note Creator', () => {
  let creator;
  let tempDir;

  beforeEach(async () => {
    tempDir = path.join('/tmp', `test-vault-${Date.now()}-${Math.random()}`);
    await fs.promises.mkdir(tempDir, { recursive: true });
    creator = new NoteCreator({ vaultPath: tempDir });
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

  test('should create article note with metadata', async () => {
    const article = {
      type: 'article',
      title: 'Bitcoin Market Timing',
      url: 'https://medium.com/article',
      content: 'Bitcoin dips before US open...',
      author: 'Trader XYZ',
      platform: 'blog'
    };

    const userReason = 'Useful pattern for my trading';
    const topic = 'Trading';

    const filePath = await creator.createNote(article, userReason, topic);
    expect(filePath).toBeDefined();
    expect(filePath).toContain('Trading');

    // Verify file was created
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('should format article with attribution', () => {
    const article = {
      type: 'article',
      title: 'Test Article',
      url: 'https://example.com/article',
      content: 'Content here',
      author: 'Author Name',
      platform: 'blog'
    };

    const formatted = creator.formatArticleNote(article, 'My reason');
    expect(formatted).toContain('# Test Article');
    expect(formatted).toContain('https://example.com/article');
    expect(formatted).toContain('My reason');
    expect(formatted).toContain('Author Name');
  });

  test('should extract topic from content', () => {
    const content = 'This is about bitcoin and trading strategies';
    const topics = creator.suggestTopics(content);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0]).toBe('Trading');
  });

  test('should generate safe filenames', () => {
    const filename = creator._generateFilename('Bitcoin: The Future of Money!!!');
    expect(filename).not.toContain(':');
    expect(filename).not.toContain('!');
    expect(filename).toMatch(/\.md$/);
  });

  test('should handle articles without titles', async () => {
    const article = {
      type: 'article',
      title: '',
      url: 'https://example.com/article',
      content: 'Bitcoin content',
      platform: 'blog'
    };

    const filePath = await creator.createNote(article, 'My reason', 'Trading');
    expect(filePath).toBeDefined();
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('should suggest multiple topics', () => {
    const content = 'AI and machine learning with deep neural networks';
    const topics = creator.suggestTopics(content);
    expect(topics).toContain('AI');
  });

  test('should handle special characters in topic', async () => {
    const article = {
      type: 'article',
      title: 'Test',
      url: 'https://example.com',
      content: 'Test',
      platform: 'blog'
    };

    const topicWithSpecial = 'Trading & Finance';
    const filePath = await creator.createNote(article, 'reason', topicWithSpecial);
    expect(filePath).toBeDefined();
    expect(fs.existsSync(filePath)).toBe(true);
  });
});
