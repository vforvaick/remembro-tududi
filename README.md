# 🧠 Remembro

> **AI-Powered Personal Organizer**  
> Zero-friction capture and intelligent orchestration for task management, knowledge building, and scheduling.

```
💭 Brain Dump → 🤖 AI Processing → ✅ Tasks + 📚 Knowledge + 📅 Calendar
```

**Remembro** is the "brain" that connects:
- 🎯 **Tududi** — Task Management Engine
- 📚 **Obsidian** — Knowledge Base
- 📅 **Google Calendar** — Scheduling
- ⏰ **Shift Schedule** — Work Shifts from Google Sheets

---

## ✨ Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| ⚡ **Instant Capture** | Voice or text via Telegram, processed in <10 seconds |
| 📅 **AI Daily Planning** | `/plan` generates time-blocked schedules based on energy levels |
| 🔄 **Smart Rescheduling** | `/reschedule` suggests new dates for overdue tasks by priority |
| 🔁 **Recurring Tasks** | Daily/weekly/monthly patterns with auto-generation |
| 🌪️ **Chaos Mode** | `/chaos` shows only urgent & quick tasks when overwhelmed |
| 📆 **Google Calendar Sync** | `/today` and `/calendar` show events alongside tasks |

### Intelligence Layer

| Feature | Description |
|---------|-------------|
| 🧠 **Multi-LLM Fallback** | Claude → Gemini → MegaLLM → OpenAI with automatic switching |
| 🗣️ **Voice Diarization** | ElevenLabs Scribe detects up to 32 speakers |
| 🇮🇩 **Bilingual Support** | Indonesian + English with natural date parsing ("besok", "lusa", "next Monday") |
| 📚 **Knowledge Base** | Auto-categorized notes in Obsidian with semantic search |
| 🔗 **Bidirectional Sync** | Check tasks in Obsidian ↔ syncs to Tududi automatically |

---

## 🔄 A Day with Remembro

This is how the system fits into your daily life:

### 🌅 Morning: Get Your Plan
```
You: /plan
Bot: 📅 Daily Plan
     Focus on urgent deadlines today
     
     1. Review client proposal
        ⏰ 9:00-11:00 (120m) ⚡HIGH
     2. Quick grocery run
        ⏰ 11:30-11:45 (15m) ⚡LOW
     ...
```

### 💭 During Day: Brain Dump Anything
```
You: beli susu anak, birthday mama tanggal 25, meeting with John next Monday

Bot: ✅ Created 3 tasks:
     - Beli susu anak (today)
     - Birthday mama (Nov 25, recurring yearly)
     - Meeting with John (Monday)
```

> **Voice works too!** Just tap the mic and speak naturally in Indonesian or English.

### 🌪️ Overwhelmed? Enter Chaos Mode
```
You: /chaos

Bot: 🌪️ Chaos Mode ON
     Showing only: quick (<15m) + urgent + due today
     
     1. Reply to boss email (5m) ⚡URGENT
     2. Pick up prescription (10m) ⚡TODAY
```

When things calm down:
```
You: /normal
Bot: How many minutes do you have? I'll re-plan your day.
```

### 🌙 End of Day: Clean Up
```
You: /reschedule

Bot: 📋 Overdue Tasks:
     1. Write blog post (Medium) → Suggested: Friday
     2. Call insurance (Low) → Suggested: Next week
     
     [Reschedule All] [Pick Individually]
```

### 📊 Weekly: Review Progress
```
You: /review

Bot: 📊 Weekly Review (Dec 18-24)
     ✅ Completed: 23 tasks
     ⏳ Carried over: 5 tasks
     🔥 Best day: Tuesday (8 tasks)
     💡 Pattern: You skip "admin" tasks → consider batching
```

---

## 📋 Command Cheat Sheet

| Command | Action | When to Use |
|---------|--------|-------------|
| `/plan` | Generate AI daily schedule | Start of day |
| `/today` | Show tasks + calendar events | Reality check |
| `/calendar` | View upcoming calendar (3 days) | Planning ahead |
| `/chaos` | Activate focus mode | Overwhelmed |
| `/normal` | Exit chaos mode + re-plan | When calm returns |
| `/reschedule` | Smart bulk rescheduling | End of day cleanup |
| `/recurring` | View recurring task patterns | Monthly review |
| `/review` | Weekly productivity stats | Sunday reflection |
| `/status` | System health check | Troubleshooting |
| `/help` | Show available commands | Anytime |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Docker** (for Tududi backend)
- **Telegram account**
- **At least ONE LLM API key** (Claude recommended)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/vforvaick/remembro-tududi.git
cd remembro-tududi

# 2. Start Tududi backend
docker-compose up -d

# 3. Set up environment
cp .env.example .env
# Edit .env (see Configuration below)

# 4. Install dependencies
npm install

# 5. Run application
npm start
```

### Configuration

Edit your `.env` file with the following:

#### Required Keys

| Variable | Description | How to Get |
|----------|-------------|------------|
| `TELEGRAM_BOT_TOKEN` | Your bot token | [@BotFather](https://t.me/BotFather) → `/newbot` |
| `TELEGRAM_ALLOWED_USERS` | Comma-separated user IDs | Send message to your bot, check `getUpdates` |
| `ANTHROPIC_API_KEY` | Claude API key | [console.anthropic.com](https://console.anthropic.com/) |
| `TUDUDI_API_TOKEN` | Tududi auth token | After docker-compose, visit `localhost:3000` |

#### Optional Keys (for enhanced features)

| Variable | Description | Feature Enabled |
|----------|-------------|-----------------|
| `OPENAI_API_KEY` | OpenAI key | Voice transcription (Whisper) |
| `ELEVENLABS_API_KEY` | ElevenLabs key | Voice diarization (multi-speaker) |
| `GOOGLE_CALENDAR_KEY_FILE` | Path to service account JSON | Calendar sync |
| `GEMINI_API_KEY` | Google Gemini key | LLM fallback |
| `MEGALM_API_KEY` | MegaLLM key | Access to 70+ models |

#### Example Minimal `.env`

```env
# Telegram
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
TELEGRAM_ALLOWED_USERS=12345678

# LLM (at least one required)
LLM_PROVIDERS=claude
ANTHROPIC_API_KEY=sk-ant-...

# Tududi
TUDUDI_API_URL=http://localhost:3000
TUDUDI_API_TOKEN=your_token

# Obsidian
OBSIDIAN_VAULT_PATH=/path/to/your/vault
```

See [Setup Guide](docs/SETUP.md) for detailed configuration and [LLM Providers](docs/LLM_PROVIDERS.md) for multi-provider fallback setup.

---

## 🗂️ Architecture

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│  Telegram   │────▶│      REMEMBRO        │────▶│     Tududi      │
│  (Voice/    │     │   (Orchestrator +    │     │  (Task Engine)  │
│   Text)     │     │    Intelligence)     │     └─────────────────┘
└─────────────┘     └──────────────────────┘              │
                              │                           │
                              ▼                           ▼
                    ┌──────────────────┐        ┌─────────────────┐
                    │   Shift Schedule │        │    Obsidian     │
                    │ (Google Sheets)  │        │ (Knowledge Base)│
                    └──────────────────┘        └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Google Calendar │
                    │    (Scheduling)  │
                    └──────────────────┘
```

- **Telegram**: Low-friction capture (text, voice)
- **Remembro**: Central orchestrator + LLM intelligence (Claude, Gemini, etc.)
- **Tududi**: Task storage and project management
- **Obsidian**: Knowledge notes + daily logs (bidirectional sync)
- **Google Sheets**: Work shift schedule data source
- **Google Calendar**: Event scheduling + shift sync

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Setup Guide](docs/SETUP.md) | Detailed installation & configuration |
| [User Guide](docs/USER_GUIDE.md) | Usage tips & ADHD-specific advice |
| [LLM Providers](docs/LLM_PROVIDERS.md) | Multi-LLM configuration & fallback |
| [Calendar Setup](docs/CALENDAR_SETUP.md) | Google Calendar integration |
| [Changelog](docs/CHANGELOG.md) | Version history |
| [Roadmap](docs/ROADMAP.md) | Future plans |

---

## 🗺️ Roadmap

### In Progress
- 📸 **Photo-to-Tasks**: Send photo of whiteboard/notebook → AI extracts tasks

### Planned
- 🎮 **Gamification**: XP, streaks, level-up for dopamine-friendly task completion
- 🤖 **Proactive Coaching**: Bot check-ins when you've been idle
- 📅 **Calendar: Add Events**: Natural language event creation
- ⚠️ **Calendar: Conflict Detection**: Warn when scheduling during busy times
- 🔗 **Microsoft Calendar**: Teams/Outlook integration

See full [Roadmap](docs/ROADMAP.md) for details.

---

## 🛠️ Development

```bash
npm run dev      # Start with auto-reload (nodemon)
npm test         # Run tests
npm run test:watch  # Watch mode
```

### Tech Stack

- **Runtime**: Node.js 18+
- **Bot Framework**: node-telegram-bot-api
- **LLM Providers**: Claude 3.5, Gemini, MegaLLM, GPT-4
- **Voice**: OpenAI Whisper, ElevenLabs Scribe
- **Task Backend**: Tududi (Docker)
- **Knowledge Base**: Obsidian (markdown files)
- **Calendar**: Google Calendar API (Service Account)

---

## 📄 License

MIT

---

## 🤝 Contributing

This is a personal project built for specific ADHD needs. Feel free to fork and adapt for your own use!

If you have ideas or improvements:
1. Check existing [issues](https://github.com/vforvaick/remembro-tududi/issues)
2. Open a new issue to discuss
3. Fork → Branch → PR

---

<p align="center">
  <strong>Built with 💜 for brains that work differently</strong>
</p>
