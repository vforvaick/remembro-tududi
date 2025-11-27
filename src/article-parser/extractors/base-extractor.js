class BaseExtractor {
  constructor() {
    this.name = 'base';
    this.supportedDomains = [];
  }

  async extract(url) {
    throw new Error('extract() must be implemented');
  }

  static getExtractor(url) {
    const BlogExtractor = require('./blog-extractor');
    const TwitterExtractor = require('./twitter-extractor');
    const UnsupportedExtractor = require('./unsupported-extractor');

    const extractors = [
      new BlogExtractor(),
      new TwitterExtractor()
    ];

    for (const extractor of extractors) {
      if (extractor.canHandle(url)) {
        return extractor;
      }
    }

    return new UnsupportedExtractor();
  }

  canHandle(url) {
    const domain = this._extractDomain(url);
    return this.supportedDomains.some(d => domain.includes(d));
  }

  _extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  }
}

module.exports = BaseExtractor;
