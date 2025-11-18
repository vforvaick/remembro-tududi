# User Guide

## Quick Start

Your AI task assistant lives in Telegram. Just send messages and it handles the rest!

## Basic Usage

### Creating Tasks

Just send a natural message:

```
beli susu anak
```

The bot will:
1. Parse your message with AI
2. Create task in Tududi
3. Add to Obsidian daily note
4. Send confirmation

### Voice Messages

Tap microphone in Telegram and speak:

```
"besok meeting with client jam 2 siang"
```

Transcribed and processed automatically (Indonesian supported!)

### Multiple Tasks

Send multiple tasks in one message:

```
beli susu anak, ultah mama tanggal 25, meeting next Monday
```

All extracted and created separately.

### Natural Language Dates

- "besok" / "tomorrow" → next day
- "lusa" → day after tomorrow
- "next Monday" → upcoming Monday
- "tanggal 25" → 25th of this/next month
- "minggu depan" → next week

## Daily Planning

Get AI to plan your day:

```
/plan
```

Bot will:
1. Fetch your incomplete tasks
2. Analyze deadlines and priorities
3. Generate time-blocked schedule
4. Account for your energy levels
5. Leave buffer time for chaos

Example response:

```
📅 Daily Plan

Focus on urgent deadlines today

⏱️ Available: 360m | Planned: 240m | Buffer: 120m

Priority Tasks (3):

1. Review client proposal
   ⏰ 9:00-11:00 (120m) ⚡HIGH
   💡 Due today, requires deep focus

2. Quick grocery run
   ⏰ 11:30-11:45 (15m) ⚡LOW
   💡 Quick win before shift

3. Email follow-ups
   ⏰ 12:00-12:30 (30m) ⚡MEDIUM
```

## Chaos Mode

When work gets hectic:

```
/chaos
```

Bot activates chaos mode:
- Shows only quick (<15m) and urgent tasks
- Hides deep work
- Simplified view

When things calm down:

```
/normal
```

Bot asks how much time you have, then re-plans automatically.

## Knowledge Capture

Send insights and they're saved as notes:

```
bitcoin dips before US open, rebounds in Asia session, best entry 30 min after open
```

Bot detects this is knowledge (not a task) and:
1. Creates structured note in Obsidian
2. Categorizes under Trading/Crypto
3. Adds searchable tags
4. Links related concepts

If knowledge is actionable:

```
bitcoin strategy idea - test 30min entry timing
```

Bot creates both:
- Knowledge note with strategy
- Task "Test Bitcoin 30-min strategy"

## Obsidian Integration

### Tasks in Daily Notes

Every task appears in your Obsidian daily note:

```markdown
## 2025-11-18

### Tasks
- [ ] Beli susu anak (due: 2025-11-18) ⏱️15m ⚡LOW #shopping [[Tududi-123]]
```

Check the box in Obsidian → syncs to Tududi automatically!

### Knowledge Notes

Saved under `Knowledge/[Category]/`:

```
Knowledge/
  Trading/
    bitcoin-market-timing-2025-11-18.md
  Health/
    sleep-optimization-tips-2025-11-15.md
```

### Searching

Ask bot to search your notes:

```
dulu aku pernah baca tentang bitcoin timing
```

Bot performs semantic search and returns relevant notes with excerpts.

## Commands Reference

- `/start` - Welcome message
- `/help` - Show help
- `/plan` - Generate daily plan
- `/chaos` - Enable chaos mode
- `/normal` - Disable chaos mode
- `/status` - System status

## Tips for ADHD Users

**Capture immediately:**
- Don't wait to "clean up" your message
- Send messy thoughts, AI will structure them
- Use voice when walking/commuting

**Trust the system:**
- Let AI decide what to do today
- Don't second-guess the plan
- Follow time blocks without re-planning

**Review weekly:**
- Check what tasks you're skipping (patterns)
- Adjust time estimates over time
- Celebrate completed tasks!

**Use spouse requests tag:**
- Mention "istri" → auto-tagged for priority
- Never forget important requests
- Track completion separately

## Advanced Features

### Energy-Based Filtering

Tasks tagged with energy levels:
- HIGH: Analytical work, planning, coding
- MEDIUM: Meetings, emails, admin
- LOW: Errands, simple tasks

Plan respects energy patterns:
- Morning: HIGH energy tasks
- Afternoon: MEDIUM tasks
- Evening: LOW energy tasks

### Recurring Tasks

Annual reminders:

```
ultah mama tanggal 25 November
```

Bot creates:
- Recurring yearly reminder
- Multi-stage notifications (1 week, 3 days, day-of)
- Action suggestions ("Buy gift", "Call")

### Time Estimation Learning

Bot learns from your history:
- "Writing blog post" took 90 minutes last time
- Next estimate: 90 minutes (not generic 60)
- Improves planning accuracy over time

## Troubleshooting

**Task not created:**
- Check Tududi API connection (`/status`)
- Review logs: `logs/error.log`
- Try simpler message format

**Voice transcription wrong:**
- Speak clearly and slowly
- Use Indonesian or English (no mixing mid-sentence)
- Retry or send text version

**Obsidian sync delayed:**
- Sync happens within 5 minutes (not instant)
- Check vault path is correct
- Restart file watcher if needed

**Getting "too many tasks" warning:**
- You're overcommitted
- Let bot reschedule some for tomorrow
- Focus on top 3 priorities only
