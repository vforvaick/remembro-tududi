const DailyPlanner = require('../../src/llm/daily-planner');

describe('DailyPlanner with Shift Schedule', () => {
  let planner;

  beforeEach(() => {
    planner = new DailyPlanner({
      llmProvider: {
        sendMessage: jest.fn()
      }
    });
  });

  test('should calculate available time before shift', () => {
    const shift = {
      code: '2',
      timeStart: '16:00',
      timeEnd: '01:00'
    };

    const available = planner.calculateAvailableTime(shift);
    expect(available.start).toBe('07:00');
    expect(available.end).toBe('16:00');
    expect(available.totalMinutes).toBe(540); // 9 hours
  });

  test('should respect shift time in planning', () => {
    const tasks = [
      { id: '1', title: 'Task 1', estimatedMinutes: 30, energyLevel: 'HIGH', name: 'Task 1' },
      { id: '2', title: 'Task 2', estimatedMinutes: 60, energyLevel: 'MEDIUM', name: 'Task 2' }
    ];

    const shift = {
      code: '2',
      timeStart: '16:00',
      timeEnd: '01:00'
    };

    const plan = planner.generatePlanWithShift(tasks, shift);
    expect(plan.availableTime).toBeDefined();
    expect(plan.blockedTime.start).toBe('16:00');
  });

  test('should warn if tasks exceed available time', () => {
    const tasks = [
      { id: '1', title: 'Task 1', estimatedMinutes: 500, energyLevel: 'HIGH', name: 'Task 1' },
      { id: '2', title: 'Task 2', estimatedMinutes: 100, energyLevel: 'MEDIUM', name: 'Task 2' }
    ];

    const shift = {
      code: '2',
      timeStart: '16:00',
      timeEnd: '01:00'
    };

    const plan = planner.generatePlanWithShift(tasks, shift);
    expect(plan.workloadPercentage).toBeGreaterThan(100);
    expect(plan.warning).toBeDefined();
  });

  test('should handle shift code 1 (morning shift)', () => {
    const shift = {
      code: '1',
      timeStart: '07:00',
      timeEnd: '16:00'
    };

    const available = planner.calculateAvailableTime(shift);
    // Available from end of shift to bedtime (23:00)
    expect(available.start).toBe('16:00');
    expect(available.end).toBe('23:00');
  });

  test('should handle shift code 3 (night shift)', () => {
    const shift = {
      code: '3',
      timeStart: '22:00',
      timeEnd: '07:00'
    };

    const available = planner.calculateAvailableTime(shift);
    // Available from 07:00 (end of night shift) to 08:00 (bedtime after night shift)
    expect(available.totalMinutes).toBe(1 * 60); // 1 hour (then sleep)
    expect(available.start).toBe('07:00');
    expect(available.end).toBe('08:00');
  });
});
