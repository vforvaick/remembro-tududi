const BaseExtractor = require('./base-extractor');
const logger = require('../../utils/logger');

class TwitterExtractor extends BaseExtractor {
  constructor() {
    super();
    this.name = 'twitter';
    this.supportedDomains = ['twitter.com', 'x.com'];
  }

  async extract(url) {
    try {
      // Extract tweet ID from URL
      const tweetMatch = url.match(/status\/(\d+)/);
      const tweetId = tweetMatch ? tweetMatch[1] : null;

      if (!tweetId) {
        throw new Error('Invalid Twitter URL');
      }

      return {
        type: 'thread',
        platform: this.name,
        tweetId,
        url,
        posts: [],
        replies: []
      };
    } catch (error) {
      logger.error(`Twitter extractor error: ${error.message}`);
      throw error;
    }
  }

  isThread(url) {
    // Simple heuristic: if URL doesn't have specific indicators, assume it's a thread
    return true;
  }
}

module.exports = TwitterExtractor;
