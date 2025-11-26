const BaseExtractor = require('../../src/article-parser/extractors/base-extractor');
const BlogExtractor = require('../../src/article-parser/extractors/blog-extractor');
const TwitterExtractor = require('../../src/article-parser/extractors/twitter-extractor');
const axios = require('axios');

jest.mock('axios');

describe('Article Extractors', () => {
  test('should detect blog URLs', () => {
    const url = 'https://medium.com/some-article';
    const extractor = BaseExtractor.getExtractor(url);
    expect(extractor).toBeInstanceOf(BlogExtractor);
  });

  test('should detect Twitter thread URLs', () => {
    const url = 'https://twitter.com/user/status/12345';
    const extractor = BaseExtractor.getExtractor(url);
    expect(extractor).toBeInstanceOf(TwitterExtractor);
  });

  test('should handle x.com (Twitter alternative)', () => {
    const url = 'https://x.com/user/status/12345';
    const extractor = BaseExtractor.getExtractor(url);
    expect(extractor).toBeInstanceOf(TwitterExtractor);
  });

  test('should handle unsupported domains', () => {
    const url = 'https://example.com/article';
    const extractor = BaseExtractor.getExtractor(url);
    expect(extractor.name).toBe('unsupported');
  });

  test('blog extractor should handle medium.com', () => {
    const extractor = new BlogExtractor();
    expect(extractor.name).toBe('blog');
    expect(extractor.supportedDomains.length).toBeGreaterThan(0);
    expect(extractor.canHandle('https://medium.com/test')).toBe(true);
  });

  test('twitter extractor should handle twitter.com', () => {
    const extractor = new TwitterExtractor();
    expect(extractor.name).toBe('twitter');
    expect(extractor.canHandle('https://twitter.com/user/status/123')).toBe(true);
  });

  test('should extract article from blog', async () => {
    const blogExtractor = new BlogExtractor();
    axios.get.mockResolvedValue({
      data: `
        <html>
          <title>Test Article</title>
          <h1>Test Article Title</h1>
          <p>This is the article content.</p>
        </html>
      `
    });

    const result = await blogExtractor.extract('https://medium.com/test');
    expect(result.type).toBe('article');
    expect(result.title).toContain('Test');
    expect(result.platform).toBe('blog');
  });

  test('should extract tweet ID from Twitter URL', async () => {
    const twitterExtractor = new TwitterExtractor();
    const result = await twitterExtractor.extract('https://twitter.com/user/status/1234567890');
    expect(result.type).toBe('thread');
    expect(result.tweetId).toBe('1234567890');
  });

  test('should reject invalid Twitter URL', async () => {
    const twitterExtractor = new TwitterExtractor();
    try {
      await twitterExtractor.extract('https://twitter.com/invalid');
      fail('Should throw error');
    } catch (error) {
      expect(error.message).toContain('Invalid');
    }
  });
});
