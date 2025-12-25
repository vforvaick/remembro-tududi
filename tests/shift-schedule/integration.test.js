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
      sheetId: 'test-sheet',
      userName: 'AHMAD FAIQ NAUFAL'
    });
    parser = new ShiftParser();
    manager = new ShiftManager({
      shiftDataPath: testFilePath
    });
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  test('should fetch and parse shift data end-to-end', async () => {
    // Mock Google Sheets CSV with proper format
    const csvContent = `Desember,,NOTE,1,2,3,4,5,6
,,,Sen,Sel,Rab,Kam,Jum,Sab
SRO,AHMAD FAIQ NAUFAL,Shift,1,2,3,1,2,3`;

    axios.get.mockResolvedValue({ data: csvContent });

    // Fetch and parse using the new API
    const csv = await fetcher.fetchCSV();
    const rawData = fetcher.parseUserShifts(csv);

    expect(rawData.shifts.length).toBeGreaterThan(0);
    expect(rawData.userName).toBe('AHMAD FAIQ NAUFAL');

    // Parse with special rules (new API: rawShifts, month, year)
    const parsed = parser.parseMonth(rawData.shifts, 11, 2025);
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
      month: 11,
      year: 2025,
      monthLabel: 'November 2025',
      shifts: [{
        date: '2025-11-01',
        day: 1,
        code: '1',
        start: '07:00',
        end: '16:00'
      }]
    };

    const newData = {
      month: 11,
      year: 2025,
      monthLabel: 'November 2025',
      shifts: [{
        date: '2025-11-01',
        day: 1,
        code: '2',
        start: '16:00',
        end: '01:00'
      }]
    };

    await manager.fetchAndCache(oldData);
    const changes = await manager.detectChanges(newData);
    expect(changes).toHaveLength(1);
    expect(changes[0].date).toBe('2025-11-01');
    expect(changes[0].newShift.code).toBe('2');
  });

  test('should handle full fetch and parse flow for current month', async () => {
    // Mock spreadsheet HTML for GID discovery
    const mockHtml = `[1689755739,"DES 2025"]`;

    // Mock CSV response
    const csvContent = `Desember,,NOTE,1,2,3
,,,Sen,Sel,Rab
SRO,AHMAD FAIQ NAUFAL,Shift,IS,3,3`;

    axios.get.mockImplementation((url) => {
      if (url.includes('export')) {
        return Promise.resolve({ data: csvContent });
      }
      return Promise.resolve({ data: mockHtml });
    });

    // Use the wrapped method
    const result = await fetcher.fetchAndParseMonth(12, 2025);

    expect(result.month).toBe(12);
    expect(result.year).toBe(2025);
    expect(result.shifts.length).toBe(3);
  });
});
