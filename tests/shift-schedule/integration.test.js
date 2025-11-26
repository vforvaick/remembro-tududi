const ShiftManager = require('../../src/shift-schedule/shift-manager');
const GoogleSheetsFetcher = require('../../src/shift-schedule/google-sheets-fetcher');
const ShiftParser = require('../../src/shift-schedule/shift-parser');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

jest.mock('axios');

describe('Shift Schedule Integration', () => {
  let manager, fetcher, parser;
  let testFilePath;

  beforeEach(() => {
    testFilePath = path.join('/tmp', `test-shifts-${Date.now()}-${Math.random()}.json`);
    fetcher = new GoogleSheetsFetcher({
      sheetId: 'test-sheet'
    });
    parser = new ShiftParser();
    manager = new ShiftManager({
      shiftDataPath: testFilePath
    });
  });

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  test('should fetch and parse shift data end-to-end', async () => {
    // Mock Google Sheets CSV
    const csvContent = `,,,,Faiq,1,2,3,1,2,3`;
    axios.get.mockResolvedValue({ data: csvContent });

    // Fetch raw data
    const rawShifts = await fetcher.fetchAndParse('2025-11-26');
    expect(rawShifts.length).toBeGreaterThan(0);

    // Parse with special rules
    const parsed = parser.parseMonth('NOV', 2025, rawShifts);
    expect(parsed.shifts.length).toBeGreaterThan(0);

    // Cache in manager
    await manager.fetchAndCache(parsed);

    // Retrieve specific shift
    const shift = await manager.getShiftForDate('2025-11-01');
    expect(shift).toBeDefined();
    expect(shift.code).toBe('1');
  });

  test('should detect shift changes after update', async () => {
    const oldData = {
      month: 'NOV 2025',
      shifts: [{
        date: '2025-11-01',
        code: '1',
        timeStart: '07:00',
        timeEnd: '16:00'
      }]
    };

    const newData = {
      month: 'NOV 2025',
      shifts: [{
        date: '2025-11-01',
        code: '2',
        timeStart: '16:00',
        timeEnd: '01:00'
      }]
    };

    await manager.fetchAndCache(oldData);
    const changes = await manager.detectChanges(newData);
    expect(changes).toHaveLength(1);
    expect(changes[0].date).toBe('2025-11-01');
    expect(changes[0].newShift.code).toBe('2');
  });
});
