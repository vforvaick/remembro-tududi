/**
 * Shift Schedule Module
 * 
 * Fetches, parses, and manages work shift schedules from Google Sheets.
 * Supports Google Calendar integration for syncing shifts as events.
 */

const ShiftManager = require('./shift-manager');
const GoogleSheetsFetcher = require('./google-sheets-fetcher');
const ShiftParser = require('./shift-parser');
const logger = require('../utils/logger');

/**
 * Initialize shift schedule services
 */
async function initializeShiftSchedule(config) {
  try {
    const manager = new ShiftManager({
      shiftDataPath: config.shiftDataPath || '.cache/shifts.json',
      googleSheetId: config.googleSheetId
    });

    const fetcher = new GoogleSheetsFetcher({
      sheetId: config.googleSheetId,
      userName: config.userName || 'AHMAD FAIQ NAUFAL'
    });

    const parser = new ShiftParser();

    // Optionally fetch initial shift data
    if (config.googleSheetId && config.autoFetch !== false) {
      try {
        logger.info('Initializing shift schedule from Google Sheets...');
        await refreshShiftData({ manager, fetcher, parser });
      } catch (error) {
        logger.warn(`Could not fetch initial shift data: ${error.message}`);
      }
    }

    return { manager, fetcher, parser };
  } catch (error) {
    logger.error(`Failed to initialize shift schedule: ${error.message}`);
    throw error;
  }
}

/**
 * Refresh shift data from Google Sheets
 */
async function refreshShiftData({ manager, fetcher, parser }) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const rawData = await fetcher.fetchAndParseMonth(month, year);
  const parsed = parser.parseMonth(rawData.shifts, month, year);

  await manager.fetchAndCache({
    ...parsed,
    userName: rawData.userName,
    lastUpdated: now.toISOString()
  });

  logger.info(`Shift schedule loaded: ${parsed.monthLabel}`);
  return parsed;
}

/**
 * Get today's shift
 */
async function getTodayShift(manager, parser) {
  const data = await manager.getShiftData();
  if (!data || !data.shifts) return null;

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  return parser.getShiftForDate(data.shifts, dateStr);
}

/**
 * Get this week's shifts
 */
async function getWeekShifts(manager, parser) {
  const data = await manager.getShiftData();
  if (!data || !data.shifts) return [];

  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const startDate = monday.toISOString().split('T')[0];
  const endDate = sunday.toISOString().split('T')[0];

  return parser.getShiftsInRange(data.shifts, startDate, endDate);
}

/**
 * Format today's shift for Telegram display
 */
async function formatTodayShiftMessage(manager, parser) {
  const shift = await getTodayShift(manager, parser);
  const today = new Date();
  const dateStr = today.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  let message = `📅 *Jadwal Shift Hari Ini*\n`;
  message += `${dateStr}\n\n`;

  if (shift) {
    const emoji = parser.getShiftEmoji(shift);
    message += `${emoji} *${shift.label}*\n`;

    if (shift.hasTime) {
      message += `⏰ ${shift.start} - ${shift.end}\n`;
    }

    if (shift.isSpecial) {
      message += `⚡ _Jam khusus (special date)_\n`;
    }
  } else {
    message += `❓ _Tidak ada data shift_`;
  }

  return message;
}

/**
 * Format week's shifts for Telegram display
 */
async function formatWeekShiftMessage(manager, parser) {
  const shifts = await getWeekShifts(manager, parser);

  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  let message = `📅 *Jadwal Shift Minggu Ini*\n\n`;

  const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const shift = shifts.find(s => s.date === dateStr);

    const isToday = dateStr === today.toISOString().split('T')[0];
    const dayLabel = dayNames[i];
    const dayNum = date.getDate();

    let line = `*${dayLabel} ${dayNum}*`;

    if (isToday) {
      line = `➡️ ${line}`;
    }

    if (shift) {
      const emoji = parser.getShiftEmoji(shift);
      line += `: ${emoji} ${shift.label}`;
      if (shift.hasTime) {
        line += ` (${shift.start}-${shift.end})`;
      }
      if (shift.isSpecial) {
        line += ' ⚡';
      }
    } else {
      line += `: ❓ _No data_`;
    }

    message += line + '\n';
  }

  return message;
}

/**
 * Sync shifts to Google Calendar
 * 
 * @param {Object} calendarService - GoogleCalendarService instance
 * @param {Object} manager - ShiftManager instance
 * @param {Object} parser - ShiftParser instance
 * @returns {Object} Sync result with created/skipped counts
 */
async function syncShiftsToCalendar(calendarService, manager, parser) {
  if (!calendarService || !calendarService.isConfigured()) {
    throw new Error('Google Calendar not configured');
  }

  const data = await manager.getShiftData();
  if (!data || !data.shifts) {
    throw new Error('No shift data available');
  }

  const results = { created: 0, skipped: 0, errors: 0 };

  for (const shift of data.shifts) {
    // Only sync shifts that have specific times
    if (!shift.hasTime) {
      results.skipped++;
      continue;
    }

    try {
      const startTime = parseShiftTime(shift.date, shift.start);
      let endTime = parseShiftTime(shift.date, shift.end);

      // Handle overnight shifts (e.g., Shift 3: 22:00-07:00)
      if (endTime <= startTime) {
        endTime.setDate(endTime.getDate() + 1);
      }

      await calendarService.createEvent({
        summary: `[SHIFT] ${shift.label}`,
        startTime,
        endTime,
        description: `Auto-synced from shift schedule.\nCode: ${shift.code}${shift.isSpecial ? '\nSpecial timing active' : ''}`
      });

      results.created++;
    } catch (error) {
      logger.error(`Failed to create calendar event for ${shift.date}: ${error.message}`);
      results.errors++;
    }
  }

  logger.info(`Calendar sync complete: ${results.created} created, ${results.skipped} skipped, ${results.errors} errors`);
  return results;
}

/**
 * Parse shift time string to Date object
 */
function parseShiftTime(dateStr, timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

module.exports = {
  ShiftManager,
  GoogleSheetsFetcher,
  ShiftParser,
  initializeShiftSchedule,
  refreshShiftData,
  getTodayShift,
  getWeekShifts,
  formatTodayShiftMessage,
  formatWeekShiftMessage,
  syncShiftsToCalendar
};
