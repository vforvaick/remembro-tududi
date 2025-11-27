const GoogleSheetsFetcher = require('../../src/shift-schedule/google-sheets-fetcher');
const axios = require('axios');

jest.mock('axios');

describe('GoogleSheetsFetcher', () => {
  let fetcher;

  beforeEach(() => {
    fetcher = new GoogleSheetsFetcher({
      sheetId: '1aSEY7ZxZvmEFU4IaUdjNVrqd4j8LdKDoT8x7LT-HrIs'
    });
  });

  test('should construct CSV export URL correctly', () => {
    const url = fetcher.getExportUrl();
    expect(url).toContain('docs.google.com/spreadsheets');
    expect(url).toContain('export');
    expect(url).toContain('format=csv');
  });

  test('should fetch CSV from Google Sheets', async () => {
    const csvContent = `,,,,Faiq,1,2,3
,,,,Faiq,2,3,1`;

    axios.get.mockResolvedValue({ data: csvContent });

    const data = await fetcher.fetchCSV();
    expect(data).toContain('Faiq');
    expect(axios.get).toHaveBeenCalled();
  });

  test('should handle fetch errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));

    try {
      await fetcher.fetchCSV();
      fail('Should throw error');
    } catch (error) {
      expect(error.message).toContain('Network error');
    }
  });

  test('should parse CSV with user shifts', async () => {
    const csvContent = `,,,,Faiq,1,2,3,,,`;
    axios.get.mockResolvedValue({ data: csvContent });

    const shifts = await fetcher.fetchAndParse('2025-11-26');
    expect(shifts).toHaveLength(3);
    expect(shifts[0].day).toBe(1);
    expect(shifts[0].code).toBe('1');
  });
});
