const GoogleSheetsFetcher = require('../../src/shift-schedule/google-sheets-fetcher');
const axios = require('axios');

jest.mock('axios');

describe('GoogleSheetsFetcher', () => {
  let fetcher;

  beforeEach(() => {
    fetcher = new GoogleSheetsFetcher({
      sheetId: '1aSEY7ZxZvmEFU4IaUdjNVrqd4j8LdKDoT8x7LT-HrIs',
      userName: 'AHMAD FAIQ NAUFAL'
    });
    jest.clearAllMocks();
  });

  describe('URL construction', () => {
    test('should construct CSV export URL correctly', () => {
      const url = fetcher.getExportUrl();
      expect(url).toContain('docs.google.com/spreadsheets');
      expect(url).toContain('export');
      expect(url).toContain('format=csv');
      expect(url).toContain('1aSEY7ZxZvmEFU4IaUdjNVrqd4j8LdKDoT8x7LT-HrIs');
    });

    test('should include GID in export URL', () => {
      const url = fetcher.getExportUrl(123456);
      expect(url).toContain('gid=123456');
    });
  });

  describe('fetchCSV', () => {
    test('should fetch CSV from Google Sheets', async () => {
      const csvContent = `Desember,,NOTE,1,2,3
,,,Sen,Sel,Rab
SRO,AHMAD FAIQ NAUFAL,Shift,1,2,3`;

      axios.get.mockResolvedValue({ data: csvContent });

      const data = await fetcher.fetchCSV();
      expect(data).toContain('AHMAD FAIQ NAUFAL');
      expect(axios.get).toHaveBeenCalled();
    });

    test('should handle fetch errors gracefully', async () => {
      axios.get.mockRejectedValue(new Error('Network error'));

      await expect(fetcher.fetchCSV()).rejects.toThrow('Network error');
    });
  });

  describe('parseUserShifts', () => {
    test('should parse CSV and extract user shifts', () => {
      const csvContent = `Desember,,NOTE,1,2,3,4,5
,,,Sen,Sel,Rab,Kam,Jum
SRO,AHMAD FAIQ NAUFAL,Shift,1,2,3,Lib,IS`;

      const result = fetcher.parseUserShifts(csvContent);

      expect(result.userName).toBe('AHMAD FAIQ NAUFAL');
      expect(result.shifts).toHaveLength(5);
      expect(result.shifts[0]).toEqual({ day: 1, code: '1' });
      expect(result.shifts[1]).toEqual({ day: 2, code: '2' });
      expect(result.shifts[3]).toEqual({ day: 4, code: 'Lib' });
    });

    test('should throw error if user not found', () => {
      const csvContent = `Desember,,NOTE,1,2
,,,Sen,Sel
SRO,OTHER USER,Shift,1,2`;

      expect(() => fetcher.parseUserShifts(csvContent)).toThrow('Could not find user');
    });
  });

  describe('getMonthSheetNames', () => {
    test('should return Indonesian month names', () => {
      const names = fetcher.getMonthSheetNames(12, 2025);
      expect(names).toContain('DES 2025');
      expect(names).toContain('DEC 2025');
    });

    test('should return multiple variations for some months', () => {
      const names = fetcher.getMonthSheetNames(9, 2025);
      expect(names).toContain('SEP 2025');
      expect(names).toContain('SEPT 2025');
    });
  });

  describe('discoverSheetGids', () => {
    test('should parse GIDs from HTML response', async () => {
      const mockHtml = `
        some content [1689755739,"DES 2025"] more content
        [253144821,"JAN 2026"] other stuff
      `;

      axios.get.mockResolvedValue({ data: mockHtml });

      const gidMap = await fetcher.discoverSheetGids();

      expect(gidMap['DES 2025']).toBe(1689755739);
      expect(gidMap['JAN 2026']).toBe(253144821);
    });

    test('should use fallback on error', async () => {
      axios.get.mockRejectedValue(new Error('Failed'));

      const gidMap = await fetcher.discoverSheetGids();

      // Should return fallback map
      expect(gidMap['DES 2025']).toBe(1689755739);
    });

    test('should cache GID results', async () => {
      const mockHtml = `[1689755739,"DES 2025"]`;
      axios.get.mockResolvedValue({ data: mockHtml });

      await fetcher.discoverSheetGids();
      await fetcher.discoverSheetGids();

      // Should only call once due to caching
      expect(axios.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('getGidForMonth', () => {
    test('should find GID for month', async () => {
      fetcher.gidCache = { 'DES 2025': 1689755739 };
      fetcher.gidCacheTime = Date.now();

      const gid = await fetcher.getGidForMonth(12, 2025);
      expect(gid).toBe(1689755739);
    });

    test('should return null for unknown month', async () => {
      fetcher.gidCache = { 'DES 2025': 1689755739 };
      fetcher.gidCacheTime = Date.now();

      const gid = await fetcher.getGidForMonth(6, 2030);
      expect(gid).toBeNull();
    });
  });
});
