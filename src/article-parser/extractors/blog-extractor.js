const BaseExtractor = require('./base-extractor');
const axios = require('axios');
const logger = require('../../utils/logger');

class BlogExtractor extends BaseExtractor {
  constructor() {
    super();
    this.name = 'blog';
    this.supportedDomains = ['medium.com', 'substack.com', 'dev.to', 'wordpress.com', 'linkedin.com'];
  }

  async extract(url) {
    try {
      const { data } = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ArticleParser/1.0)'
        }
      });

      // Extract content (simplified HTML parsing)
      const titleMatch = data.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                        data.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                        data.match(/<title[^>]*>([^<]+)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';

      // Extract first paragraph as content
      const contentMatch = data.match(/<p[^>]*>([^<]+)<\/p>/i);
      const content = contentMatch ? contentMatch[1].substring(0, 500) :
                     data.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').substring(0, 500);

      return {
        type: 'article',
        platform: this.name,
        title,
        url,
        content,
        author: null,
        publishedDate: null
      };
    } catch (error) {
      logger.error(`Blog extractor error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = BlogExtractor;
