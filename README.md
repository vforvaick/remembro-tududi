# AI-Powered ADHD Task Management System

Zero-friction task capture and AI-powered planning for ADHD users.

## Features

✅ **Instant Capture** - Voice or text via Telegram, processed in <10 seconds

✅ **AI Planning** - Daily plan generation with energy-aware scheduling

✅ **Multi-LLM Support** - Automatic fallback across Claude, Gemini, MegaLM, and OpenAI

✅ **Chaos Mode** - Simplified view for unpredictable days

✅ **Knowledge Base** - Automatic Obsidian integration with semantic search

✅ **Natural Language** - Indonesian + English, flexible date parsing

✅ **Bidirectional Sync** - Obsidian ↔ Tududi real-time sync

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/vforvaick/remembro-tududi.git
cd remembro-tududi

# 2. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start Tududi
docker-compose up -d

# 4. Install dependencies
npm install

# 5. Run application
npm start
```

See [Setup Guide](docs/SETUP.md) for detailed instructions.

## Documentation

- [Setup Guide](docs/SETUP.md) - Installation and configuration
- [LLM Providers](docs/LLM_PROVIDERS.md) - Multi-LLM configuration and fallback
- [User Guide](docs/USER_GUIDE.md) - Usage instructions and tips
- [Implementation Plan](docs/plans/2025-11-18-ai-powered-adhd-task-system.md) - Development roadmap

## Architecture

```
Telegram Bot → LLM Middleware (Multi-Provider Fallback) → Tududi API + Obsidian Vault
```

- **Telegram**: Primary interface (low friction)
- **LLM**: Multi-provider support (Claude, Gemini, MegaLM, OpenAI) with automatic fallback
- **Tududi**: Task storage and management
- **Obsidian**: Knowledge base with bidirectional sync

## Tech Stack

- Node.js 18+
- Telegram Bot API
- **LLM Providers**: Claude 3.5, Gemini, MegaLM, GPT-4 (with automatic fallback)
- OpenAI Whisper (transcription)
- Tududi (Docker)
- Obsidian (markdown files)

## Development

```bash
npm run dev      # Start with auto-reload
npm test         # Run tests
npm run test:watch  # Watch mode
```

## License

MIT

## Contributing

This is a personal project built for specific ADHD needs. Feel free to fork and adapt for your own use!
