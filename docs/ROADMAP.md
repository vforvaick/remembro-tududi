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
- [x] **Calendar Integration**: `/today` and `/calendar` commands with Google Calendar ✅
- [x] **Calendar Integration**: `/today` and `/calendar` commands with Google Calendar ✅
- [x] **Calendar Event Creation**: `/schedule` command with natural language parsing ✅
- [x] **Shift Schedule**: `/shift` command, dynamic GID discovery, Calendar sync ✅
- [x] **Rebranding**: Renamed system to **Remembro**, fixed `TududiClient` naming ✅
- [x] **Calendar Conflict Detection**: Warns when scheduling overlaps with events ✅
- [x] **Proactive Coaching**: Check-in messages when idle for 4+ hours ✅

### Backlog
- [ ] **People Context / Contact Intelligence**: Parse names from tasks and build a people knowledge base
  - AI extracts person names from messages (e.g., "submit report to Pak Egi")
  - Bot asks "Who is Pak Egi?" when encountering new names
  - Store relationship info: role, hierarchy, preferences (e.g., "Department Head, 2 levels above me")
  - Storage options: Obsidian markdown files (`People/pak-egi.md`) or JSON database
  - Future: Auto-suggest best times to contact, communication preferences, delegation patterns
- [ ] **Photo-to-Tasks**: Send photo of whiteboard/notebook → AI extracts tasks (Gemini Vision)
- [ ] **Gamification**: XP, streaks, level-up messages for dopamine-friendly task management
- [ ] **Calendar: Microsoft Support**: Add Microsoft Graph API for Teams/Outlook

## Known Issues
*No critical issues at this time.*

## Technical Debt
*No outstanding debt.*

## Recently Completed
- ✅ **Semantic Search** (2025-12-24): Questions now search knowledge base via orchestrator.
- ✅ **Chaos Mode** (2025-12-23): `/chaos` and `/normal` commands with task filtering.
- ✅ **Multi-user Support** (2025-12-23): Multiple authorized users via `TELEGRAM_ALLOWED_USERS`.
- ✅ **Test Flakiness Fix** (2025-12-22): OpenAI key optional, jest ignores `.worktrees/`.
- ✅ **VPS Infra Hardening** (2025-12-22): pm2 installed, systemd startup configured.
- ✅ **MVP 1** (2025-11-18): Core flow Telegram → Claude → Tududi/Obsidian.
