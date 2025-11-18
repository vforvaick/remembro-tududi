const DailyPlanner = require('../../src/llm/daily-planner');

describe('DailyPlanner', () => {
  let planner;
  let mockClaudeClient;
  let mockTududuClient;

  beforeEach(() => {
    mockClaudeClient = {
      parseJSON: jest.fn()
    };
    mockTududuClient = {
      getTasks: jest.fn()
    };
    planner = new DailyPlanner(mockClaudeClient, mockTududuClient);
  });

  test('generates daily plan', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1', due_date: '2025-11-18', time_estimate: 60, energy_level: 'HIGH' },
      { id: 2, title: 'Task 2', due_date: '2025-11-19', time_estimate: 30, energy_level: 'LOW' }
    ];

    mockTududuClient.getTasks.mockResolvedValue(mockTasks);

    mockClaudeClient.parseJSON.mockResolvedValue({
      summary: 'Focus on urgent tasks',
      available_time: 360,
      planned_time: 240,
      buffer_time: 120,
      priority_tasks: [
        {
          task_id: 1,
          title: 'Task 1',
          time_slot: '9:00-10:00',
          duration: 60,
          energy: 'HIGH'
        }
      ],
      skipped_tasks: [
        {
          task_id: 2,
          title: 'Task 2',
          reason: 'Low priority, moved to tomorrow'
        }
      ]
    });

    const plan = await planner.generatePlan({
      available_hours: 6,
      shift_start: '14:00',
      shift_end: '22:00'
    });

    expect(plan.priority_tasks).toHaveLength(1);
    expect(plan.planned_time).toBeLessThanOrEqual(plan.available_time);
  });

  test('warns about overcommitment', async () => {
    const mockTasks = Array(20).fill(null).map((_, i) => ({
      id: i,
      title: `Task ${i}`,
      due_date: '2025-11-18',
      time_estimate: 60,
      energy_level: 'MEDIUM'
    }));

    mockTududuClient.getTasks.mockResolvedValue(mockTasks);

    mockClaudeClient.parseJSON.mockResolvedValue({
      summary: 'Too many tasks',
      available_time: 180,
      planned_time: 180,
      buffer_time: 0,
      priority_tasks: [],
      warnings: ['Overcommitted by 10 hours - need to reschedule']
    });

    const plan = await planner.generatePlan({ available_hours: 3 });

    expect(plan.warnings).toEqual(expect.arrayContaining([expect.stringContaining('Overcommitted')]));
  });
});
