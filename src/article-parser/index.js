const BaseExtractor = require('./extractors/base-extractor');
const NoteCreator = require('./note-creator');
const logger = require('../utils/logger');

class ArticleParser {
  constructor(config) {
    this.noteCreator = new NoteCreator({
      vaultPath: config.vaultPath
    });
  }

  async parseUrl(url) {
    try {
      const extractor = BaseExtractor.getExtractor(url);
      const content = await extractor.extract(url);

      return {
        success: true,
        extractor: extractor.name,
        content,
        suggestedTopics: this.noteCreator.suggestTopics(content.content || '')
      };
    } catch (error) {
      logger.error(`Error parsing URL: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async saveArticle(article, userReason, topic) {
    try {
      const filepath = await this.noteCreator.createNote(article, userReason, topic);
      return {
        success: true,
        filepath,
        message: `✅ Article saved to ${topic}/${this.noteCreator._generateFilename(article.title)}`
      };
    } catch (error) {
      logger.error(`Error saving article: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleArticleMessage(message) {
    // Check if message contains a URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = message.match(urlRegex);

    if (!urls || urls.length === 0) {
      return {
        type: 'no_url',
        message: 'No URL found in message. Please include a link to the article.'
      };
    }

    const results = [];
    for (const url of urls) {
      const parseResult = await this.parseUrl(url);
      results.push({
        url,
        parseResult,
        suggestedTopics: parseResult.suggestedTopics || []
      });
    }

    return {
      type: 'article_urls_found',
      urls,
      results,
      formatted: this._formatParseResults(results)
    };
  }

  _formatParseResults(results) {
    let message = `📖 **Article Parser**\n\n`;

    for (const result of results) {
      const { url, parseResult, suggestedTopics } = result;

      if (!parseResult.success) {
        message += `❌ ${url}\n   Error: ${parseResult.error}\n\n`;
        continue;
      }

      message += `✅ **${parseResult.content.title || 'Article'}**\n`;
      message += `   Source: ${parseResult.extractor}\n`;

      if (suggestedTopics && suggestedTopics.length > 0) {
        message += `   📁 Suggested: ${suggestedTopics.slice(0, 3).join(', ')}\n`;
      }
      message += '\n';
    }

    return message;
  }
}

module.exports = {
  BaseExtractor,
  NoteCreator,
  ArticleParser
};
