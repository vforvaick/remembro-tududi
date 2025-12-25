const ShiftParser = require('../../src/shift-schedule/shift-parser');

describe('ShiftParser', () => {
  let parser;

  beforeEach(() => {
    parser = new ShiftParser();
  });

  describe('getShiftDetails', () => {
    test('should map shift code 1 to 07:00-16:00', () => {
      // getShiftDetails(code, day, month, year)
      const shift = parser.getShiftDetails('1', 26, 11, 2025);
      expect(shift.start).toBe('07:00');
      expect(shift.end).toBe('16:00');
    });

    test('should map shift code 2 to 16:00-01:00 on normal days', () => {
      const shift = parser.getShiftDetails('2', 26, 11, 2025);
      expect(shift.start).toBe('16:00');
      expect(shift.end).toBe('01:00');
      expect(shift.isSpecial).toBe(false);
    });

    test('should map shift code 3 to 22:00-07:00', () => {
      const shift = parser.getShiftDetails('3', 26, 11, 2025);
      expect(shift.start).toBe('22:00');
      expect(shift.end).toBe('07:00');
    });

    test('should apply special rule for code 2 on day 1 of month', () => {
      const shift = parser.getShiftDetails('2', 1, 11, 2025);
      expect(shift.start).toBe('14:00');
      expect(shift.end).toBe('23:00');
      expect(shift.isSpecial).toBe(true);
    });

    test('should apply special rule for code 2 on day 2 of month', () => {
      const shift = parser.getShiftDetails('2', 2, 11, 2025);
      expect(shift.start).toBe('14:00');
      expect(shift.end).toBe('23:00');
      expect(shift.isSpecial).toBe(true);
    });

    test('should apply special rule for code 2 on 24th of month', () => {
      const shift = parser.getShiftDetails('2', 24, 11, 2025);
      expect(shift.start).toBe('14:00');
      expect(shift.end).toBe('23:00');
      expect(shift.isSpecial).toBe(true);
    });

    test('should apply special rule for code 2 on last day of month', () => {
      // November has 30 days
      const shift = parser.getShiftDetails('2', 30, 11, 2025);
      expect(shift.start).toBe('14:00');
      expect(shift.end).toBe('23:00');
      expect(shift.isSpecial).toBe(true);
    });

    test('should apply special rule for code 2 on second to last day', () => {
      // November has 30 days, so 29 is second to last
      const shift = parser.getShiftDetails('2', 29, 11, 2025);
      expect(shift.start).toBe('14:00');
      expect(shift.end).toBe('23:00');
      expect(shift.isSpecial).toBe(true);
    });

    test('should handle Lib (Libur) code', () => {
      const shift = parser.getShiftDetails('Lib', 5, 11, 2025);
      expect(shift.type).toBe('off');
      expect(shift.label).toBe('Libur');
      expect(shift.hasTime).toBe(false);
    });

    test('should handle IS (Izin Sakit) code', () => {
      const shift = parser.getShiftDetails('IS', 5, 11, 2025);
      expect(shift.type).toBe('leave');
      expect(shift.label).toBe('Izin Sakit');
      expect(shift.hasTime).toBe(false);
    });

    test('should handle CT (Cuti) code', () => {
      const shift = parser.getShiftDetails('CT', 5, 11, 2025);
      expect(shift.type).toBe('leave');
      expect(shift.label).toBe('Cuti');
    });

    test('should handle PJ (Perjalanan Dinas) code', () => {
      const shift = parser.getShiftDetails('PJ', 5, 11, 2025);
      expect(shift.type).toBe('travel');
      expect(shift.label).toBe('Perjalanan Dinas');
    });

    test('should handle unknown codes gracefully', () => {
      const shift = parser.getShiftDetails('XYZ', 5, 11, 2025);
      expect(shift.type).toBe('unknown');
      expect(shift.label).toBe('XYZ');
    });
  });

  describe('parseMonth', () => {
    test('should parse full month shift data', () => {
      const rawShifts = [
        { day: 1, code: '1' },
        { day: 2, code: '2' },
        { day: 3, code: '3' }
      ];

      const parsed = parser.parseMonth(rawShifts, 11, 2025);
      expect(parsed.monthLabel).toBe('November 2025');
      expect(parsed.month).toBe(11);
      expect(parsed.year).toBe(2025);
      expect(parsed.shifts.length).toBe(3);
      expect(parsed.shifts[0].code).toBe('1');
      // Day 2 is special for shift 2
      expect(parsed.shifts[1].start).toBe('14:00');
      expect(parsed.shifts[1].isSpecial).toBe(true);
    });

    test('should handle missing shifts', () => {
      const rawShifts = [
        { day: 1, code: '1' },
        // Day 2 missing
        { day: 3, code: '3' }
      ];

      const parsed = parser.parseMonth(rawShifts, 11, 2025);
      expect(parsed.shifts.length).toBe(2);
    });

    test('should filter out empty codes', () => {
      const rawShifts = [
        { day: 1, code: '1' },
        { day: 2, code: '' },
        { day: 3, code: '3' }
      ];

      const parsed = parser.parseMonth(rawShifts, 11, 2025);
      expect(parsed.shifts.length).toBe(2);
    });
  });

  describe('isShift2SpecialDate', () => {
    test('should return true for day 1', () => {
      expect(parser.isShift2SpecialDate(1, 11, 2025)).toBe(true);
    });

    test('should return true for day 2', () => {
      expect(parser.isShift2SpecialDate(2, 11, 2025)).toBe(true);
    });

    test('should return true for day 24', () => {
      expect(parser.isShift2SpecialDate(24, 11, 2025)).toBe(true);
    });

    test('should return true for last day of month', () => {
      // November has 30 days
      expect(parser.isShift2SpecialDate(30, 11, 2025)).toBe(true);
    });

    test('should return true for second to last day', () => {
      expect(parser.isShift2SpecialDate(29, 11, 2025)).toBe(true);
    });

    test('should return false for normal days', () => {
      expect(parser.isShift2SpecialDate(15, 11, 2025)).toBe(false);
      expect(parser.isShift2SpecialDate(10, 11, 2025)).toBe(false);
    });
  });
});
