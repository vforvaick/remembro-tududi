const ShiftParser = require('../../src/shift-schedule/shift-parser');

describe('ShiftParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ShiftParser();
  });

  test('should map shift code 1 to 07:00-16:00', () => {
    const shift = parser.getShiftTiming('1', '2025-11-26');
    expect(shift.timeStart).toBe('07:00');
    expect(shift.timeEnd).toBe('16:00');
  });

  test('should map shift code 2 to 16:00-01:00', () => {
    const shift = parser.getShiftTiming('2', '2025-11-26');
    expect(shift.timeStart).toBe('16:00');
    expect(shift.timeEnd).toBe('01:00');
  });

  test('should map shift code 3 to 22:00-07:00', () => {
    const shift = parser.getShiftTiming('3', '2025-11-26');
    expect(shift.timeStart).toBe('22:00');
    expect(shift.timeEnd).toBe('07:00');
  });

  test('should apply special rule for code 2 on day 2 of month', () => {
    // Day 2 of month should be 14:00-23:00 for code 2
    const shift = parser.getShiftTiming('2', '2025-11-02');
    expect(shift.timeStart).toBe('14:00');
    expect(shift.timeEnd).toBe('23:00');
    expect(shift.isSpecial).toBe(true);
  });

  test('should apply special rule for code 2 on 24th of month', () => {
    const shift = parser.getShiftTiming('2', '2025-11-24');
    expect(shift.timeStart).toBe('14:00');
    expect(shift.timeEnd).toBe('23:00');
  });

  test('should parse full month shift data', () => {
    const rawShifts = [
      { day: 1, code: '1' },
      { day: 2, code: '2' },
      { day: 3, code: '3' }
    ];

    const parsed = parser.parseMonth('NOV', 2025, rawShifts);
    expect(parsed.month).toBe('NOV 2025');
    expect(parsed.shifts.length).toBe(3);
    expect(parsed.shifts[0].code).toBe('1');
    expect(parsed.shifts[1].timeStart).toBe('14:00');
  });

  test('should handle missing shifts', () => {
    const rawShifts = [
      { day: 1, code: '1' },
      // Day 2 missing
      { day: 3, code: '3' }
    ];

    const parsed = parser.parseMonth('NOV', 2025, rawShifts);
    expect(parsed.shifts.length).toBe(2);
  });
});
