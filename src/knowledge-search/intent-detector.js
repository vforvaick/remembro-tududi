class IntentDetector {
  constructor() {
    this.searchKeywords = [
      'pernah baca',
      'apa aja',
      'ada note',
      'cari',
      'gimana cara',
      'apa bedanya',
      'remind me',
      'summarize',
      'rangkum'
    ];

    this.captureKeywords = [
      'dulu',
      'kemarin',
      'aku lihat',
      'aku rasa',
      'belajar',
      'insight'
    ];
  }

  detect(message) {
    const msgLower = message.toLowerCase();

    // Check for explicit summarize command
    if (msgLower.includes('summarize') || msgLower.includes('rangkum')) {
      return {
        type: 'search',
        action: 'summarize_all',
        topic: this._extractTopic(message)
      };
    }

    // Check for search intent
    const isSearch = this.searchKeywords.some(kw => msgLower.includes(kw));
    if (isSearch) {
      return {
        type: 'search',
        action: 'retrieve',
        topic: this._extractTopic(message)
      };
    }

    // Default to capture intent
    return {
      type: 'capture',
      action: 'save',
      content: message
    };
  }

  _extractTopic(message) {
    // Extract words after "tentang" or "about"
    const match = message.match(/tentang\s+([^.?!,]+)/i);
    if (match) return match[1].trim();

    // Extract words after "cari"
    const searchMatch = message.match(/cari\s+([^.?!,]+)/i);
    if (searchMatch) return searchMatch[1].trim();

    // Extract words after "summarize" or "rangkum"
    const sumMatch = message.match(/(summarize|rangkum)\s+(?:semua\s+)?([^.?!,]+)/i);
    if (sumMatch) return sumMatch[2].trim();

    // Fallback: extract last meaningful words
    const words = message.split(/\s+/).filter(w => w.length > 2);
    return words.slice(-3).join(' ');
  }
}

module.exports = IntentDetector;
