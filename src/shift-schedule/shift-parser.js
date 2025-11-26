class ShiftParser {
  constructor() {
    this.shiftMapping = {
      '1': { start: '07:00', end: '16:00' },
      '2': { start: '16:00', end: '01:00' },
      '2_special': { start: '14:00', end: '23:00' },
      '3': { start: '22:00', end: '07:00' }
    };
  }

  isSpecialShift2Date(date) {
    // date format: 2025-11-26
    const d = new Date(date);
    const dayOfMonth = d.getDate();

    // Day 1, 2, or 24 of month get special treatment for shift 2
    return dayOfMonth === 1 || dayOfMonth === 2 || dayOfMonth === 24;
  }

  getShiftTiming(code, dateStr) {
    if (code === '2' && this.isSpecialShift2Date(dateStr)) {
      return {
        code: '2',
        timeStart: '14:00',
        timeEnd: '23:00',
        isSpecial: true
      };
    }

    const mapping = this.shiftMapping[code];
    if (!mapping) {
      throw new Error(`Unknown shift code: ${code}`);
    }

    return {
      code,
      timeStart: mapping.start,
      timeEnd: mapping.end,
      isSpecial: false
    };
  }

  parseMonth(monthName, year, rawShifts) {
    // Construct date from month name and year to get month number
    const monthDate = new Date(`${monthName} 1, ${year}`);
    const monthNum = monthDate.getMonth() + 1;

    const shifts = [];

    for (const raw of rawShifts) {
      const dateStr = `${year}-${String(monthNum).padStart(2, '0')}-${String(raw.day).padStart(2, '0')}`;

      const timing = this.getShiftTiming(raw.code, dateStr);
      shifts.push({
        date: dateStr,
        day: raw.day,
        code: timing.code,
        timeStart: timing.timeStart,
        timeEnd: timing.timeEnd,
        isSpecial: timing.isSpecial
      });
    }

    return {
      month: `${monthName} ${year}`,
      year,
      monthNumber: monthNum,
      shifts
    };
  }
}

module.exports = ShiftParser;
