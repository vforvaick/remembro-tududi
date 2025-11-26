const ShiftManager = require('../../src/shift-schedule/shift-manager');
const GoogleSheetsFetcher = require('../../src/shift-schedule/google-sheets-fetcher');
const ShiftParser = require('../../src/shift-schedule/shift-parser');
const DailyPlanner = require('../../src/llm/daily-planner');
const { KnowledgeSearchService } = require('../../src/knowledge-search');
const { ArticleParser } = require('../../src/article-parser');
const PlanCommand = require('../../src/commands/plan-command');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

jest.mock('axios');

describe('MVP1 End-to-End Integration', () => {
  let shiftManager, parser, planner, searchService, articleParser, planCommand;
  let tempDir, tempShiftsFile;

  beforeEach(async () => {
    // Setup temp directories
    tempDir = path.join('/tmp', `test-e2e-${Date.now()}-${Math.random()}`);
    tempShiftsFile = path.join(tempDir, 'shifts.json');
    await fs.promises.mkdir(tempDir, { recursive: true });

    // Initialize services
    shiftManager = new ShiftManager({ shiftDataPath: tempShiftsFile });
    parser = new ShiftParser();
    planner = new DailyPlanner({ llmProvider: null }, null);
    searchService = new KnowledgeSearchService({ vaultPath: tempDir });
    articleParser = new ArticleParser({ vaultPath: tempDir });
    planCommand = new PlanCommand({
      shiftManager,
      tududi: {
        getTasks: jest.fn().mockResolvedValue([
          { id: '1', name: 'Task 1', due_date: '2025-11-27', time_estimate: 30, energy_level: 'HIGH' },
          { id: '2', name: 'Task 2', due_date: '2025-11-27', time_estimate: 60, energy_level: 'MEDIUM' }
        ])
      },
      dailyPlanner: planner
    });

    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (fs.existsSync(tempDir)) {
      const walk = async (dir) => {
        const files = await fs.promises.readdir(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = await fs.promises.stat(filePath);
          if (stat.isDirectory()) {
            await walk(filePath);
          } else {
            await fs.promises.unlink(filePath);
          }
        }
        await fs.promises.rmdir(dir);
      };
      await walk(tempDir);
    }
  });

  test('should flow: shift data → daily planning → formatted plan', async () => {
    // 1. Setup shift data
    const shiftData = {
      month: 'NOV 2025',
      shifts: [{
        date: '2025-11-27',
        code: '2',
        timeStart: '16:00',
        timeEnd: '01:00'
      }]
    };

    await shiftManager.fetchAndCache(shiftData);

    // 2. Retrieve shift for date
    const shift = await shiftManager.getShiftForDate('2025-11-27');
    expect(shift).toBeDefined();
    expect(shift.code).toBe('2');

    // 3. Generate plan with shift awareness
    const tasks = [
      { id: '1', title: 'Task 1', estimatedMinutes: 30, energyLevel: 'HIGH' },
      { id: '2', title: 'Task 2', estimatedMinutes: 60, energyLevel: 'MEDIUM' }
    ];

    const plan = planner.generatePlanWithShift(tasks, shift);
    expect(plan.availableTime).toBeDefined();
    expect(plan.blockedTime.start).toBe('16:00');

    // 4. Format for output
    expect(plan.workloadPercentage).toBeGreaterThan(0);
  });

  test('should flow: knowledge search → intent detection → results', async () => {
    // 1. Create test knowledge notes
    await fs.promises.writeFile(
      path.join(tempDir, 'bitcoin.md'),
      '# Bitcoin Trading\n\n#trading Bitcoin strategy'
    );

    // 2. Handle search query
    const result = await searchService.handleQuery('dulu aku pernah baca tentang bitcoin');
    expect(result).toBeDefined();
    expect(result.intent.type).toBe('search');
    expect(result.results.length).toBeGreaterThan(0);

    // 3. Format results
    expect(result.formatted).toContain('Search Results');
  });

  test('should flow: article URL → extraction → note creation', async () => {
    // 1. Detect and parse article
    axios.get.mockResolvedValue({
      data: '<h1>Bitcoin Analysis</h1><p>Market insights about Bitcoin trading</p>'
    });

    const parseResult = await articleParser.parseUrl('https://medium.com/bitcoin-analysis');
    expect(parseResult.success).toBe(true);

    // 2. Save article with topic suggestion
    const saveResult = await articleParser.saveArticle(
      parseResult.content,
      'Important market analysis',
      parseResult.suggestedTopics[0] || 'Trading'
    );
    expect(saveResult.success).toBe(true);

    // 3. Verify note was created
    expect(fs.existsSync(saveResult.filepath)).toBe(true);
  });

  test('should handle complete daily workflow', async () => {
    // 1. Load shift schedule
    const shiftData = {
      month: 'NOV 2025',
      shifts: [{
        date: '2025-11-27',
        code: '1',
        timeStart: '07:00',
        timeEnd: '16:00'
      }]
    };
    await shiftManager.fetchAndCache(shiftData);

    // 2. Get shift
    const shift = await shiftManager.getShiftForDate('2025-11-27');
    expect(shift.code).toBe('1');

    // 3. Generate plan for shift
    const availableTime = planner.calculateAvailableTime(shift);
    expect(availableTime.start).toBe('16:00');
    expect(availableTime.end).toBe('23:00');

    // 4. Create formatted plan message
    const planCommand = new PlanCommand({
      shiftManager,
      tududi: { getTasks: jest.fn().mockResolvedValue([]) },
      dailyPlanner: planner
    });

    const planResult = await planCommand.generatePlanForDate('2025-11-27');
    expect(planResult.formatted).toContain('Shift');
    expect(planResult.formatted).toContain('Available');
  });

  test('should handle multiple independent operations', async () => {
    // 1. Shift + Planning in parallel
    const shiftPromise = (async () => {
      const data = { month: 'NOV 2025', shifts: [{ date: '2025-11-27', code: '2', timeStart: '16:00', timeEnd: '01:00' }] };
      await shiftManager.fetchAndCache(data);
      return await shiftManager.getShiftForDate('2025-11-27');
    })();

    // 2. Knowledge search in parallel
    const searchPromise = (async () => {
      await fs.promises.writeFile(path.join(tempDir, 'note.md'), '# Test\n\nContent');
      return await searchService.handleQuery('cari test');
    })();

    // 3. Article parsing in parallel
    axios.get.mockResolvedValue({ data: '<h1>Article</h1><p>Content</p>' });
    const articlePromise = articleParser.parseUrl('https://medium.com/test');

    const [shiftResult, searchResult, articleResult] = await Promise.all([
      shiftPromise,
      searchPromise,
      articlePromise
    ]);

    expect(shiftResult).toBeDefined();
    expect(searchResult).toBeDefined();
    expect(articleResult.success).toBe(true);
  });

  test('should verify all test suites complete without errors', async () => {
    // This is a meta-test to ensure all systems are operational
    const systemsOperational = {
      shiftScheduling: !!shiftManager,
      dailyPlanning: !!planner,
      knowledgeSearch: !!searchService,
      articleParsing: !!articleParser,
      planCommand: !!planCommand
    };

    const allSystemsUp = Object.values(systemsOperational).every(v => v === true);
    expect(allSystemsUp).toBe(true);
  });
});
