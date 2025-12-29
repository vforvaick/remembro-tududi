# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.4.0] - 2025-12-28

### Added
- **Project Context / Project Intelligence**: Build a knowledge base of projects mentioned in tasks
  - AI extracts project names from task messages
  - Unknown projects queued for later description (async, non-blocking)
  - Natural language descriptions parsed into structured metadata via LLM
  - Obsidian notes created in `Projects/` folder with YAML frontmatter
- **`/projects` command**: List known projects with status, task counts, and pending unknowns
- **`/whatis <name>` command**: Lookup details about a specific project

### Files Added
- `src/projects/project-service.js` - Core ProjectService with CRUD, pending queue, LLM metadata extraction
- `src/llm/prompts/parse-project.js` - Prompt for parsing project descriptions
- `data/projects.json` - JSON storage for projects knowledge base
- `tests/projects/project-service.test.js` - 21 tests

### Files Modified
- `src/obsidian/file-manager.js` - Added `createProjectNote()` method
- `src/orchestrator.js` - Integrated ProjectService for project tracking
- `src/index.js` - Added ProjectService init, `/projects` and `/whatis` commands
- `.gitignore` - Allow `data/projects.json` to be tracked

### Reference
- Session: 63d5141b-6b7c-49b5-8f86-6cfaef9a966b

---

## [2.3.0] - 2025-12-27

### Added
- **API Robustness & Optimization**:
  - **CLIProxy Integration**: Main LLM provider connected to `fight-dos` for centralized API management.
  - **Smart Model Routing**: Dynamically selects models based on input length:
    - Short (<100 chars): `gemini-2.5-flash-lite` (Fastest)
    - Medium (100-500 chars): `gemini-2.5-flash` (Balanced)
    - Long (>500 chars): `gemini-3-pro-preview` (Best Quality)
  - **Key Rotation**: Auto-rotates between 5 Gemini API keys on rate limit (429) errors.
  - **Quota Notification**: User-friendly notification when all API quotas are exhausted.
- **Provider Redundancy**: Dual-provider setup (CLIProxy primary, Gemini direct fallback).

### Files Added
- `src/llm/providers/cliproxy-provider.js`

### Files Modified
- `src/config.js` - Added `cliproxy` credentials and model config.
- `src/llm/provider-factory.js` - Registered `cliproxy` provider.
- `src/llm/providers/gemini-provider.js` - Added key rotation and input-based model selection.
- `src/orchestrator.js` - Added friendly error handling for quota exhaustion.

### Reference
- Session: 958c62c0-1245-46d2-bd76-0b8fa2f9c79b

---

## [2.2.0] - 2025-12-27

### Added
- **Conversational Flow Enhancement**: Bot now intelligently classifies messages into 6 types:
  - `greeting` - "Halo", "Hey" → friendly reply
  - `chitchat` - Venting, casual talk → empathetic response
  - `story` - Context/background sharing → extract potential tasks with confirmation
  - `task` - Direct tasks → immediate creation
  - `knowledge` - Insights to save → Obsidian note
  - `question` - Queries → knowledge search
- **Story → Task Extraction**: Share context like "perlu follow up Arjun tentang uang forex" and bot offers to create tasks
- **Task Sequence/Grouping**: Multiple tasks from one story are linked with `story_id` for batch rescheduling
- **Voice Note Optimization**: VN transcripts biased toward story-type for natural extraction
- **Photo-to-Tasks**: Send photo of whiteboard/notes → Gemini Vision extracts tasks
- **Conversation State Persistence**: State now persists to JSON file (survives restart)

### Files Added
- `src/state/conversation-state.js` - State store with JSON persistence
- `src/llm/photo-parser.js` - Gemini Vision photo parser

### Files Modified
- `src/llm/providers/gemini-provider.js` - Added vision support (`sendMessageWithImage`)
- `src/bot/telegram-bot.js` - Added `onPhotoMessage` and `downloadPhoto`
- `src/llm/prompts/parse-task.js` - Complete rewrite with 6 message types
- `src/orchestrator.js` - Added greeting/chitchat/story/photo handlers
- `src/index.js` - Added PhotoParser init and photo message handler

### Reference
- Session: 958c62c0-1245-46d2-bd76-0b8fa2f9c79b

---

## [2.1.0] - 2025-12-26

### Added
- **People Context / Contact Intelligence**: Build a knowledge base of people you interact with
  - AI extracts person names from task messages (e.g., "submit report to Pak Ekgik")
  - Unknown people queued for later description (async, non-blocking)
  - Natural language descriptions parsed into structured metadata via LLM
  - Obsidian notes created in `People/` folder with YAML frontmatter
- **`/people` command**: List known contacts and pending unknown people
- **`/whois <name>` command**: Lookup details about a specific person

### Files Added
- `src/people/people-service.js` - Core PeopleService with CRUD, pending queue, LLM metadata extraction
- `src/llm/prompts/parse-person.js` - Prompt for parsing person descriptions
- `data/people.json` - JSON storage for people knowledge base
- `tests/people/people-service.test.js` - 19 tests

### Files Modified
- `src/llm/prompts/parse-task.js` - Added `people_mentioned` extraction
- `src/obsidian/file-manager.js` - Added `createPersonNote()` method
- `src/orchestrator.js` - Integrated PeopleService for people tracking
- `src/index.js` - Added PeopleService init, `/people` and `/whois` commands
- `.gitignore` - Allow `data/people.json` to be tracked

### Reference
- Session: 63d5141b-6b7c-49b5-8f86-6cfaef9a966b

---

## [2.0.0] - 2025-12-25

### Changed
- **Project Rebranding**: Renamed from "Remembro-Tududi" to **Remembro**
- **Class Rename**: `TududuClient` → `TududiClient` (typo fix + consistency)
- **Variable Rename**: `tududuClient` → `tududiClient` across entire codebase
- **package.json**: Name changed to `remembro`, version bumped to 2.0.0
- **README.md**: Complete rewrite positioning Remembro as the "brain"
- **architecture.md**: Updated to reflect new hierarchy
- **Startup Log**: Now says "Starting Remembro..."

### Files Modified
- `package.json`
- `src/tududi/client.js`
- `src/index.js`, `src/orchestrator.js`, `src/llm/daily-planner.js`
- `src/recurring/index.js`, `src/rescheduling/index.js`, `src/weekly-review/index.js`
- `tests/**/*.js` (all test files with tududuClient references)
- `README.md`, `docs/architecture.md`

### Reference
- Session: dd5c3d40-6e72-4f50-833a-d93be69077b9

---

## [1.9.0] - 2025-12-25

### Added
- **Dynamic GID Discovery**: Shift schedule now automatically discovers sheet tabs and GIDs from Google Sheets HTML, making it robust for future months without config updates
- **`/shift` Command**: New Telegram command with subcommands:
  - `/shift` - Show today's shift
  - `/shift week` - Show this week's shifts
  - `/shift sync` - Sync shifts to Google Calendar
  - `/shift refresh` - Force refresh from Google Sheets
- **Google Calendar Sync**: Shifts can be synced to Google Calendar as events
- **All Shift Codes**: Support for IS (Izin Sakit), Lib, PJ, CT, BL, T, 0-3
- **Shift 2 Special Dates**: Automatic detection of special timing (14:00-23:00) for tanggal 1, 2, 24, and 2 days before month end

### Changed
- `google-sheets-fetcher.js`: Complete rewrite with dynamic GID discovery, HTML parsing, 24-hour caching
- `shift-parser.js`: Added comprehensive shift code definitions and special date detection
- `index.js` (shift-schedule): Added calendar sync and Telegram formatting helpers

### Files Modified
- `src/shift-schedule/google-sheets-fetcher.js`
- `src/shift-schedule/shift-parser.js`
- `src/shift-schedule/index.js`
- `src/config.js` - Added shiftSchedule config section
- `src/index.js` - Added /shift command handler
- `.env.example` - Added SHIFT_* config variables
- `tests/shift-schedule/*.test.js` - Updated for new API (42 tests)

### Reference
- Session: dd5c3d40-6e72-4f50-833a-d93be69077b9

---

## [1.7.1] - 2025-12-25

### Changed
- **README Overhaul**: Complete rewrite of `README.md` for better onboarding
  - Added "A Day with Tududi" workflow section showing real usage patterns
  - Created feature tables with descriptions
  - Added command cheat sheet with use-case guidance
  - Detailed configuration section with required vs optional keys
  - Updated architecture diagram
  - Embedded roadmap snapshot for project visibility

### Files Modified
- `README.md` - Complete rewrite

### Reference
- Session: 63d5141b-6b7c-49b5-8f86-6cfaef9a966b

## [1.9.0] - 2025-12-26

### Added
- **Calendar Conflict Detection**: Warns when scheduling overlaps with existing events (including shifts)
- **Proactive Coaching**: Check-in messages when user is idle for 4+ hours
- Inline keyboard for conflict confirmation: `[Create Anyway]` / `[Cancel]`
- Coaching cron job at 10:00, 13:00, 16:00, 19:00

### Files Added
- `src/coaching/index.js` - CoachingService
- `tests/coaching/coaching.test.js` - 5 tests

### Files Modified
- `src/calendar/google-calendar.js` - Added `checkConflicts()`, `getEventsInRange()`
- `src/index.js` - Conflict flow, coaching init, cron job
- `src/bot/telegram-bot.js` - Added `sendMessageToUser()`

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

---

## [1.8.0] - 2025-12-25

### Added
- **Calendar Event Creation**: `/schedule` command
- Natural language parsing for events (e.g. "Meeting tomorrow at 3pm")
- Event creation via Google Calendar API (requires write scope)
- `EventParser` service using LLM

### Files Added
- `src/llm/event-parser.js`
- `tests/llm/event-parser.test.js`

### Files Modified
- `src/calendar/google-calendar.js` - Added `createEvent`, updated scope
- `src/index.js` - Added `/schedule` command and `EventParser` initialization

### Reference
- Session: ab7590e3-070b-4a85-a0d8-eeea4f9edb3f

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
