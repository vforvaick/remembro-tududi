const ShiftManager = require('../../src/shift-schedule/shift-manager');

describe('ShiftManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ShiftManager({
      shiftDataPath: '/tmp/test-shifts.json',
      googleSheetId: 'test-sheet-id'
    });
  });

  test('should initialize with empty shift data', async () => {
    const shifts = await manager.getShiftData();
    expect(shifts).toEqual({});
  });

  test('should cache shift data after fetch', async () => {
    const testData = {
      month: 'NOV 2025',
      shifts: [
        {
          date: '2025-11-26',
          code: '2',
          timeStart: '16:00',
          timeEnd: '01:00'
        }
      ]
    };

    await manager.fetchAndCache(testData);
    const cached = await manager.getShiftData();
    expect(cached.month).toBe('NOV 2025');
    expect(cached.shifts.length).toBe(1);
  });

  test('should get shift for specific date', async () => {
    const testData = {
      month: 'NOV 2025',
      shifts: [
        {
          date: '2025-11-26',
          code: '2',
          timeStart: '16:00',
          timeEnd: '01:00'
        }
      ]
    };

    await manager.fetchAndCache(testData);
    const shift = await manager.getShiftForDate('2025-11-26');
    expect(shift.code).toBe('2');
    expect(shift.timeStart).toBe('16:00');
  });

  test('should detect schedule changes', async () => {
    const oldData = {
      month: 'NOV 2025',
      shifts: [{ date: '2025-11-26', code: '1', timeStart: '07:00', timeEnd: '16:00' }]
    };
    const newData = {
      month: 'NOV 2025',
      shifts: [{ date: '2025-11-26', code: '2', timeStart: '16:00', timeEnd: '01:00' }]
    };

    await manager.fetchAndCache(oldData);
    const changes = await manager.detectChanges(newData);
    expect(changes.length).toBeGreaterThan(0);
    expect(changes[0].date).toBe('2025-11-26');
  });
});
