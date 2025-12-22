# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-12-22

### Fixed
- **Test Isolation**: Made `OPENAI_API_KEY` truly optional in `config.js` (was causing false required errors).
- **Jest Config**: Added `testPathIgnorePatterns` for `.worktrees/` to prevent stale code from causing test collisions.

### Changed
- **VPS Infrastructure**: Installed `pm2` globally and configured `systemd` startup for reboot survival.

### Files Modified
- `src/config.js` - OpenAI key now optional
- `package.json` - Added jest ignore patterns
- VPS: `pm2-vforvaick.service` created

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

## [1.0.0] - 2025-11-18

### Added
- **Core:**
  - Initial project structure with Docker support.
  - Configuration management with environment validation.
  - Logger utility with sensitive data masking.
- **Tududi Integration:**
  - Client for interacting with Tududi API.
- **LLM Middleware:**
  - Claude API client for task parsing.
  - Context-aware task parser service.
- **Telegram Bot:**
  - Bot service for command and message handling.
  - Voice transcription service using OpenAI Whisper (mock/impl).
- **Obsidian Integration:**
  - File manager for daily notes.
  - Sync watcher using `chokidar` for real-time updates.
- **Orchestration:**
  - Message orchestrator to coordinate Bot -> LLM -> Tududi/Obsidian flow.
  - Main application entry point.
- **Advanced Features:**
  - Daily planning service.
  - Natural language date parsing.

### Completed
- MVP 1 Complete as per `progress.md`.

### Reference
- Session: Initial Assessment
