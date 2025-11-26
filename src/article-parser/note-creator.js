const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class NoteCreator {
  constructor(config) {
    this.vaultPath = config.vaultPath;
    this.knowledgeFolder = 'Knowledge';
  }

  async createNote(article, userReason, topic) {
    try {
      // Create folder structure
      const topicFolder = path.join(this.vaultPath, this.knowledgeFolder, topic);
      await fs.mkdir(topicFolder, { recursive: true });

      // Generate filename
      const filename = this._generateFilename(article.title || article.url);
      const filepath = path.join(topicFolder, filename);

      // Format content
      const content = this.formatArticleNote(article, userReason);

      // Write file
      await fs.writeFile(filepath, content, 'utf-8');

      logger.info(`Article saved: ${filepath}`);
      return filepath;
    } catch (error) {
      logger.error(`Failed to create article note: ${error.message}`);
      throw error;
    }
  }

  formatArticleNote(article, userReason) {
    const date = new Date().toISOString().split('T')[0];

    let content = `# ${article.title || 'Untitled Article'}\n\n`;

    content += `> **Source:** ${article.platform || 'Unknown'}\n`;
    content += `> **URL:** ${article.url}\n`;
    if (article.author) {
      content += `> **Author:** ${article.author}\n`;
    }
    if (article.publishedDate) {
      content += `> **Published:** ${article.publishedDate}\n`;
    }

    content += `\n---\n\n`;
    content += `## Why I Found This Interesting\n\n`;
    content += `${userReason}\n\n`;

    content += `---\n\n`;
    content += `## Article Summary\n\n`;
    if (article.content) {
      content += `${article.content}\n\n`;
    }

    content += `---\n\n`;
    content += `*Saved on ${date}*\n`;

    return content;
  }

  _generateFilename(title) {
    const slug = (title || 'article')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    const date = new Date().toISOString().split('T')[0];
    return `${slug}-${date}.md`;
  }

  suggestTopics(content) {
    const keywords = {
      'Trading': ['trading', 'strategy', 'market', 'stock', 'crypto', 'bitcoin', 'ethereum'],
      'Productivity': ['productivity', 'time', 'management', 'focus', 'habits'],
      'Technology': ['technology', 'software', 'code', 'development', 'framework'],
      'AI': ['ai', 'artificial intelligence', 'llm', 'machine learning', 'neural'],
      'Health': ['health', 'fitness', 'diet', 'exercise', 'wellness']
    };

    const contentLower = (content || '').toLowerCase();
    const topicScores = {};

    for (const [topic, keywordList] of Object.entries(keywords)) {
      topicScores[topic] = keywordList.filter(kw => contentLower.includes(kw)).length;
    }

    return Object.entries(topicScores)
      .filter(([_, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);
  }
}

module.exports = NoteCreator;
