# Roadmap

## Vision
To build an AI-Powered ADHD Task Management System that seamlessly integrates messaging, task management (Tududi), and knowledge base (Obsidian) with frictionless capture (Voice/Text).

## Planned Features
### High Priority
### High Priority
- [x] **Smart Rescheduling**: `/reschedule` command with priority-based suggestions ✅
- [ ] **Recurring Tasks**: Native support for repeating tasks (daily, weekly, custom) synced to Tududi.


### Medium Priority
- [ ] **Weekly Review Dashboard**: A summary of completed tasks, productivity stats, and goals for the next week.
- [ ] **Voice Memo Diarization**: Support for distinguishing speakers in multi-user voice notes.

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
