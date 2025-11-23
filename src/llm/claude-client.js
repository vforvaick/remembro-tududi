/**
 * ClaudeClient - Backward compatibility wrapper
 *
 * This file maintains backward compatibility for existing code.
 * It's a wrapper around ClaudeProvider for direct use.
 *
 * For new code, use LLMClient with multiple providers instead.
 */

const ClaudeProvider = require('./providers/claude-provider');

class ClaudeClient extends ClaudeProvider {
  constructor(config) {
    super(config);
  }
}

module.exports = ClaudeClient;
