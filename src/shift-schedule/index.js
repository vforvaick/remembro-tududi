const ShiftManager = require('./shift-manager');
const GoogleSheetsFetcher = require('./google-sheets-fetcher');
const ShiftParser = require('./shift-parser');
const logger = require('../utils/logger');

async function initializeShiftSchedule(config) {
  try {
    const manager = new ShiftManager({
      shiftDataPath: config.shiftDataPath || '.cache/shifts.json',
      googleSheetId: config.googleSheetId
    });

    const fetcher = new GoogleSheetsFetcher({
      sheetId: config.googleSheetId
    });

    const parser = new ShiftParser();

    // Optionally fetch initial shift data if googleSheetId is provided
    if (config.googleSheetId && config.autoFetch !== false) {
      try {
        logger.info('Initializing shift schedule from Google Sheets...');
        const rawShifts = await fetcher.fetchAndParse(new Date().toISOString().split('T')[0]);
        const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
        const currentYear = new Date().getFullYear();
        const parsed = parser.parseMonth(currentMonth, currentYear, rawShifts);
        await manager.fetchAndCache(parsed);
        logger.info(`Shift schedule loaded: ${parsed.month}`);
      } catch (error) {
        logger.warn(`Could not fetch initial shift data: ${error.message}`);
      }
    }

    return { manager, fetcher, parser };
  } catch (error) {
    logger.error(`Failed to initialize shift schedule: ${error.message}`);
    throw error;
  }
}

module.exports = {
  ShiftManager,
  GoogleSheetsFetcher,
  ShiftParser,
  initializeShiftSchedule
};
