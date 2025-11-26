const IntentDetector = require('./intent-detector');
const FullTextSearcher = require('./full-text-searcher');
const logger = require('../utils/logger');

class KnowledgeSearchService {
  constructor(config) {
    this.detector = new IntentDetector();
    this.searcher = new FullTextSearcher({
      vaultPath: config.vaultPath
    });
  }

  async handleQuery(message) {
    try {
      // Detect intent
      const intent = this.detector.detect(message);

      // Only process search intents
      if (intent.type !== 'search') {
        return null;
      }

      // Execute search
      if (intent.action === 'summarize_all') {
        return this.summarizeAll(intent.topic);
      }

      const results = await this.searcher.search(intent.topic);
      return {
        intent,
        results,
        count: results.length,
        formatted: this._formatSearchResults(intent.topic, results)
      };
    } catch (error) {
      logger.error(`Error handling knowledge query: ${error.message}`);
      throw error;
    }
  }

  async summarizeAll(topic) {
    try {
      const results = await this.searcher.search(topic);

      if (results.length === 0) {
        return {
          topic,
          summary: 'No results found',
          sources: [],
          keyPoints: []
        };
      }

      const sources = results.map(r => r.filename);
      const keyPoints = this._extractKeyPoints(results);

      return {
        topic,
        keyPoints,
        sources,
        count: results.length,
        formatted: this._formatSummary(topic, keyPoints, sources)
      };
    } catch (error) {
      logger.error(`Error summarizing knowledge: ${error.message}`);
      throw error;
    }
  }

  _extractKeyPoints(results) {
    const points = [];

    for (const result of results) {
      // Extract first meaningful sentence from snippet
      const sentences = result.snippet.split(/[.!?]+/);
      for (const sentence of sentences) {
        const trimmed = sentence.replace(/^\.+|\.+$/g, '').trim();
        if (trimmed.length > 10 && !trimmed.startsWith('...')) {
          points.push(trimmed);
          break;
        }
      }
    }

    return points.slice(0, 5);
  }

  _formatSearchResults(topic, results) {
    if (results.length === 0) {
      return `❌ No results found for "${topic}"`;
    }

    let message = `📚 **Search Results for "${topic}"** (${results.length} found)\n\n`;

    results.slice(0, 5).forEach((result, i) => {
      message += `${i + 1}. **${result.filename.replace('.md', '')}**\n`;
      message += `   📄 ${result.snippet.substring(0, 100)}...\n`;
      if (result.tags && result.tags.length > 0) {
        message += `   🏷️ ${result.tags.slice(0, 3).join(', ')}\n`;
      }
      message += '\n';
    });

    return message;
  }

  _formatSummary(topic, keyPoints, sources) {
    let message = `📖 **Summary: ${topic}**\n\n`;

    if (keyPoints.length > 0) {
      message += `**Key Points:**\n`;
      keyPoints.forEach((point, i) => {
        message += `${i + 1}. ${point}\n`;
      });
    }

    message += `\n**Sources:**\n`;
    sources.forEach(src => {
      message += `• ${src}\n`;
    });

    return message;
  }
}

module.exports = {
  IntentDetector,
  FullTextSearcher,
  KnowledgeSearchService
};
