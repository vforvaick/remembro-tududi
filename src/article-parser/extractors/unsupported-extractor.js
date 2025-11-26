const BaseExtractor = require('./base-extractor');

class UnsupportedExtractor extends BaseExtractor {
  constructor() {
    super();
    this.name = 'unsupported';
  }

  async extract(url) {
    return {
      type: 'unsupported',
      url,
      message: 'This source is not yet supported. Please describe it manually.'
    };
  }
}

module.exports = UnsupportedExtractor;
