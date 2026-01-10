# Roadmap

## Vision
To build an AI-Powered ADHD Task Management System that seamlessly integrates messaging, task management (Tududi), and knowledge base (Obsidian) with frictionless capture (Voice/Text).

## Planned Features
### High Priority
### High Priority
- [x] **Smart Rescheduling**: `/reschedule` command with priority-based suggestions ✅
- [x] **Recurring Tasks**: `/recurring` command with daily/weekly/monthly patterns ✅


### Medium Priority
- [x] **Weekly Review Dashboard**: `/review` command with productivity stats ✅
- [x] **Voice Memo Diarization**: ElevenLabs Scribe with speaker detection ✅

### In Progress

### Completed Today
- [x] **Two-Stage LLM Processing**: Extractor (pro) + Companion (flash) architecture ✅
- [x] **Tentative State**: Ambiguous extractions trigger confirmation flow ✅
- [x] **CLIProxy Modernization**: Simplified LLM layer with model aliases ✅
- [x] **Project Context / Intelligence**: `/projects`, `/whatis`, and obsidian note creation for projects ✅
- [x] **Photo-to-Tasks**: Send photo of whiteboard/notes → Gemini Vision extracts tasks ✅
- [x] **Conversation State Persistence (Phase 2)**: State persists to JSON file for restart survival ✅
- [x] **Conversational Flow Enhancement**: Greeting, chitchat, story-based task extraction with confirmation flow ✅
- [x] **People Context / Contact Intelligence**: `/people` and `/whois` commands with LLM metadata extraction ✅
- [x] **Calendar Integration**: `/today` and `/calendar` commands with Google Calendar ✅
- [x] **Calendar Event Creation**: `/schedule` command with natural language parsing ✅
- [x] **Shift Schedule**: `/shift` command, dynamic GID discovery, Calendar sync ✅
- [x] **Calendar Conflict Detection**: Warns when scheduling overlaps with events ✅
- [x] **Proactive Coaching**: Check-in messages when idle for 4+ hours ✅
- [x] **Rebranding**: Renamed system to **Remembro**, fixed `TududiClient` naming ✅

### Backlog
- [ ] **Conversation Context (Phase 3)**: Full conversation history with context window for LLM
- [ ] **Gamification**: XP, streaks, level-up messages for dopamine-friendly task management
- [ ] **Calendar: Microsoft Support**: Add Microsoft Graph API for Teams/Outlook
- [ ] **People: Auto-suggest contact times**: Based on interaction history
- [ ] **People: Relationship graph**: Visualize org hierarchy from people data

## Known Issues
### Non-Critical
- **Test Leaks**: `telegram-bot.test.js` has worker process issues, likely due to mock teardown leaks.

## Technical Debt
- **Integration Test Mocks**: Tests rely heavily on mocking orchestrator's internal state rather than public API.

## Recently Completed
- ✅ **System Hardening & Stability** (2026-01-08): Fixed vision model 404s, planning filter crashes, and CLIProxy connectivity.
- ✅ **Project Context** (2025-12-28): `/projects` and `/whatis` commands, LLM project metadata extraction.
- ✅ **Conversational Flow** (2025-12-27): Greeting/chitchat/story types, story→task extraction, sequence grouping.
- ✅ **People Context** (2025-12-26): `/people` and `/whois` commands, LLM metadata extraction.
- ✅ **Semantic Search** (2025-12-24): Questions now search knowledge base via orchestrator.
- ✅ **Chaos Mode** (2025-12-23): `/chaos` and `/normal` commands with task filtering.
- ✅ **Multi-user Support** (2025-12-23): Multiple authorized users via `TELEGRAM_ALLOWED_USERS`.
- ✅ **Test Flakiness Fix** (2025-12-22): OpenAI key optional, jest ignores `.worktrees/`.
- ✅ **VPS Infra Hardening** (2025-12-22): pm2 installed, systemd startup configured.
- ✅ **MVP 1** (2025-11-18): Core flow Telegram → Claude → Tududi/Obsidian.

