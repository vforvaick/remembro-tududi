/**
 * Shift Parser
 * 
 * Parses shift codes and determines timing based on date-specific rules.
 */

/**
 * Shift code definitions with type and timing
 */
const SHIFT_DEFINITIONS = {
  '0': { type: 'normal', label: 'Masuk Normal', start: '08:00', end: '17:00', hasTime: true },
  '1': { type: 'shift', label: 'Shift 1', start: '07:00', end: '16:00', hasTime: true },
  '2': { type: 'shift', label: 'Shift 2', start: '16:00', end: '01:00', hasTime: true },
  '3': { type: 'shift', label: 'Shift 3', start: '22:00', end: '07:00', hasTime: true },
  'IS': { type: 'leave', label: 'Izin Sakit', start: null, end: null, hasTime: false },
  'Lib': { type: 'off', label: 'Libur', start: null, end: null, hasTime: false },
  'LIB': { type: 'off', label: 'Libur', start: null, end: null, hasTime: false },
  'PJ': { type: 'travel', label: 'Perjalanan Dinas', start: null, end: null, hasTime: false },
  'CT': { type: 'leave', label: 'Cuti', start: null, end: null, hasTime: false },
  'BL': { type: 'leave', label: 'Block Leave', start: null, end: null, hasTime: false },
  'T': { type: 'training', label: 'Training', start: null, end: null, hasTime: false },
  'TR': { type: 'training', label: 'Training', start: null, end: null, hasTime: false }
};

/**
 * Shift 2 special timing (14:00-23:00 instead of 16:00-01:00)
 */
const SHIFT_2_SPECIAL = {
  start: '14:00',
  end: '23:00'
};

class ShiftParser {
  constructor() {
    this.shiftDefinitions = SHIFT_DEFINITIONS;
  }

  /**
   * Get the last day of a month
   */
  getLastDayOfMonth(year, month) {
    return new Date(year, month, 0).getDate();
  }

  /**
   * Check if a date is a Shift 2 special date
   * Special dates: tanggal 1, 2, 24, and 2 days before tanggal 1
   * 
   * @param {number} day - Day of month
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {boolean}
   */
  isShift2SpecialDate(day, month, year) {
    // Tanggal 1, 2, or 24 of the month
    if (day === 1 || day === 2 || day === 24) {
      return true;
    }

    // 2 days before tanggal 1 (last 2 days of the month)
    const lastDay = this.getLastDayOfMonth(year, month);
    if (day === lastDay || day === lastDay - 1) {
      return true;
    }

    return false;
  }

  /**
   * Get shift timing for a specific code and date
   * 
   * @param {string} code - Shift code (1, 2, 3, Lib, IS, etc.)
   * @param {number} day - Day of month
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Object} Shift details with timing
   */
  getShiftDetails(code, day, month, year) {
    // Normalize code (handle case variations)
    const normalizedCode = code.toString().trim();
    const definition = this.shiftDefinitions[normalizedCode] ||
      this.shiftDefinitions[normalizedCode.toUpperCase()];

    if (!definition) {
      return {
        code: normalizedCode,
        type: 'unknown',
        label: normalizedCode,
        start: null,
        end: null,
        hasTime: false,
        isSpecial: false
      };
    }

    // Check for Shift 2 special timing
    if (normalizedCode === '2' && this.isShift2SpecialDate(day, month, year)) {
      return {
        code: '2',
        type: 'shift',
        label: 'Shift 2 (Special)',
        start: SHIFT_2_SPECIAL.start,
        end: SHIFT_2_SPECIAL.end,
        hasTime: true,
        isSpecial: true
      };
    }

    return {
      code: normalizedCode,
      ...definition,
      isSpecial: false
    };
  }

  /**
   * Parse raw shifts into structured data with dates
   * 
   * @param {Array} rawShifts - Array of {day, code} objects
   * @param {number} month - Month (1-12)
   * @param {number} year - Year
   * @returns {Object} Parsed shift data
   */
  parseMonth(rawShifts, month, year) {
    const shifts = [];

    for (const raw of rawShifts) {
      const day = parseInt(raw.day);
      const code = raw.code;

      // Skip empty or invalid entries
      if (!code || code === '' || isNaN(day)) {
        continue;
      }

      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const details = this.getShiftDetails(code, day, month, year);

      shifts.push({
        date: dateStr,
        day,
        ...details
      });
    }

    // Sort by day
    shifts.sort((a, b) => a.day - b.day);

    return {
      month,
      year,
      monthLabel: this.getMonthLabel(month, year),
      totalDays: this.getLastDayOfMonth(year, month),
      shifts
    };
  }

  /**
   * Get formatted month label
   */
  getMonthLabel(month, year) {
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${monthNames[month - 1]} ${year}`;
  }

  /**
   * Get shift for a specific date string
   * 
   * @param {Array} shifts - Array of parsed shifts
   * @param {string} dateStr - Date string (YYYY-MM-DD)
   * @returns {Object|null} Shift details or null
   */
  getShiftForDate(shifts, dateStr) {
    return shifts.find(s => s.date === dateStr) || null;
  }

  /**
   * Get shifts for a date range
   * 
   * @param {Array} shifts - Array of parsed shifts
   * @param {string} startDate - Start date string (YYYY-MM-DD)
   * @param {string} endDate - End date string (YYYY-MM-DD)
   * @returns {Array} Filtered shifts
   */
  getShiftsInRange(shifts, startDate, endDate) {
    return shifts.filter(s => s.date >= startDate && s.date <= endDate);
  }

  /**
   * Get all working days (shifts that have time)
   */
  getWorkingDays(shifts) {
    return shifts.filter(s => s.hasTime);
  }

  /**
   * Get all off days (Libur, Cuti, etc.)
   */
  getOffDays(shifts) {
    return shifts.filter(s => s.type === 'off' || s.type === 'leave');
  }

  /**
   * Format shift for display
   */
  formatShift(shift) {
    if (!shift) return 'Tidak ada data';

    let text = `${shift.label}`;
    if (shift.hasTime) {
      text += ` (${shift.start} - ${shift.end})`;
    }
    if (shift.isSpecial) {
      text += ' ⚡';
    }
    return text;
  }

  /**
   * Get emoji for shift type
   */
  getShiftEmoji(shift) {
    if (!shift) return '❓';

    const emojiMap = {
      'shift': '🔧',
      'normal': '💼',
      'off': '🏖️',
      'leave': '🏥',
      'travel': '✈️',
      'training': '📚',
      'unknown': '❓'
    };

    return emojiMap[shift.type] || '❓';
  }
}

module.exports = ShiftParser;
