# AI-Powered ADHD Task Management System

Zero-friction task capture and AI-powered planning for ADHD users.

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys
2. Install dependencies: `npm install`
3. Start development: `npm run dev`

## Architecture

- **Telegram Bot**: User interface layer
- **LLM Middleware**: Claude AI for parsing and planning
- **Tududi API**: Task storage engine
- **Obsidian Sync**: Knowledge base integration

## Development

- `npm run dev` - Start with nodemon (auto-reload)
- `npm test` - Run tests
- `npm run lint` - Check code style

See [Implementation Plan](docs/plans/2025-11-18-ai-powered-adhd-task-system.md) for details.
