#!/bin/bash
# Clean startup script that relies on dotenv for all configuration
# Clears shell environment to allow dotenv to load from .env properly

cd "$(dirname "$0")"

# Kill any existing process
pkill -f "node src/index.js" 2>/dev/null || true
sleep 1

# Unset variables that may be set in current shell to avoid dotenv conflicts
# (dotenv won't override variables already in environment)
unset TELEGRAM_BOT_TOKEN TELEGRAM_USER_ID
unset LLM_PROVIDERS
unset MEGALLM_API_KEY MEGALLM_MODEL MEGALLM_BASE_URL MEGALLM_MAX_TOKENS
unset GEMINI_API_KEY GEMINI_MODEL GEMINI_MAX_TOKENS
unset ANTHROPIC_API_KEY CLAUDE_MODEL CLAUDE_MAX_TOKENS
unset OPENAI_API_KEY OPENAI_MODEL OPENAI_MAX_TOKENS
unset TUDUDI_API_TOKEN TUDUDI_API_URL
unset OBSIDIAN_VAULT_PATH OBSIDIAN_DAILY_NOTES_PATH
unset TIMEZONE PORT

# Start the application
# dotenv will load from .env automatically via config.js
node src/index.js
