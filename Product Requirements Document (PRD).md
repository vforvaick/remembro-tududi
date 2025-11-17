# Product Requirements Document (PRD)

## Enhanced Tududi + LLM + Obsidian Integration

### AI-Powered ADHD Task Management System

**Version:** 1.0
**Date:** November 18, 2025
**Author:** Product Strategy Team
**Status:** Ready for Development

***

## Executive Summary

**Product Vision:**
An AI-powered task management system that integrates Telegram Bot, Tududi (task engine), and Obsidian (knowledge base) to solve executive dysfunction and ADHD-specific challenges through intelligent automation, proactive assistance, and low-friction capture mechanisms.

**Target User:**
Network operations shift worker with ADHD traits including:

- Executive dysfunction (poor working memory, task initiation issues, time blindness)
- Unpredictable work schedule requiring flexible planning
- Multiple business projects requiring deadline juggling
- Family responsibilities requiring memory offloading
- Need for second brain with semantic knowledge retrieval

**Core Problem Statement:**
Traditional productivity systems fail for ADHD users because they:

1. Create high friction for spontaneous capture (ideas lost in 30 seconds)
2. Require manual planning decisions (decision fatigue → procrastination)
3. Use rigid time-blocking incompatible with shifting schedules
4. Lack proactive memory assistance ("out of sight = out of mind")
5. Don't integrate task execution with knowledge management

**Solution Approach:**
Three-interface system with AI reasoning middleware that enables:

- **Zero-friction capture** via Telegram (5-second voice/text)
- **AI-powered planning** that decides "what to do today" automatically
- **Flexible scheduling** with chaos mode for unpredictable days
- **Proactive reminders** for object permanence issues
- **Semantic knowledge retrieval** connecting tasks to saved insights

**Success Metrics:**

- 90%+ capture rate (no lost ideas)
- 50%+ task completion rate (realistic planning)
- 0 forgotten spouse requests
- <10 minutes daily planning time
- System survives 2+ chaotic weeks without abandonment

***

## Table of Contents

1. [Product Overview](#product-overview)
2. [User Personas \& Use Cases](#user-personas--use-cases)
3. [System Architecture](#system-architecture)
4. [Feature Specifications](#feature-specifications)
5. [MVP Phase Breakdown](#mvp-phase-breakdown)
6. [Technical Requirements](#technical-requirements)
7. [Success Criteria](#success-criteria)
8. [Appendices](#appendices)

***

## 1. Product Overview

### 1.1 Product Components

**Component 1: Telegram Bot Interface**

- Primary user touchpoint for all interactions
- Handles text, voice, and command-based inputs
- Provides conversational AI responses
- Sends proactive notifications and daily digests

**Component 2: LLM Middleware (Brain)**

- Claude 3.5 Sonnet for natural language understanding
- Parses user intent (task vs knowledge vs question)
- Generates daily plans based on context
- Detects patterns and provides proactive suggestions
- Estimates task duration using historical data

**Component 3: Tududi (Task Engine)**

- Core task storage and management
- Hierarchical organization (Areas → Projects → Tasks)
- API-first architecture for integrations
- Recurring task support
- Native Telegram bot (enhanced with LLM layer)

**Component 4: Obsidian (Knowledge Base)**

- Markdown-based second brain
- Bidirectional sync with task manager
- Full-text and semantic search capabilities
- Knowledge graph for concept connections
- Plain text future-proof storage


### 1.2 Key Differentiators

| Feature | Traditional Apps | Our Solution |
| :-- | :-- | :-- |
| Capture | 30+ sec, multiple clicks | 5 sec voice/text to Telegram |
| Planning | Manual decision-making | AI auto-generates daily plan |
| Time Estimation | Manual guessing | AI learns from history |
| Schedule Flexibility | Rigid time blocks | Chaos mode + energy-based |
| Memory Support | Passive reminders | Proactive pattern detection |
| Knowledge Integration | Separate systems | Unified task + knowledge graph |

### 1.3 Core Value Propositions

**For ADHD Executive Dysfunction:**

- External working memory via instant capture
- Reduced decision fatigue through AI automation
- Time blindness mitigation via AI estimation
- Task initiation support through proactive nudges

**For Shifting Schedule Workers:**

- Flexible planning that survives chaos
- Energy-based task filtering (not time-based)
- Real-time rescheduling suggestions
- Anchor tasks to events, not fixed times

**For Multiple Project Juggling:**

- Deadline-aware priority automation
- AI distribution of tasks across available time
- Buffer time inclusion for unexpected work
- Visual overcommit warnings

***

## 2. User Personas \& Use Cases

### 2.1 Primary Persona: "Alex" - Network Ops Shift Worker

**Demographics:**

- Age: 28-35
- Occupation: Network Operations Engineer (shift work)
- Location: Indonesia (WIB timezone)
- Family: Married with young child
- Side Projects: Multiple small businesses (egg sales, digital products, trading)

**ADHD Traits:**

- Poor working memory (forgets ideas within 30 seconds)
- Task initiation paralysis (can't start even when important)
- Time blindness (can't estimate task duration)
- Object permanence issues (out of sight = doesn't exist)
- Decision fatigue (every choice drains energy)
- Context switching overwhelm (shifting schedule chaos)

**Pain Points:**

1. **Planning Paralysis:** "I don't know what to do today, too many options"
2. **Time Estimation Failure:** "I have no idea how long this will take"
3. **Deadline Juggling:** "Project A due 4 days, B due 6 days, how do I schedule?"
4. **Memory Failures:** "I forgot wife's request, important dates, past insights"
5. **Rigid Systems Fail:** "Daily themes don't work when shift suddenly hectic"
6. **Capture Friction:** "By the time I open app, I forgot what I wanted to note"

**Goals:**

- Capture 100% of ideas instantly without losing them
- Have AI tell him what to do (remove planning decision)
- Never forget spouse requests (relationship harmony)
- Find past knowledge quickly ("that thing about gold trading")
- Adapt to chaos without system breaking down


### 2.2 Use Case Scenarios

#### UC-001: Morning Planning (Normal Shift Day)

**Trigger:** 7:00 AM automatic daily digest
**Actors:** User, Telegram Bot, LLM, Tududi, Google Calendar
**Preconditions:** User has incomplete tasks, calendar events synced

**Flow:**

1. Bot fetches user's calendar (shift 2pm-10pm today)
2. Bot calculates free time (7am-2pm = 7h, 11pm-1am = 2h)
3. Bot fetches incomplete Tududi tasks with deadlines
4. LLM analyzes: deadlines, energy patterns, overdue items
5. LLM generates prioritized plan with specific time suggestions
6. Bot sends Telegram message with 3-5 priority tasks
7. User reviews and accepts/modifies plan
8. Bot auto-schedules tasks with 30-min-before reminders

**Success Criteria:**

- Plan generated in <3 seconds
- User spends <2 minutes reviewing
- Tasks fit available time with 15% buffer
- Energy levels matched to time of day

**Edge Cases:**

- No free time today → suggest tomorrow + warn user
- All tasks overdue → prioritize by impact
- Calendar sync fails → use previous day's pattern

***

#### UC-002: Spontaneous Idea Capture

**Trigger:** User has idea while walking/commuting
**Actors:** User, Telegram Bot, LLM, Tududi, Obsidian
**Preconditions:** Telegram bot running, user authenticated

**Flow:**

1. User opens Telegram (1 second)
2. User sends voice message: "beli susu anak, ultah mama tanggal 25" (3 seconds)
3. Bot receives, transcribes via Whisper API
4. LLM parses into structured data:
    - Task 1: "Beli susu anak" (today, shopping, LOW energy)
    - Event: "Ultah mama" (Nov 25, recurring yearly)
5. Bot creates task in Tududi via API
6. Bot sets reminder 9:30pm (before going home)
7. Bot creates recurring yearly reminder
8. Bot appends to Obsidian daily note
9. Bot confirms to user: "✅ Added 2 items..." (total: 5 seconds)

**Success Criteria:**

- Total interaction <10 seconds
- Voice transcription 95%+ accuracy (Indonesian language)
- Multi-item extraction from single message
- Context-aware reminder timing (before going home)

**Edge Cases:**

- Voice unclear → bot asks clarification question
- Ambiguous date ("next week") → bot suggests specific date
- Duplicate task detected → bot asks "Already exists, update?"

***

#### UC-003: Chaotic Shift Interruption

**Trigger:** Urgent work issue mid-day
**Actors:** User, Telegram Bot, LLM, Tududi
**Preconditions:** User had planned schedule, now interrupted

**Flow:**

1. User types: "chaos mode on" to Telegram bot
2. Bot activates chaos mode:
    - All time-blocked tasks moved to floating state
    - Filters to show only: quick (<15m), low energy, urgent deadline
    - Hides analytical/deep work tasks
3. Bot shows reduced task list (3-5 items max)
4. User handles urgent work (2-4 hours)
5. User types: "chaos off, available 2 hours"
6. LLM re-analyzes:
    - Current time + energy level
    - Remaining tasks + deadlines
    - Decides what's skippable vs critical
7. Bot suggests: "Skip gold analysis (move to tomorrow), do microstock now"
8. Bot automatically reschedules all tasks
9. User accepts, continues

**Success Criteria:**

- Chaos mode activates instantly (<1 second)
- Task list reduces by 60-80%
- Re-planning happens in <5 seconds
- Critical deadlines not missed

**Edge Cases:**

- Available time = 0 → reschedule everything to tomorrow
- Multiple urgent deadlines → prioritize by impact + stakeholders
- User forgets to turn off chaos mode → auto-disable after 24h

***

#### UC-004: Knowledge Capture \& Retrieval

**Trigger:** User reads interesting insight about trading
**Actors:** User, Telegram Bot, LLM, Obsidian
**Preconditions:** Obsidian vault configured, semantic search enabled

**Capture Flow:**

1. User sends message: "bitcoin dips before US open, rebounds Asia session, best entry 30min after open"
2. LLM detects: knowledge (not task)
3. LLM extracts:
    - Topic: Trading > Crypto > Bitcoin
    - Concepts: market timing, volatility, entry strategy
    - Actionable: Yes (create test task)
4. Bot creates Obsidian note: `Knowledge/Trading/Bitcoin-Market-Timing.md`
5. Bot links to related notes via [[wikilinks]]
6. Bot creates task: "Test Bitcoin 30-min strategy" (this week)
7. Bot confirms: "💡 Knowledge captured + test task created"

**Retrieval Flow (3 weeks later):**

1. User asks: "dulu aku pernah baca tentang bitcoin timing"
2. LLM performs semantic search in Obsidian vault
3. LLM finds: Bitcoin-Market-Timing.md (score 0.95)
4. Bot replies with excerpt + link to full note
5. Bot offers: "Want summary of all crypto insights?"

**Success Criteria:**

- Knowledge note created in <5 seconds
- Semantic search finds correct note 90%+ accuracy
- Related concepts automatically linked
- Retrieval within 3 seconds of query

***

#### UC-005: Spouse Request Memory Offload

**Trigger:** Wife sends WhatsApp with multiple requests
**Actors:** User, Telegram Bot, LLM, Tududi, Obsidian
**Preconditions:** User immediately captures to Telegram

**Flow:**

1. Wife WhatsApp: "tolong beli susu anak, jangan lupa ultah mama tanggal 25, terus minggu depan antar aku ke dokter"
2. User voice captures to Telegram bot (while walking): [same message]
3. LLM extracts 3 items:
    - Task: "Beli susu anak" (today, shopping)
    - Event: "Ultah mama" (Nov 25, recurring)
    - Task: "Antar istri ke dokter" (next week, needs time coordination)
4. Bot creates all items in Tududi
5. Bot sets context-aware reminders:
    - Susu: 9:30pm reminder (before going home)
    - Ultah: Reminders Nov 22 (buy gift) + Nov 25 (call)
    - Dokter: Asks "What day next week?" for specific scheduling
6. Bot saves to Obsidian with [[from-Istri]] tag for tracking
7. Bot confirms: "✅ Added 3 items from Istri, you won't forget"

**Success Criteria:**

- All items extracted (3/3 = 100%)
- Context-aware timing (shopping reminder before going home)
- Recurring events auto-created for future years
- Searchable in Obsidian: "what did istri ask last month?"

***

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Alex)                              │
│  Primary Interface: Telegram Mobile App                         │
└──────────────┬────────────────────────────┬─────────────────────┘
               │                            │
               │ Text/Voice                 │ View Tasks
               │ Commands                   │ Edit Notes
               ▼                            ▼
┌─────────────────────────────┐  ┌──────────────────────────────┐
│   TELEGRAM BOT SERVICE      │  │   OBSIDIAN VAULT             │
│   (User Interface Layer)    │  │   (Knowledge Storage)        │
├─────────────────────────────┤  ├──────────────────────────────┤
│ - Message handling          │  │ - Markdown files             │
│ - Voice transcription       │  │ - Daily notes (YYYY-MM-DD)   │
│ - Command routing           │  │ - Knowledge hierarchy        │
│ - Notification sending      │  │ - Full-text search           │
│ - Inline keyboards          │  │ - Wikilink graph             │
└────────────┬────────────────┘  └────────────┬─────────────────┘
             │                                  │
             │ API Calls                        │ File System
             │                                  │ Read/Write
             ▼                                  ▼
┌──────────────────────────────────────────────────────────────┐
│              LLM MIDDLEWARE (Brain/Reasoning)                │
│                  Node.js Service                             │
├──────────────────────────────────────────────────────────────┤
│ Core Modules:                                                │
│ ┌────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│ │ NLP Parser     │  │ Task Analyzer   │  │ Plan Generator│ │
│ │ (Claude API)   │  │ (Priority Logic)│  │ (Schedule AI) │ │
│ └────────────────┘  └─────────────────┘  └───────────────┘ │
│                                                              │
│ ┌────────────────┐  ┌─────────────────┐  ┌───────────────┐ │
│ │ Knowledge      │  │ Pattern Detect  │  │ Proactive     │ │
│ │ Classifier     │  │ (Historical)    │  │ Suggestions   │ │
│ └────────────────┘  └─────────────────┘  └───────────────┘ │
│                                                              │
│ ┌────────────────┐  ┌─────────────────┐                    │
│ │ Time Estimator │  │ Context Manager │                    │
│ │ (ML-based)     │  │ (User State)    │                    │
│ └────────────────┘  └─────────────────┘                    │
└──────────┬──────────────────────────┬────────────────────────┘
           │                          │
           │ REST API                 │ File Watcher
           │                          │ Bidirectional Sync
           ▼                          ▼
┌─────────────────────────┐  ┌───────────────────────────────┐
│   TUDUDI API            │  │   OBSIDIAN SYNC SERVICE       │
│   (Task Engine)         │  │   (File Monitor)              │
├─────────────────────────┤  ├───────────────────────────────┤
│ - Task CRUD             │  │ - Watch vault changes         │
│ - Projects/Areas        │  │ - Parse checkbox states       │
│ - Recurring patterns    │  │ - Sync task completion        │
│ - Due dates/reminders   │  │ - Create daily note entries   │
│ - API authentication    │  │ - Conflict resolution         │
└─────────────────────────┘  └───────────────────────────────┘
           │
           │ PostgreSQL/SQLite
           ▼
┌─────────────────────────┐
│   DATABASE              │
│   (Task Storage)        │
├─────────────────────────┤
│ - Tasks table           │
│ - Projects/Areas        │
│ - User settings         │
│ - Historical patterns   │
│ - Completion metrics    │
└─────────────────────────┘

EXTERNAL INTEGRATIONS (Optional Phase 2+):
┌─────────────────────┐  ┌──────────────────┐
│ Google Calendar API │  │ Whisper API      │
│ (Schedule sync)     │  │ (Voice→Text)     │
└─────────────────────┘  └──────────────────┘
```


### 3.2 Data Flow: Capture to Storage

```
[User Voice Message] 
    → Telegram Bot receives
    → Whisper API transcribes (if voice)
    → LLM Middleware parses intent
    → Determines type: TASK | KNOWLEDGE | QUESTION
    
IF TASK:
    → LLM extracts structured data (title, due_date, project, etc)
    → Calls Tududi API → Create task
    → Calls Obsidian Sync → Append to daily note
    → Sends confirmation to user
    
IF KNOWLEDGE:
    → LLM extracts topic, concepts, tags
    → Creates Obsidian note in Knowledge/[category]/
    → Links to related notes via [[wikilinks]]
    → If actionable → also creates task
    → Sends confirmation with note path
    
IF QUESTION:
    → LLM determines required context (tasks/calendar/notes)
    → Fetches data from relevant sources
    → Semantic search in Obsidian (if needed)
    → LLM synthesizes answer
    → Sends response with sources
```


### 3.3 Technology Stack

**Frontend/Interface:**

- Telegram Bot API (node-telegram-bot-api v0.64+)
- Inline keyboards for interactive responses
- Rich message formatting (Markdown)

**Backend/Middleware:**

- Node.js 18+ (LTS)
- Express.js (optional REST endpoints)
- Anthropic SDK (@anthropic-ai/sdk) - Claude 3.5 Sonnet
- Axios (HTTP client for APIs)

**Task Engine:**

- Tududi (existing, Docker deployment)
- PostgreSQL or SQLite database
- REST API for programmatic access

**Knowledge Base:**

- Obsidian (desktop application)
- Markdown file storage (plain text)
- Chokidar (file system watcher for sync)
- Node.js fs module for file I/O

**Voice Processing:**

- OpenAI Whisper API (transcription)
- Support for Indonesian language (id-ID)

**External APIs (Optional):**

- Google Calendar API (schedule integration)
- Weather API (context-aware suggestions)

**Infrastructure:**

- Docker (containerization)
- PM2 (process management)
- Nginx (reverse proxy, optional)
- Linux VPS or local server

**Development Tools:**

- Git (version control)
- Cursor/VS Code + AI assistants
- Postman (API testing)
- Jest (unit testing)

***

## 4. Feature Specifications

### 4.1 Core Features (MVP 1 - Must Have)

#### F-001: Intelligent Task Capture

**Description:**
Zero-friction capture of tasks via Telegram with AI parsing for structured data extraction.

**User Story:**
As a user with ADHD, I want to capture tasks instantly via voice or text without needing to fill forms, so that I don't lose ideas due to working memory limitations.

**Acceptance Criteria:**

- [ ] User can send text message to Telegram bot
- [ ] User can send voice message (transcribed via Whisper API)
- [ ] LLM extracts: title, due date, time estimate, project, priority
- [ ] Bot creates task in Tududi via API call
- [ ] Bot appends task to Obsidian daily note
- [ ] Bot confirms with formatted message showing extracted data
- [ ] Entire flow completes in <10 seconds
- [ ] Supports natural language: "besok", "next Monday", "jam 9 pagi"
- [ ] Handles multi-task messages: extracts multiple tasks from one message
- [ ] Indonesian language support (90%+ transcription accuracy)

**Technical Notes:**

- Use Claude function calling or structured outputs for JSON extraction
- Prompt engineering to handle ambiguous dates/times
- Fallback: if LLM unsure, ask clarifying question
- Store raw message + parsed data for learning/debugging

**Priority:** P0 (Critical)
**Effort Estimate:** 8 hours (3 subtasks)

***

#### F-002: AI Daily Planning

**Description:**
Automated generation of daily task plan based on available time, deadlines, and user energy patterns.

**User Story:**
As a user who struggles with planning, I want the system to tell me what to do today, so that I don't waste energy on decision-making.

**Acceptance Criteria:**

- [ ] Bot automatically sends daily digest at 7:00 AM (configurable)
- [ ] Fetches user's calendar to calculate free time
- [ ] Fetches incomplete Tududi tasks with deadlines
- [ ] LLM generates plan considering:
    - Task deadlines (urgent first)
    - Time estimates vs available time
    - Energy patterns (morning=HIGH, evening=LOW)
    - Buffer time (15-20% of available time)
- [ ] Plan includes specific time suggestions (e.g., "9-11am")
- [ ] Shows overcommit warnings if tasks > available time
- [ ] User can accept (auto-schedule), modify, or reject plan
- [ ] Accepted plan creates Tududi tasks with due times
- [ ] Sets 30-min-before reminders for each task

**Technical Notes:**

- Store user's historical completion rates to refine estimates
- Use timezone-aware datetime (Asia/Jakarta)
- Handle empty calendar (no external events) gracefully
- Prompt includes user's ADHD considerations explicitly

**Priority:** P0 (Critical)
**Effort Estimate:** 12 hours (4 subtasks)

***

#### F-003: Chaos Mode (Flexible Rescheduling)

**Description:**
Emergency mode that simplifies task list and enables quick rescheduling when work suddenly becomes chaotic.

**User Story:**
As a shift worker with unpredictable schedule, I want to quickly filter tasks to only quick/urgent items when work suddenly gets hectic, so the system doesn't become a burden.

**Acceptance Criteria:**

- [ ] User sends command: `/chaos` or "chaos mode on"
- [ ] Bot activates chaos mode:
    - Marks all time-blocked tasks as floating
    - Filters to show only: <15min tasks, LOW energy tasks, urgent deadlines
    - Hides analytical/deep work tasks
- [ ] Reduced task list (typically 60-80% reduction)
- [ ] User can still add new tasks (auto-marked as chaos-compatible)
- [ ] User sends: "chaos off" or `/normal`
- [ ] Bot prompts: "How much time do you have now?"
- [ ] User specifies available time
- [ ] LLM re-plans remaining tasks:
    - Moves non-critical to tomorrow/later
    - Prioritizes by deadline + impact
    - Suggests what to do in available time
- [ ] Bot shows new plan for approval

**Technical Notes:**

- Store chaos mode state in user session/database
- Auto-disable chaos mode after 24 hours (safety)
- Track which tasks were skipped during chaos for pattern learning
- Consider user's current energy level (probably MEDIUM post-chaos)

**Priority:** P0 (Critical for target user)
**Effort Estimate:** 6 hours (3 subtasks)

***

#### F-004: Obsidian Bidirectional Sync

**Description:**
Real-time synchronization between Tududi tasks and Obsidian daily notes with support for task completion in either system.

**User Story:**
As a user who wants a second brain, I need my tasks to appear in my Obsidian daily notes so I can see them alongside my knowledge and mark them complete in either system.

**Acceptance Criteria:**

- [ ] Every task created in Tududi appears in Obsidian daily note within 5 minutes
- [ ] Format: `- [ ] Task title (due: YYYY-MM-DD) ⏱️30m ⚡HIGH #project [[Tududi-123]]`
- [ ] Completed tasks show: `- [x] Task title ...`
- [ ] File watcher detects Obsidian checkbox changes
- [ ] Checking box in Obsidian → marks task complete in Tududi (within 5 min)
- [ ] Unchecking box in Obsidian → marks task incomplete in Tududi
- [ ] Supports daily note templates (doesn't break user's existing structure)
- [ ] Handles sync conflicts (both systems changed): Last write wins with warning
- [ ] Creates daily note if it doesn't exist (using template if configured)

**Technical Notes:**

- Use Chokidar to watch Obsidian vault directory
- Debounce file changes (wait 2 sec after last change before processing)
- Parse markdown to extract task IDs via regex: `$$Tududi-(\d+)$$`
- Store last sync timestamp to avoid re-processing
- Optionally use Obsidian Local REST API if installed (faster than file watching)

**Priority:** P0 (Critical)
**Effort Estimate:** 10 hours (4 subtasks)

***

#### F-005: Knowledge Note Creation

**Description:**
AI-powered detection of knowledge vs tasks, automatic creation of structured Obsidian notes with tagging and linking.

**User Story:**
As a user who captures insights, I want conceptual information automatically saved as notes (not tasks) with proper categorization, so I can find it later.

**Acceptance Criteria:**

- [ ] LLM detects knowledge messages (vs task messages)
- [ ] LLM extracts: title, content, category, tags, related concepts
- [ ] Bot creates Obsidian note at `Knowledge/[category]/[slug]-[date].md`
- [ ] Note includes:
    - Structured content (headings, bullet points)
    - Tags for searchability (e.g., \#trading \#crypto \#bitcoin)
    - Related concept links (e.g., [[Dollar-Index]], [[Technical-Analysis]])
    - Metadata (created date, source: Telegram)
- [ ] If knowledge is actionable, also creates a task
    - Example: "Test Bitcoin 30-min strategy" task created
    - Task links back to knowledge note: `See [[Bitcoin-Market-Timing]]`
- [ ] Bot confirms with note path and search keywords
- [ ] Updates knowledge index file for easy navigation

**Technical Notes:**

- Use LLM to determine is_knowledge vs is_task (confidence threshold)
- Slug generation: lowercase, replace spaces with hyphens, remove special chars
- Create directory structure recursively if doesn't exist
- Link detection: scan existing notes for similar titles/concepts
- Optional: Generate embedding vectors for semantic search (Phase 2)

**Priority:** P0 (Critical)
**Effort Estimate:** 8 hours (3 subtasks)

***

#### F-006: Semantic Knowledge Search

**Description:**
Natural language search across Obsidian vault with AI-powered answer synthesis from user's own notes.

**User Story:**
As a user who forgets past insights, I want to ask questions in natural language and get answers from my own saved notes, so I can retrieve knowledge quickly.

**Acceptance Criteria:**

- [ ] User asks question via Telegram: "dulu aku pernah baca tentang bitcoin timing"
- [ ] LLM performs semantic search in Obsidian vault
- [ ] Search considers: keywords, concepts, related terms (not just exact match)
- [ ] Returns top 3-5 most relevant notes with relevance scores
- [ ] Bot shows:
    - Note title
    - Excerpt (100-200 chars context around match)
    - Link to full note: `[[Note-Title]]`
    - Creation date
- [ ] User can ask follow-up: "summarize all crypto insights"
- [ ] LLM retrieves all crypto-tagged notes
- [ ] LLM synthesizes summary from multiple notes
- [ ] Cites sources: "Based on 5 notes: [[Note1]], [[Note2]]..."

**Technical Notes:**

- Phase 1: Simple full-text search (regex across all .md files)
- Phase 2: Embedding-based semantic search (OpenAI embeddings + vector DB)
- Use sliding window to extract context around matches
- Cache search index for performance (rebuild when vault changes)
- Support Indonesian + English queries

**Priority:** P0 (Critical)
**Effort Estimate:** 10 hours (4 subtasks)

***

#### F-007: Proactive Reminders

**Description:**
Context-aware reminders based on time, location (future), and user patterns to combat object permanence issues.

**User Story:**
As a user with object permanence issues, I need reminders that are smart about timing and context, so I don't forget tasks when they're not visible.

**Acceptance Criteria:**

- [ ] Time-based reminders:
    - 30 minutes before scheduled task start
    - Morning of task due date (if no specific time)
    - Evening before next day's tasks (preview)
- [ ] Reminder messages include:
    - Task title + context
    - Link to related notes (if any)
    - Action items from previous meetings/sessions
    - Quick actions: "Start Pomodoro" button
- [ ] Spouse request reminders:
    - Context-aware timing: "before going home" for shopping
    - Higher priority notifications (can't be ignored)
    - Track completion rate separately (show to user)
- [ ] Important date reminders (birthdays, anniversaries):
    - Multi-tier: 1 week before, 3 days before, 1 day before, morning of
    - Suggest actions: "Buy gift" (3 days before), "Call" (morning of)
    - Recurring yearly for birthdays/anniversaries
- [ ] Pattern-based proactive nudges:
    - "You mentioned X 3 days ago but haven't created a task. Should I add it?"
    - "You usually call parents bi-weekly. Last call: 12 days ago. Reminder?"
    - "Task Y is overdue by 2 days. Start now or reschedule?"

**Technical Notes:**

- Use node-cron for scheduled jobs
- Store user's home-going time (learned from calendar patterns)
- Tag tasks with [[from-Istri]] for special handling
- Track completion rates per category for learning
- Notification levels: INFO, WARNING, URGENT (different sound/vibration)

**Priority:** P0 (Critical)
**Effort Estimate:** 12 hours (5 subtasks)

***

### 4.2 Enhanced Features (MVP 2 - Should Have)

#### F-008: AI Time Estimation Learning

**Description:**
Machine learning-based time estimation that improves by learning from user's actual completion times.

**Acceptance Criteria:**

- [ ] When task completed, log actual time taken (if available)
- [ ] Compare estimated vs actual time
- [ ] Build ML model (simple regression or rule-based initially):
    - Features: task type, keywords, project, time of day, user energy
    - Target: actual time taken
- [ ] Model updates weekly with new data
- [ ] Future estimates use model predictions
- [ ] Show confidence interval: "30-45 minutes" instead of exact
- [ ] Warn if estimate consistently wrong (suggest user manual adjustment)

**Priority:** P1 (Important)
**Effort Estimate:** 10 hours

***

#### F-009: Burnout Detection

**Description:**
Pattern analysis to detect overwork and proactively suggest rest days.

**Acceptance Criteria:**

- [ ] Track daily work hours (shift + project tasks)
- [ ] Track completion rate trends (dropping = stress signal)
- [ ] Detect patterns:
    - 3+ consecutive days with 12+ hour work
    - Completion rate dropping below 50%
    - Evening tasks consistently skipped
    - Buffer time always consumed
- [ ] Bot sends warning: "Burnout risk detected"
- [ ] Suggests rest day with cleared schedule
- [ ] Offers to reschedule non-urgent tasks
- [ ] Tracks if user accepts suggestions (learn when to intervene)

**Priority:** P1 (Important for long-term usage)
**Effort Estimate:** 8 hours

***

#### F-010: Google Calendar Integration

**Description:**
Sync tasks and shifts from Google Calendar to improve planning accuracy.

**Acceptance Criteria:**

- [ ] OAuth authentication with Google
- [ ] Read calendar events (meetings, shifts)
- [ ] Calculate free time based on calendar
- [ ] Write task time-blocks back to calendar (optional)
- [ ] Two-way sync: calendar changes reflect in planning
- [ ] Detect shift schedule automatically (recurring pattern)

**Priority:** P1 (Important)
**Effort Estimate:** 8 hours

***

### 4.3 Advanced Features (MVP 3 - Nice to Have)

#### F-011: Pomodoro Timer Integration

**Description:**
Built-in Pomodoro timer with Telegram notifications for task initiation support.

**Acceptance Criteria:**

- [ ] User sends: "start pomodoro [task_id]" or clicks button
- [ ] Bot starts 25-minute countdown
- [ ] Bot marks task as "in progress" in Tududi
- [ ] Notification at 0:00: "Time's up! Take 5 min break"
- [ ] After break, option to continue or mark complete
- [ ] Tracks number of pomodoros per task
- [ ] Statistics: "You completed 3 pomodoros today"

**Priority:** P2 (Nice to have)
**Effort Estimate:** 6 hours

***

#### F-012: Energy-Based Task Filtering

**Description:**
Tag tasks with energy requirements and filter by user's current energy level.

**Acceptance Criteria:**

- [ ] LLM assigns energy level: HIGH, MEDIUM, LOW
- [ ] User can manually set current energy: `/energy low`
- [ ] Task list filters automatically based on energy
- [ ] HIGH energy tasks: analytical work, deep thinking, creative
- [ ] MEDIUM energy tasks: meetings, emails, admin
- [ ] LOW energy tasks: checklists, quick calls, simple errands
- [ ] Time-of-day defaults: morning=HIGH, afternoon=MEDIUM, evening=LOW

**Priority:** P2 (Nice to have)
**Effort Estimate:** 6 hours

***

#### F-013: Visual Time-Blocking Interface

**Description:**
Web-based calendar view showing hourly time blocks for visual planning (future enhancement).

**Acceptance Criteria:**

- [ ] Separate web application (React/Vue)
- [ ] Calendar view: 7am-11pm hourly slots
- [ ] Drag-drop tasks to time slots
- [ ] Visual warnings for overcommitment (red highlight)
- [ ] Mobile-responsive design
- [ ] Syncs with Tududi + Telegram bot

**Priority:** P2 (Nice to have, Phase 3)
**Effort Estimate:** 20 hours

***

## 5. MVP Phase Breakdown

### MVP 1: Core Usable System (Week 1-2, ~60 hours)

**Goal:** Deliver fully functional system solving primary pain points
**Outcome:** User can capture, plan, and execute tasks with AI assistance + knowledge management

**Included Features:**

- ✅ F-001: Intelligent Task Capture (text + voice)
- ✅ F-002: AI Daily Planning
- ✅ F-003: Chaos Mode
- ✅ F-004: Obsidian Bidirectional Sync
- ✅ F-005: Knowledge Note Creation
- ✅ F-006: Semantic Knowledge Search
- ✅ F-007: Proactive Reminders

**Success Criteria:**

- User captures 90%+ ideas without loss
- Daily planning takes <2 minutes
- System survives 1 chaotic shift week
- Knowledge retrieval success rate 80%+
- 0 forgotten spouse requests

**Deliverables:**

- Telegram bot service (running 24/7)
- LLM middleware (Node.js service)
- Obsidian sync service (file watcher)
- Tududi deployment (Docker)
- Configuration files (.env templates)
- Basic user documentation
- Testing checklist

***

### MVP 2: Learning \& Optimization (Week 3-4, ~30 hours)

**Goal:** Add intelligence and learning capabilities
**Outcome:** System adapts to user patterns and proactively prevents issues

**Included Features:**

- ✅ F-008: AI Time Estimation Learning
- ✅ F-009: Burnout Detection
- ✅ F-010: Google Calendar Integration

**Success Criteria:**

- Time estimates within 20% of actual
- 1 burnout prevention success
- Calendar sync reduces manual planning time by 30%

**Deliverables:**

- ML model for time estimation (simple regression)
- Pattern detection algorithms
- Google Calendar OAuth flow
- Enhanced daily planning with calendar awareness
- Analytics dashboard (basic)

***

### MVP 3: Polish \& Advanced Features (Week 5-6, ~30 hours)

**Goal:** Add convenience features and improve UX
**Outcome:** System is delightful to use with minimal friction

**Included Features:**

- ✅ F-011: Pomodoro Timer Integration
- ✅ F-012: Energy-Based Task Filtering
- ✅ F-013: Visual Time-Blocking Interface (basic version)

**Success Criteria:**

- Pomodoro usage 3+ times per week
- Energy filtering used 5+ times per week
- User satisfaction score 8+/10

**Deliverables:**

- Pomodoro service with Telegram notifications
- Energy filtering logic in LLM prompts
- Basic web UI for time-blocking (optional)
- Comprehensive user guide
- Video walkthrough

***

## 6. Technical Requirements

### 6.1 System Requirements

**Development Environment:**

- Node.js 18+ (LTS)
- npm or yarn package manager
- Git for version control
- Cursor or VS Code with AI assistant
- Docker 20+ and Docker Compose
- PostgreSQL 14+ or SQLite 3+
- Linux, macOS, or WSL2 on Windows

**Production Environment:**

- Linux VPS (Ubuntu 22.04 LTS recommended)
- Minimum: 2 CPU cores, 4GB RAM, 20GB SSD
- Recommended: 4 CPU cores, 8GB RAM, 50GB SSD
- Docker and Docker Compose installed
- PM2 or systemd for process management
- Nginx (optional, for reverse proxy)
- SSL certificate (Let's Encrypt)

**External Services:**

- Telegram Bot API (free, requires bot token)
- Anthropic Claude API (paid, ~\$10-30/month)
- OpenAI Whisper API (paid, ~\$5-10/month for transcription)
- Google Calendar API (free, optional)


### 6.2 Security Requirements

**Authentication:**

- Telegram bot token stored in environment variable
- API keys encrypted at rest
- User authentication via Telegram user ID
- Rate limiting: 10 requests/minute per user

**Data Protection:**

- Database encrypted at rest (optional)
- HTTPS for all external API calls
- No sensitive data in logs (mask API keys)
- Obsidian vault permissions: user-only read/write

**Privacy:**

- User data stays on user's server (self-hosted)
- No data sent to third parties except LLM APIs
- LLM prompts don't include unnecessary personal info
- Option to use local LLM (Ollama) in future


### 6.3 Performance Requirements

**Response Times:**

- Telegram message acknowledgment: <1 second
- Task capture (text): <5 seconds end-to-end
- Task capture (voice): <10 seconds (including transcription)
- Daily plan generation: <10 seconds
- Knowledge search: <5 seconds
- Obsidian sync latency: <5 minutes (acceptable)

**Scalability:**

- Support 1 user initially (can extend to multi-user later)
- Handle 100+ tasks in database
- Handle 1000+ Obsidian notes
- 50+ daily interactions with bot
- Concurrent processing: 2-3 requests

**Reliability:**

- Uptime: 99% (allow for maintenance)
- Auto-restart on crash (PM2 or systemd)
- Graceful degradation: if LLM API down, basic features still work
- Data backup: daily automatic backup of database + Obsidian vault


### 6.4 Integration Requirements

**Tududi API:**

- Endpoints needed:
    - `POST /api/tasks` (create task)
    - `GET /api/tasks` (list tasks)
    - `GET /api/tasks/:id` (get task)
    - `PATCH /api/tasks/:id` (update task)
    - `DELETE /api/tasks/:id` (delete task)
    - `GET /api/projects` (list projects)
    - `GET /api/areas` (list areas)
- Authentication: Bearer token
- Response format: JSON

**Telegram Bot API:**

- Webhook or polling (polling recommended for simplicity)
- Support for:
    - Text messages
    - Voice messages (file download)
    - Commands (/)
    - Inline keyboards (buttons)
    - Message editing
- Rate limits: 30 messages/second

**Obsidian:**

- File system access (read/write .md files)
- Optional: Obsidian Local REST API plugin
- Daily note template support
- No database, pure markdown files

**Claude API:**

- Model: claude-3-5-sonnet-20241022
- Max tokens: 4096 per response (configurable)
- Streaming: not required for MVP
- Function calling / tool use: optional but recommended


### 6.5 Testing Requirements

**Unit Tests:**

- Jest for JavaScript testing
- Coverage: 60%+ for critical paths
- Test files: `*.test.js` alongside source
- Run: `npm test`

**Integration Tests:**

- Test Telegram → LLM → Tududi flow
- Test Obsidian sync (create → read → update)
- Test LLM parsing edge cases
- Mock external APIs (Telegram, Claude)

**Manual Testing:**

- Use case walkthroughs (UC-001 to UC-005)
- Edge case testing (empty calendar, no tasks, etc.)
- Performance testing (response times)
- Usability testing with target user

**Acceptance Testing:**

- User performs daily workflow for 1 week
- Success criteria from MVP 1 measured
- User feedback collected and prioritized

***

## 7. Success Criteria

### 7.1 Product Success Metrics (Measured after 4 weeks)

| Metric | Target | Measurement Method |
| :-- | :-- | :-- |
| **Capture Rate** | 90%+ | User self-report: "Did you lose any ideas this week?" |
| **Task Completion Rate** | 50%+ | Tasks completed / tasks created (from Tududi data) |
| **Planning Time** | <10 min/day | User self-report + timestamp analysis |
| **Forgotten Spouse Requests** | 0 | User + spouse confirmation |
| **Knowledge Retrieval Success** | 80%+ | Successful searches / total search attempts |
| **Chaos Survival** | 2+ weeks | System used during 2 hectic weeks without abandonment |
| **Daily Active Usage** | 6+ days/week | User interactions with bot (Telegram analytics) |
| **User Satisfaction** | 8+/10 | Post-MVP survey (System Usability Scale) |

### 7.2 Technical Success Metrics

| Metric | Target | Measurement Method |
| :-- | :-- | :-- |
| **System Uptime** | 99%+ | Monitoring logs (PM2 or systemd) |
| **Response Time (capture)** | <10 sec | Server logs (timestamp analysis) |
| **LLM Parsing Accuracy** | 85%+ | Manual review of 50 samples |
| **Sync Latency** | <5 min | File watcher logs |
| **Voice Transcription Accuracy** | 90%+ | Manual review (Indonesian language) |
| **Crash Frequency** | <1 per week | Error logs |

### 7.3 Business Success Criteria

**Primary Goal:** User successfully manages ADHD + shifting schedule without system abandonment

**Secondary Goals:**

1. User completes at least 1 critical deadline (Project A or B) on time
2. User reports reduced stress/anxiety around planning
3. Wife reports improved communication (no forgotten requests)
4. User builds knowledge base (50+ notes by end of month 1)

**Long-term Vision:**

- Open source the system (MIT license) for ADHD community
- Potential SaaS offering (hosted version) at \$10-20/month
- Marketplace for custom LLM prompts / workflows
- Integration with other ADHD-friendly tools

***

## 8. Appendices

### Appendix A: Glossary

| Term | Definition |
| :-- | :-- |
| **ADHD** | Attention Deficit Hyperactivity Disorder - neurodevelopmental condition affecting executive function |
| **Executive Dysfunction** | Impairment in cognitive processes like planning, working memory, and task initiation |
| **Working Memory** | Short-term memory system for holding and manipulating information (typically 30 seconds for ADHD) |
| **Time Blindness** | Inability to accurately estimate duration or passage of time |
| **Object Permanence** | Cognitive understanding that objects exist even when not visible (impaired in ADHD) |
| **Chaos Mode** | Emergency system state with simplified task list for unpredictable work interruptions |
| **Cognitive Offloading** | Strategy of using external tools to reduce mental burden |
| **Semantic Search** | Search based on meaning/intent rather than exact keyword matching |
| **Bidirectional Sync** | Data changes in either system automatically reflected in the other |
| **LLM** | Large Language Model - AI system trained on text (e.g., Claude, GPT-4) |
| **RAG** | Retrieval-Augmented Generation - LLM technique using external knowledge base |

### Appendix B: User Research Summary

**Interview Findings (User: Alex):**

- ✅ Telegram is primary communication tool (checks 50+ times/day)
- ✅ Voice messages preferred over typing (faster while multitasking)
- ✅ Morning planning attempts failed due to unpredictability
- ✅ GTD/Second Brain too complex (abandoned after 2 weeks)
- ✅ Shifts vary: Day (8am-4pm), Evening (2pm-10pm), Night (10pm-6am)
- ✅ Wife uses WhatsApp for requests (often multiple items per message)
- ✅ Uses Obsidian sporadically (500+ notes but poor organization)
- ✅ Tried Todoist, TickTick, Notion (all abandoned within weeks)

**Pain Point Ranking (1=Highest):**

1. Forgetting ideas/tasks within minutes (working memory)
2. Can't decide what to do (planning paralysis)
3. Forgetting wife's requests (relationship impact)
4. Can't estimate time (always late/overcommitted)
5. Can't find past notes (knowledge retrieval)

### Appendix C: Competitive Analysis

| Product | Strengths | Weaknesses | Price | ADHD Score |
| :-- | :-- | :-- | :-- | :-- |
| **Motion** | AI scheduling, deadline-aware | Expensive, cloud-only | \$34/mo | 9/10 |
| **Akiflow** | Time-blocking, integrations | Buggy mobile, no AI | \$19/mo | 6/10 |
| **Todoist** | Simple, popular, stable | No AI, manual planning | \$5/mo | 6/10 |
| **Notion** | Flexible, all-in-one | Decision fatigue, slow | \$10/mo | 4/10 |
| **Our Solution** | AI + ADHD-optimized, self-hosted | Requires technical setup | \$15/mo | 9.5/10 |

**Key Differentiators:**

- Only solution with Telegram-first interface (lowest friction)
- Only solution with chaos mode (shifting schedule support)
- Only solution integrating task + knowledge (Obsidian)
- Self-hosted = data privacy + full customization
- Open source potential = community contributions


### Appendix D: Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| :-- | :-- | :-- | :-- |
| **LLM API costs exceed budget** | Medium | Medium | Monitor usage, implement caching, fallback to local LLM |
| **User abandons system (too complex)** | Medium | High | Focus on MVP 1 simplicity, extensive user testing |
| **Obsidian sync conflicts** | Medium | Low | Implement last-write-wins + manual merge tool |
| **Voice transcription accuracy poor** | Low | Medium | Use Whisper API (high accuracy), manual correction flow |
| **Tududi API changes break integration** | Low | High | Abstract API calls, version pinning, fork if necessary |
| **Data loss (database corruption)** | Low | High | Daily automated backups, point-in-time recovery |
| **Privacy concerns (LLM sees data)** | Medium | Medium | Use Anthropic (privacy-focused), option for local LLM future |


***

## Supporting Documents

This PRD is accompanied by the following documents:

1. **Technical Design Document (TDD)** - Detailed architecture and API specifications
2. **Development Tasks (tasks.json)** - Granular subtasks for AI coding assistant
3. **API Documentation** - Endpoint specifications for Tududi, Claude, Telegram
4. **User Guide** - Step-by-step setup and usage instructions
5. **Testing Checklist** - Acceptance criteria validation
6. **Deployment Guide** - Docker setup, environment configuration
7. **Prompt Library** - Optimized LLM prompts for each feature

***

**Document Control:**

- Version: 1.0
- Last Updated: November 18, 2025
- Next Review: After MVP 1 completion (Week 3)
- Change Log: Initial release

***

*This PRD is a living document and will be updated based on user feedback, technical discoveries, and evolving requirements.*

***
