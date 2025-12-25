const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Month name mappings for Indonesian and English
 */
const MONTH_MAPPINGS = {
  // Indonesian
  'JAN': 1, 'FEB': 2, 'MAR': 3, 'APR': 4, 'MEI': 5, 'JUN': 6,
  'JUL': 7, 'AGU': 8, 'AUG': 8, 'SEP': 9, 'SEPT': 9, 'OKT': 10,
  'NOV': 11, 'DES': 12,
  // English
  'DEC': 12, 'OCT': 10, 'MAY': 5
};

/**
 * Fallback GID mapping for known sheets (used if dynamic discovery fails)
 */
const FALLBACK_GIDS = {
  'JAN 2026': 253144821,
  'DES 2025': 1689755739,
  'NOV 2025': 455614003,
  'OKT 2025': 1552655877,
  'SEP 2025': 1170082231,
  'AUG 2025': 1447856998,
  'JUL 2025': 24254339,
  'JUN 2025': 693715431
};

class GoogleSheetsFetcher {
  constructor(config) {
    this.sheetId = config.sheetId;
    this.sheetGid = config.sheetGid || 0;
    this.timeout = config.timeout || 15000;
    this.userName = config.userName || 'AHMAD FAIQ NAUFAL';

    // Cache for discovered GIDs (24 hour TTL)
    this.gidCache = null;
    this.gidCacheTime = null;
    this.gidCacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  }

  /**
   * Get the base spreadsheet URL
   */
  getSpreadsheetUrl() {
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/edit`;
  }

  /**
   * Get CSV export URL for a specific GID
   */
  getExportUrl(gid = null) {
    const targetGid = gid !== null ? gid : this.sheetGid;
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv&gid=${targetGid}`;
  }

  /**
   * Discover all sheet tabs and their GIDs by parsing the spreadsheet HTML
   * @returns {Promise<Object>} Map of sheet names to GIDs
   */
  async discoverSheetGids() {
    // Check cache first
    if (this.gidCache && this.gidCacheTime &&
      (Date.now() - this.gidCacheTime) < this.gidCacheTTL) {
      logger.debug('Using cached GID mappings');
      return this.gidCache;
    }

    try {
      const url = this.getSpreadsheetUrl();
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ShiftScheduleBot/1.0)'
        }
      });

      const html = response.data;
      const gidMap = this.parseGidsFromHtml(html);

      if (Object.keys(gidMap).length > 0) {
        this.gidCache = gidMap;
        this.gidCacheTime = Date.now();
        logger.info(`Discovered ${Object.keys(gidMap).length} sheet tabs`);
      }

      return gidMap;
    } catch (error) {
      logger.warn(`Failed to discover GIDs dynamically: ${error.message}`);
      logger.info('Using fallback GID mappings');
      return FALLBACK_GIDS;
    }
  }

  /**
   * Parse sheet GIDs from spreadsheet HTML
   * Google Sheets embeds sheet metadata in JavaScript
   */
  parseGidsFromHtml(html) {
    const gidMap = {};

    // Pattern 1: Look for sheet metadata in embedded JS
    // Format: [gid,"Sheet Name",...]
    const pattern1 = /\[(\d{5,}),"([^"]+)"/g;
    let match;

    while ((match = pattern1.exec(html)) !== null) {
      const gid = parseInt(match[1]);
      const name = match[2];

      // Filter for month-year patterns (e.g., "DES 2025", "NOV 2025")
      if (/^[A-Z]{3,4}\s+20\d{2}$/.test(name)) {
        gidMap[name] = gid;
      }
    }

    // Pattern 2: Alternative format in JSON-like structures
    const pattern2 = /"name":"([^"]+)"[^}]*"sheetId":(\d+)/g;
    while ((match = pattern2.exec(html)) !== null) {
      const name = match[1];
      const gid = parseInt(match[2]);

      if (/^[A-Z]{3,4}\s+20\d{2}$/.test(name)) {
        gidMap[name] = gid;
      }
    }

    return gidMap;
  }

  /**
   * Convert month number to possible sheet name formats
   */
  getMonthSheetNames(month, year) {
    const monthNames = {
      1: ['JAN'],
      2: ['FEB'],
      3: ['MAR'],
      4: ['APR'],
      5: ['MEI', 'MAY'],
      6: ['JUN'],
      7: ['JUL'],
      8: ['AUG', 'AGU'],
      9: ['SEP', 'SEPT'],
      10: ['OKT', 'OCT'],
      11: ['NOV'],
      12: ['DES', 'DEC']
    };

    const names = monthNames[month] || [];
    return names.map(n => `${n} ${year}`);
  }

  /**
   * Get the GID for a specific month and year
   * @param {number} month - Month number (1-12)
   * @param {number} year - Year (e.g., 2025)
   * @returns {Promise<number|null>} GID or null if not found
   */
  async getGidForMonth(month, year) {
    const gidMap = await this.discoverSheetGids();
    const possibleNames = this.getMonthSheetNames(month, year);

    for (const name of possibleNames) {
      if (gidMap[name] !== undefined) {
        logger.debug(`Found GID for ${name}: ${gidMap[name]}`);
        return gidMap[name];
      }
    }

    // Check fallback
    for (const name of possibleNames) {
      if (FALLBACK_GIDS[name] !== undefined) {
        logger.debug(`Using fallback GID for ${name}: ${FALLBACK_GIDS[name]}`);
        return FALLBACK_GIDS[name];
      }
    }

    logger.warn(`No GID found for month ${month}/${year}`);
    return null;
  }

  /**
   * Fetch CSV data from Google Sheets
   * @param {number|null} gid - Optional specific GID to fetch
   */
  async fetchCSV(gid = null) {
    try {
      const url = this.getExportUrl(gid);
      const response = await axios.get(url, { timeout: this.timeout });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch Google Sheet: ${error.message}`);
      throw error;
    }
  }

  /**
   * Fetch CSV for a specific month
   * @param {number} month - Month number (1-12)
   * @param {number} year - Year (e.g., 2025)
   */
  async fetchMonthCSV(month, year) {
    const gid = await this.getGidForMonth(month, year);
    if (gid === null) {
      throw new Error(`Sheet not found for ${month}/${year}`);
    }
    return this.fetchCSV(gid);
  }

  /**
   * Parse CSV and extract user's shift data
   * @param {string} csv - Raw CSV content
   * @returns {Object} Parsed shift data with header info and shifts
   */
  parseUserShifts(csv) {
    const lines = csv.split('\n').map(line => line.split(','));

    // Find header row with days (Sen, Sel, Rab, etc.)
    let headerRowIndex = -1;
    let dateRowIndex = -1;

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const row = lines[i].join(',');
      if (row.includes('Sen') || row.includes('Sel') || row.includes('Mon') || row.includes('Tue')) {
        headerRowIndex = i;
        dateRowIndex = i - 1;
        break;
      }
    }

    // Find user row
    let userRowIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].some(cell => cell && cell.toUpperCase().includes(this.userName.toUpperCase()))) {
        userRowIndex = i;
        break;
      }
    }

    if (userRowIndex === -1) {
      throw new Error(`Could not find user "${this.userName}" in spreadsheet`);
    }

    const userRow = lines[userRowIndex];
    const dateRow = dateRowIndex >= 0 ? lines[dateRowIndex] : [];

    // Find the column where dates start (usually column D, index 3)
    let dateStartCol = 3;
    for (let i = 0; i < dateRow.length; i++) {
      if (dateRow[i] && /^\d{1,2}$/.test(dateRow[i].trim())) {
        dateStartCol = i;
        break;
      }
    }

    // Extract shifts
    const shifts = [];
    for (let i = dateStartCol; i < userRow.length; i++) {
      const day = dateRow[i] ? parseInt(dateRow[i].trim()) : (i - dateStartCol + 1);
      const code = userRow[i] ? userRow[i].trim() : '';

      if (day > 0 && day <= 31 && code) {
        shifts.push({ day, code });
      }
    }

    return {
      userName: this.userName,
      shifts
    };
  }

  /**
   * Fetch and parse shifts for a specific month
   * @param {number} month - Month number (1-12)
   * @param {number} year - Year (e.g., 2025)
   */
  async fetchAndParseMonth(month, year) {
    const csv = await this.fetchMonthCSV(month, year);
    const data = this.parseUserShifts(csv);
    return {
      month,
      year,
      ...data
    };
  }

  /**
   * Fetch and parse shifts for the current month
   */
  async fetchCurrentMonth() {
    const now = new Date();
    return this.fetchAndParseMonth(now.getMonth() + 1, now.getFullYear());
  }

  /**
   * Clear the GID cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.gidCache = null;
    this.gidCacheTime = null;
    logger.info('GID cache cleared');
  }
}

module.exports = GoogleSheetsFetcher;
