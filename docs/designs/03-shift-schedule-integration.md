# Shift Schedule Integration Feature Design

**Status**: Design Complete (Ready for Implementation)
**Version**: 1.0
**Date**: 2025-11-24

---

## Overview

Automated daily fetching of shift schedules from Google Sheets. Bot reads user's shift schedule each day from public spreadsheet and uses it to calculate available time for Daily Planning. Provides smart notifications on schedule changes or errors.

---

## Data Source

**Google Spreadsheet:**
- Public link: https://docs.google.com/spreadsheets/d/1aSEY7ZxZvmEFU4IaUdjNVrqd4j8LdKDoT8x7LT-HrIs/edit?usp=sharing
- Anyone with link can view (public)
- Fetch method: CSV export URL

**Sheet Structure:**
- **Sheet naming**: Month + Year (e.g., "DES 2025", "NOV 2025", "SEPT 2025")
- **User identification**: Search row 11, column B for "Faiq"
- **Shift data**: Row 11, columns D onwards (one cell per day)
- **Column range**: D to last day of month (e.g., D:AG for 30-day month)

**Shift Codes:**
- `1` = 07:00-16:00
- `2` = 16:00-01:00 (standard 8-hour evening shift)
- `3` = 22:00-07:00 (night shift)

**Special Rule for Code 2 → 14:00-23:00:**
- Applies 2 days before month start + 1 day after (e.g., dates 29,30,1,2 for 30-day month)
- Applies every 24th of each month
- Bot should auto-detect these dates and adjust time mapping

---

## Fetch Process

### Daily Auto-Fetch

**Trigger:** Once per day, at 4:50 AM (before 5 AM daily planning)

**Steps:**

1. **Determine current month**
   ```
   Today: 2025-11-26
   Current month: NOV 2025
   ```

2. **Generate CSV export URL**
   ```
   https://docs.google.com/spreadsheets/d/1aSEY7ZxZvmEFU4IaUdjNVrqd4j8LdKDoT8x7LT-HrIs/export?format=csv&gid=[SHEET_ID]
   ```

3. **Fetch CSV data**
   - HTTP GET to export URL
   - Parse CSV response
   - Timeout: 10 seconds

4. **Parse CSV**
   ```
   - Find row where column B contains "Faiq"
   - Extract columns D onwards
   - Each cell = shift code for that day (1, 2, or 3)
   - Map columns to dates (D=1st, E=2nd, etc.)
   ```

5. **Apply special rules**
   - For code 2 cells: Check if date qualifies for 14:00-23:00
   - If yes: Override to 14:00-23:00
   - If no: Keep as 16:00-01:00

6. **Compare with cached data**
   - Load previous month's shift data from cache
   - Compare: any changes from last fetch?
   - If changed: Log change details

7. **Store in cache**
   - Update database/file with new shift schedule
   - Timestamp the fetch
   - Keep previous month for comparison

8. **Determine notification status**
   - No changes + no errors → Silent (no notification)
   - Changes detected → Notify user with changes
   - Sheet missing → Notify user, use fallback
   - Parse error → Notify user, use fallback

---

## Notification Rules

### Silent Success
When: Sheet found, parsed successfully, data unchanged

Action: Just update cache, no message to user

### Notify: Schedule Changed
When: New fetch differs from previous month

Message:
```
⚠️ Jadwal shift ada perubahan:

Nov 25: 1 (07:00-16:00) → 2 (16:00-01:00)
Nov 26: 2 (16:00-01:00) → 3 (22:00-07:00)
Nov 24: — (tidak ada shift) → 2 (14:00-23:00)

Jadwal baru sudah di-update untuk planning
```

### Notify: Sheet Not Found
When: Current month sheet doesn't exist

Message:
```
⚠️ Sheet untuk DES 2025 tidak ditemukan

Fallback: Menggunakan jadwal bulan lalu (NOV 2025)
Minta tolong update spreadsheet dengan jadwal December

Planning akan tetap jalan dengan shift pattern sebelumnya
```

### Notify: Parse Error
When: CSV found but can't parse shift data

Message:
```
❌ Error parsing shift schedule untuk NOV 2025

Reason: Tidak bisa menemukan nama "Faiq" di kolom B

Fallback: Menggunakan jadwal cache sebelumnya
Cek spreadsheet kamu, pastikan nama ada di B11
```

---

## Data Model

### Cached Shift Data

```javascript
{
  month: "NOV 2025",
  year: 2025,
  monthNumber: 11,
  fetchedAt: "2025-11-26T04:50:00Z",
  daysInMonth: 30,
  shifts: [
    {
      date: "2025-11-01",
      day: 1,
      code: "2",
      timeStart: "16:00",
      timeEnd: "01:00",
      isSpecial: false
    },
    {
      date: "2025-11-02",
      day: 2,
      code: "2",
      timeStart: "14:00",  // Special case
      timeEnd: "23:00",
      isSpecial: true
    },
    // ... rest of month
  ]
}
```

### Shift Mapping

```javascript
SHIFT_MAPPING = {
  "1": { start: "07:00", end: "16:00" },
  "2": { start: "16:00", end: "01:00" },  // Standard
  "2_special": { start: "14:00", end: "23:00" },  // Special dates
  "3": { start: "22:00", end: "07:00" }
}

// Special dates for code 2 → 14:00-23:00
SPECIAL_SHIFT_2_DATES = {
  dayBeforeMonthStart: true,  // 2 days before 1st
  dayOfMonthStart: true,      // 1 day after 1st
  everyTwentyFourth: true     // 24th of each month
}
```

---

## Integration with Daily Planning

When Daily Planning runs, it:

1. **Fetch current shift from cache**
   ```
   Today: 2025-11-26
   Shift code: 2
   Shift time: 16:00-01:00
   ```

2. **Calculate available time**
   ```
   Available: 07:00-16:00 (before shift)
   Total: 9 hours
   ```

3. **Use in planning**
   - Don't schedule tasks during 16:00-01:00
   - Recommend quick tasks before 16:00
   - Show shift time as blocked in daily plan

4. **For `/replan` command**
   - If user asks at 11:30, show available time until shift (11:30-16:00 = 4.5 hours)
   - Warn if planning extends past shift start

---

## Fallback Behavior

**If current month sheet missing:**
- Use previous month's pattern as template
- Notify user to update spreadsheet
- Continue planning (system doesn't break)

**If multiple consecutive fetch failures:**
- After 3 failures: Switch to manual mode
- Bot asks: "What's your shift today?"
- User can manually input shift for the day
- Resume auto-fetch next day

---

## Success Criteria

- [ ] Fetches Google Sheets CSV successfully
- [ ] Parses shift data correctly for entire month
- [ ] Detects "Faiq" in column B row 11
- [ ] Maps columns to dates correctly (handles leap years)
- [ ] Applies special shift 2 rules (14:00-23:00) correctly
- [ ] Detects schedule changes from previous month
- [ ] Notifies user only when necessary (not every day if unchanged)
- [ ] Handles missing sheets with graceful fallback
- [ ] Handles parse errors without crashing
- [ ] Caches data for performance (no fetch twice per day)
- [ ] Integrates correctly with Daily Planning

---

## Edge Cases

1. **Leap year February** - Handle 29 days correctly
2. **Sheet renamed** - Bot can't find it, uses fallback
3. **User's name changes** - Bot needs to search for "Faiq" substring
4. **Missing days** - Empty cells in shift row, bot treats as no shift
5. **Multiple month sheets** - Bot finds current month only
6. **Sheet is private** - Can't fetch, notify user

---

## Future Enhancements

1. **Multi-month prefetch** - Fetch next month's schedule early
2. **Shift pattern learning** - Detect recurring patterns, predict future
3. **Shift sync to calendar** - Export shifts to Google Calendar
4. **Manual shift input** - User can override for specific days
5. **Team schedule view** - If spreadsheet has multiple team members
