# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.7.0] - 2025-12-24

### Added
- **Google Calendar Integration**: `/today` and `/calendar` commands
- Service Account authentication for Google Calendar API
- Event formatting with time, location, grouped by date
- Setup guide: `docs/CALENDAR_SETUP.md`

### Files Added
- `src/calendar/google-calendar.js` - GoogleCalendarService
- `tests/calendar/google-calendar.test.js` - 6 tests
- `docs/CALENDAR_SETUP.md` - Step-by-step setup guide

### Files Modified
- `src/config.js` - Added googleCalendar config
- `src/index.js` - Added /today and /calendar commands
- `.env.example` - Added GOOGLE_CALENDAR_KEY_FILE

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

## [1.6.0] - 2025-12-24

### Added
- **Weekly Review**: `/review` command shows productivity stats for past 7 days
- **Voice Diarization**: ElevenLabs Scribe integration for speaker detection (up to 32 speakers)
- Indonesian language support for voice transcription

### Files Added
- `src/weekly-review/index.js` - WeeklyReviewService
- `src/bot/elevenlabs-transcriber.js` - ElevenLabsTranscriber  
- `tests/weekly-review/weekly-review.test.js` - 7 tests
- `tests/bot/elevenlabs-transcriber.test.js` - 6 tests

### Files Modified
- `src/config.js` - Added elevenlabs config
- `src/index.js` - Added /review command and ElevenLabs voice handler
- `.env.example` - Added ELEVENLABS_API_KEY

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

## [1.5.0] - 2025-12-24

### Added
- **Recurring Tasks**: Native support for repeating tasks (daily/weekly/monthly)
- `/recurring` command to view registered recurring tasks
- Pattern detection: "every day", "weekly", "every Monday", "monthly on the 15th"
- Auto-generation of next instance when task is completed
- Daily cron job (7 AM) to check for due recurring tasks

### Files Added
- `src/recurring/index.js` - RecurringService with JSON storage
- `tests/recurring/recurring.test.js` - 15 tests

### Files Modified
- `src/index.js` - Added /recurring command, cron job, and task completion hook

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

## [1.4.0] - 2025-12-24

### Added
- **Smart Rescheduling**: `/reschedule` command shows overdue tasks with suggested new dates
- Priority-based suggestion algorithm (urgent=today, high=tomorrow, medium=3 days, low=1 week)
- Inline keyboard for individual or bulk rescheduling

### Files Added
- `src/rescheduling/index.js` - ReschedulingService
- `tests/rescheduling/rescheduling.test.js` - 11 tests

### Files Modified
- `src/index.js` - Added /reschedule command and callback handler

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

## [1.3.0] - 2025-12-24

### Added
- **Semantic Search Integration**: Questions are now answered using knowledge base search
- Orchestrator's `handleQuestionMessage()` now uses `KnowledgeSearchService` instead of placeholder

### Files Modified
- `src/orchestrator.js` - Connected question handling to knowledge search

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

## [1.2.0] - 2025-12-23

### Added
- **Chaos Mode**: `/chaos` command activates simplified task view (only urgent/quick tasks)
- **Normal Mode**: `/normal` command deactivates and prompts for re-planning
- Per-user chaos mode state for multi-user support
- Task filtering: quick (≤15m), urgent priority, or due today

### Files Added
- `src/chaos-mode/index.js` - ChaosMode service
- `tests/chaos-mode/chaos-mode.test.js` - 13 tests

### Files Modified
- `src/index.js` - Added `/chaos` and `/normal` commands

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

## [1.1.0] - 2025-12-23

### Added
- **Multi-user Support**: Bot now supports multiple authorized Telegram users via `TELEGRAM_ALLOWED_USERS` env var (comma-separated IDs).
- Chat-based reply routing: Messages are now sent to the correct chat context.

### Changed
- `config.js`: Added `parseUserIdList()` helper, `allowedUsers` array with backward-compatible `userId` getter.
- `telegram-bot.js`: `isAuthorized()` checks array, all handlers track `currentChatId`.
- `.env.example`: Documented multi-user configuration.

### Deprecated
- `TELEGRAM_USER_ID` env var (still works, but use `TELEGRAM_ALLOWED_USERS` for new deployments).

### Files Modified
- `src/config.js`
- `src/bot/telegram-bot.js`
- `src/index.js`
- `.env.example`

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

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
