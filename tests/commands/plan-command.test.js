const PlanCommand = require('../../src/commands/plan-command');

describe('Plan Command Handler', () => {
  let handler;

  beforeEach(() => {
    handler = new PlanCommand({
      shiftManager: {
        getShiftForDate: jest.fn()
      },
      tududi: {
        getTasks: jest.fn()
      },
      dailyPlanner: {
        generatePlanWithShift: jest.fn()
      }
    });
  });

  test('should parse /plan hari ini correctly', () => {
    const parsed = handler.parseTimeframe('/plan hari ini');
    expect(parsed).toEqual('today');
  });

  test('should parse /plan besok correctly', () => {
    const parsed = handler.parseTimeframe('/plan besok');
    expect(parsed).toEqual('tomorrow');
  });

  test('should parse /plan YYYY-MM-DD correctly', () => {
    const parsed = handler.parseTimeframe('/plan 2025-11-27');
    expect(parsed).toEqual('2025-11-27');
  });

  test('should generate plan for specific date', async () => {
    handler.shiftManager.getShiftForDate.mockResolvedValue({
      code: '2',
      timeStart: '16:00',
      timeEnd: '01:00'
    });

    handler.tududi.getTasks.mockResolvedValue([
      { id: '1', name: 'Task 1', time_estimate: 30, energy_level: 'HIGH' }
    ]);

    handler.dailyPlanner.generatePlanWithShift.mockReturnValue({
      blocks: [],
      workloadPercentage: 50,
      availableTime: { totalMinutes: 540, start: '07:00', end: '16:00' }
    });

    const result = await handler.generatePlanForDate('2025-11-27');
    expect(result).toBeDefined();
    expect(result.plan).toBeDefined();
    expect(result.plan.blocks).toBeDefined();
  });

  test('should format plan message with shift', async () => {
    const dateStr = '2025-11-27';
    const shift = { code: '2', timeStart: '16:00', timeEnd: '01:00' };
    const plan = {
      blocks: [{ startTime: '07:00', endTime: '07:30', title: 'Task 1', estimatedMinutes: 30 }],
      workloadPercentage: 50,
      availableTime: { start: '07:00', end: '16:00', totalMinutes: 540 }
    };

    const formatted = handler._formatPlanMessage(dateStr, shift, plan, []);
    expect(formatted).toContain('Task 1');
    expect(formatted).toContain('50%');
    expect(formatted).toContain('16:00-01:00');
  });

  test('should handle missing shift gracefully', async () => {
    handler.tudubi = null;
    handler.shiftManager = null;

    handler.tududi.getTasks.mockResolvedValue([
      { id: '1', name: 'Task 1', time_estimate: 30 }
    ]);

    const result = await handler.generatePlanForDate('2025-11-27');
    expect(result.shift).toBeNull();
    expect(result.formatted).toContain('No shift info');
  });
});
