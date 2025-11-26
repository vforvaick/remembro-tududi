const fs = require('fs').promises;
const path = require('path');

class FullTextSearcher {
  constructor(config) {
    this.vaultPath = config.vaultPath;
    this.maxResults = 5;
  }

  async search(query) {
    const tokens = query.toLowerCase().split(/\s+/);
    const files = await this._getAllMarkdownFiles();
    const results = [];

    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf-8');
      const score = this._calculateRelevance(content, tokens);

      if (score > 0) {
        results.push({
          filePath,
          filename: path.basename(filePath),
          content,
          snippet: this._extractSnippet(content, tokens),
          relevanceScore: score,
          tags: this._extractTags(content)
        });
      }
    }

    // Sort by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return results.slice(0, this.maxResults);
  }

  async _getAllMarkdownFiles() {
    const files = [];

    const walkDir = async (dirPath) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            await walkDir(fullPath);
          } else if (entry.name.endsWith('.md')) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Silently skip directories we can't read
      }
    };

    await walkDir(this.vaultPath);
    return files;
  }

  _calculateRelevance(content, tokens) {
    const contentLower = content.toLowerCase();
    let score = 0;

    // Exact phrase match (highest score)
    const phrase = tokens.join(' ');
    if (contentLower.includes(phrase)) {
      score += 10;
    }

    // All tokens present (high score)
    const allTokensPresent = tokens.every(t => contentLower.includes(t));
    if (allTokensPresent) {
      score += 5;
    }

    // Individual token matches
    for (const token of tokens) {
      const matches = (contentLower.match(new RegExp(token, 'g')) || []).length;
      score += matches * 0.5;
    }

    return score;
  }

  _extractSnippet(content, tokens) {
    const lines = content.split('\n');
    const text = lines.join(' ');
    const token = tokens[0];
    const idx = text.toLowerCase().indexOf(token.toLowerCase());

    if (idx === -1) return text.substring(0, 150);

    const start = Math.max(0, idx - 50);
    const end = Math.min(text.length, idx + 150);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  _extractTags(content) {
    const tagRegex = /#(\w+)/g;
    const tags = [];
    let match;

    while ((match = tagRegex.exec(content)) !== null) {
      tags.push(match[1]);
    }

    return [...new Set(tags)];
  }
}

module.exports = FullTextSearcher;
