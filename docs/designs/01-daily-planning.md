# Daily Planning Feature Design

**Status**: Design Complete (Ready for Implementation)
**Version**: 1.0
**Date**: 2025-11-24

---

## Overview

Automated daily task planning feature that generates intelligent schedules based on available time, task deadlines, and user's shift schedule. Supports three interaction modes: automatic morning digest, manual command, and natural language triggers.

---

## Three Ways to Access Planning

### 1. Auto-trigger at 5 AM
- Bot sends morning plan automatically every day at 5:00 AM
- Shows all pending tasks sorted by deadline (most urgent first)
- Includes workload estimate vs available time based on shift schedule
- Format: Option B (Time-Blocked Schedule)

### 2. Manual Command: `/plan [timeframe]`

**Examples:**
- `/plan hari ini` → Today's plan
- `/plan besok` → Tomorrow's plan
- `/plan minggu depan hari rabu` → Next Wednesday's plan
- `/plan 2025-11-27` → Specific date

**Output:** Tasks sorted by deadline, with time blocks and workload estimate

### 3. Smart Trigger: Natural Language

Bot recognizes planning intent from phrases like:
- "hari ini ngapain aja?"
- "besok ada task apa?"
- "minggu depan hari senin ngapain?"
- "apa schedule hari ini?"

Auto-triggers `/plan [detected-timeframe]` automatically.

---

## Plan Output Format

**Format**: Time-Blocked Schedule (24-hour format, Telegram-friendly)

```
📅 Hari ini (26 Nov):

09:00-09:30 | Beli susu anak ⏱️30m ⚡HIGH
14:00-15:00 | Meeting client ⏱️60m ⚡HIGH
21:00-21:45 | Review notes ⏱️45m ⚡MEDIUM

⏳ Waktu tersisa: 3 jam | Tasks: 3 | Workload: 85%

💡 Recommend: Do urgent tasks, sisa waktu untuk rest/family
```

**Components:**
- Time blocks with task name, duration estimate, energy level
- Available time remaining after scheduled tasks
- Task count for the day
- Workload percentage (tasks estimated time / available time)
- Smart recommendation based on urgency and available time

---

## Task Selection Algorithm

### Which tasks to show?

**Method: Due Soon First (Option B)**
- Prioritize by deadline: overdue > due today > due soon > due later
- Show ALL pending tasks for that day (user decides what to do with them)
- Include task metadata: duration estimate, energy level, priority

### Smart Recommendation

Bot recommends which tasks to focus on based on:
1. **Available time** - Calculated from shift schedule
2. **Urgency** - Overdue and same-day deadlines prioritized
3. **Task type** - Quick tasks vs deep work
4. **Energy level** - Suggest tasks matching available energy

**Recommendation format:**
```
💡 Recommend: Ultah mama prep + Meeting (must do),
              Beli susu anak (quick, sebelum pergi),
              Sisa 4.5 jam: Review bitcoin atau rest/family
```

**No forced rest suggestions** - User decides when to rest.

---

## Adaptive Rescheduling: `/replan`

**Trigger:** User types `/replan` or "im back" when returning from family time or interruption

**Purpose:** Reschedule remaining tasks from current time onwards

**Process:**
1. Detect current time
2. Filter tasks not yet started
3. Recalculate available time from NOW until end of day
4. Regenerate plan for remaining time
5. Show updated recommendations

**Output:**
```
⏰ Current time: 11:30

Sisa hari ini:
11:30-12:00 | Beli susu anak ⏱️30m ⚡LOW
12:00-13:00 | [buffer/rest]
13:00-14:00 | [shift starts at 14:00]

💡 Recommend: Do susu anak, rest 30min sebelum shift
```

**Characteristics:**
- Shows only incomplete tasks
- Respects shift start time (don't schedule tasks during shift)
- Includes buffer time for transitions
- No rest suggestions (user decides)
- Can be used multiple times per day as schedules change

---

## Integration with Shift Schedule

Daily Planning uses shift schedule data (fetched from Google Sheets) to:

1. **Calculate available time**
   - Identify non-shift hours
   - Account for shift start/end times
   - Prevent scheduling tasks during shift

2. **Time recommendations**
   - Suggest best times within available slots
   - Respect energy levels (morning = high energy, evening = low)

3. **Buffer awareness**
   - Include prep time before shift starts
   - Suggest finishing tasks before shift if time-sensitive

**Shift codes reference:**
- Code 1: 07:00-16:00
- Code 2: 16:00-01:00 (or 14:00-23:00 special cases)
- Code 3: 22:00-07:00

---

## Data Model

**Plan Data Structure:**
```javascript
{
  date: "2025-11-26",
  dayName: "hari ini",
  shiftCode: 2,
  shiftTime: "16:00-01:00",
  availableTime: {
    start: "07:00",
    end: "16:00",
    totalMinutes: 540
  },
  tasks: [
    {
      id: "task-123",
      title: "Beli susu anak",
      dueDate: "2025-11-26",
      dueTime: null,
      estimatedMinutes: 30,
      energyLevel: "LOW",
      priority: "HIGH"
    }
  ],
  recommendations: [
    {
      taskIds: ["task-123", "task-456"],
      reason: "must do today before shift"
    }
  ]
}
```

---

## Error Handling

**If shift schedule not available:**
- Assume user has full day available (7am-11pm = 16 hours)
- Show warning: "⚠️ Shift schedule not available, assuming full day"
- User can manually adjust available time: `/plan with 4 hours`

**If no tasks for day:**
- Show message: "✅ No tasks scheduled for [date], rest day!"
- Optional: suggest reviewing next day's workload

**If overcommitted:**
- Show warning: "⚠️ Tasks exceed available time by 2 hours"
- Recommend: move non-urgent tasks to next day
- User can approve suggested reschedules

---

## Success Criteria

- [ ] Daily plan generated in < 5 seconds
- [ ] 5 AM digest sent automatically
- [ ] `/plan` command works with various timeframe formats
- [ ] Smart trigger recognizes planning intent from natural language
- [ ] `/replan` reschedules correctly based on current time
- [ ] Shift schedule integration prevents tasks during shifts
- [ ] Workload calculation accurate (est. time vs available time)
- [ ] Recommendations helpful (user follows them 70%+ of time)
- [ ] No false positives on natural language trigger

---

## Future Enhancements

1. **Time estimation learning** - Remember actual vs estimated time, improve estimates
2. **Burnout detection** - Warn if consistently overcommitted
3. **Energy-based filtering** - Show only tasks matching current energy level
4. **Calendar integration** - Sync with Google Calendar for meetings
5. **Visual time-blocking UI** - Web interface for drag-drop scheduling
