# Feature Design Documents

**Project**: Remembro-Tududi - AI-Powered ADHD Task Management System
**Last Updated**: 2025-11-24
**Status**: Design Phase Complete (Ready for Implementation)

---

## Overview

This folder contains detailed design documents for features planned in MVP 1, 2, and 3. Each design includes:
- Feature overview and purpose
- User interaction flows
- Data models and algorithms
- Error handling
- Success criteria
- Future enhancements

---

## Completed Designs (Ready for Implementation)

### 1. Daily Planning
**File**: `01-daily-planning.md`
**Status**: ✅ Design Complete
**Priority**: P0 (Critical)

Automated daily task planning with three access modes:
- Auto-trigger at 5 AM
- Manual `/plan [timeframe]` command
- Natural language triggers ("hari ini ngapain aja?")
- Includes `/replan` for adaptive rescheduling
- Integrates with shift schedule

**Key features:**
- Time-blocked schedule format (24-hour)
- Task prioritization by deadline
- Smart workload recommendations
- Never forces rest (user decides)

---

### 2. Knowledge Search
**File**: `02-knowledge-search.md`
**Status**: ✅ Design Complete
**Priority**: P0 (Critical)

Natural language search across Obsidian vault with semantic understanding.

**Key features:**
- Search intent detection ("dulu aku pernah baca tentang...")
- Full-text search (Phase 1) + semantic search (Phase 2)
- Top 3-5 results with relevance scores
- Full note display with related concepts
- Summarize all option (synthesis across multiple notes)
- Related note suggestions

---

### 3. Shift Schedule Integration
**File**: `03-shift-schedule-integration.md`
**Status**: ✅ Design Complete
**Priority**: P0 (Critical for planning)

Daily auto-fetch of shift schedule from Google Sheets.

**Key features:**
- Fetches current month's shift data
- Parses CSV to find user's shifts
- Supports shift codes: 1 (07:00-16:00), 2 (16:00-01:00), 3 (22:00-07:00)
- Special rule for code 2: 14:00-23:00 on specific dates
- Intelligent notifications (only on changes/errors)
- Used by Daily Planning for available time calculation

---

### 4. Article Parser & Knowledge Management
**File**: `04-article-parser.md`
**Status**: ✅ Design Complete
**Priority**: P0 (Critical for knowledge capture)

Parse articles and threads from multiple sources into structured knowledge notes.

**Key features:**
- Supports: Medium, blogs, Twitter/X threads, Threads.com threads
- Partial support: Instagram Reels, TikTok (user assist)
- Extracts full content from articles
- Reconstructs threads with relevant replies
- Asks user why they find it interesting
- Stores original content + user's reason
- Topic-based organization (not source-based)
- Automatic wikilink creation for related concepts

---

## Implementation Roadmap

### Phase 1: Core MVP 1 Features (Week 1-2)
1. **Daily Planning** (most impactful)
   - Fetch task data from Tududi
   - Calculate available time from shift schedule
   - Generate daily plans
   - Handle `/replan` command

2. **Shift Schedule Integration** (enables Daily Planning)
   - Fetch Google Sheets
   - Parse shift data
   - Cache and compare with previous data

3. **Knowledge Search** (completes MVP 1)
   - Implement full-text search
   - Detect search intent vs capture intent
   - Display results with snippets

4. **Article Parser** (knowledge capture enhancement)
   - Parse Medium/blog articles
   - Parse Twitter/Threads threads
   - Determine topic folder
   - Create Obsidian notes

### Phase 2: MVP 2 Features (Week 3-4)
From PRD:
- F-008: AI Time Estimation Learning
- F-009: Burnout Detection
- F-010: Google Calendar Integration

### Phase 3: MVP 3 Features (Week 5-6)
From PRD:
- F-011: Pomodoro Timer Integration
- F-012: Energy-Based Task Filtering
- F-013: Visual Time-Blocking Interface

---

## Design Decisions Made

### Knowledge Organization: Topic-Based, Not Source-Based
- Articles organized in Knowledge/[Topic]/ regardless of source
- Enables multi-topic articles via tags
- Better for cross-topic knowledge connections
- Wikilinks provide semantic linking

### Content Storage: Independent Articles + Wikilinks
- Each article stored separately (Option B from brainstorm)
- Wikilinks connect related content
- NOT auto-synthesizing/merging (lower error risk)
- User can manually synthesize when needed
- Preserves original sources and nuance

### Daily Planning: Task Priority by Deadline (Option B)
- Show all tasks sorted by deadline (due soon first)
- Include smart recommendations on what to actually do
- NOT filtering (user sees everything, decides)
- Never suggests rest (user knows when to rest)

### Shift Integration: CSV Export (Option B)
- Public Google Sheet → CSV export URL
- Simpler than API key
- Will validate during implementation
- Fallback to manual input if needed

---

## Dependencies & Integration Points

```
Daily Planning
├── Depends on: Shift Schedule Integration (available time)
├── Depends on: Tududi API (list tasks)
├── Depends on: Knowledge Search (link related notes)
└── Used by: Chaos Mode (future)

Knowledge Search
├── Depends on: Article Parser (knowledge creation)
└── Depends on: Obsidian vault (knowledge storage)

Shift Schedule Integration
├── Depends on: Google Sheets (shift data source)
└── Used by: Daily Planning (available time calc)

Article Parser
├── Depends on: Knowledge Search (create notes)
├── Depends on: Obsidian file system (storage)
└── Integration: Future synthesis with Time Estimation
```

---

## Testing Strategy

Each design includes:
- Success criteria (must-haves)
- Edge cases (error conditions)
- Fallback behavior (graceful degradation)
- Example data models (for testing)

**When implementing:**
1. Write failing tests first (TDD approach)
2. Implement to pass tests
3. Test edge cases from design
4. Integration test with other features
5. User acceptance testing with real data

---

## Known Unknowns / To Be Determined During Implementation

1. **Wikilink creation algorithm** - Which keywords trigger links? Confidence threshold?
2. **Shift sheet parsing edge cases** - How many retries on network failure?
3. **Article extraction robustness** - How to handle HTML variations across sites?
4. **Search performance at scale** - Full-text search speed with 1000+ notes?
5. **Knowledge synthesis** - How to generate accurate summaries across 5+ notes?

These will be determined and documented during implementation.

---

## Document Versioning

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-24 | Initial design complete for 4 features |

---

## Next Steps

1. ✅ Designs documented (DONE)
2. ⬜ Discuss MVP 2/3 features for prioritization
3. ⬜ Create implementation plan with detailed tasks
4. ⬜ Start implementation (TDD approach)
5. ⬜ Integration testing
6. ⬜ User acceptance testing
