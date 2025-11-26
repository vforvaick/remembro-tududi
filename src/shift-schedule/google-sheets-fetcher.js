const axios = require('axios');
const logger = require('../utils/logger');

class GoogleSheetsFetcher {
  constructor(config) {
    this.sheetId = config.sheetId;
    this.timeout = config.timeout || 10000;
  }

  getExportUrl(sheetName = 'NOV 2025') {
    // For initial implementation, we fetch by sheet name
    // Real implementation would need sheet GID from metadata
    return `https://docs.google.com/spreadsheets/d/${this.sheetId}/export?format=csv&gid=0`;
  }

  async fetchCSV() {
    try {
      const url = this.getExportUrl();
      const response = await axios.get(url, { timeout: this.timeout });
      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch Google Sheet: ${error.message}`);
      throw error;
    }
  }

  async fetchAndParse(dateStr) {
    const csv = await this.fetchCSV();
    const lines = csv.split('\n');

    // Find row containing "Faiq"
    let faiqRowIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Faiq')) {
        faiqRowIndex = i;
        break;
      }
    }

    if (faiqRowIndex === -1) {
      throw new Error('Could not find user "Faiq" in spreadsheet');
    }

    const faiqRow = lines[faiqRowIndex].split(',');
    const shifts = [];

    // Columns E onwards (index 4+) = shift codes
    // Find where "Faiq" is to determine start index of shift codes
    const faiqIndex = faiqRow.findIndex(cell => cell.includes('Faiq'));

    if (faiqIndex === -1) {
      throw new Error('Could not find Faiq in row');
    }

    // Shift codes start after "Faiq"
    for (let i = faiqIndex + 1; i < faiqRow.length; i++) {
      const code = faiqRow[i]?.trim();
      if (code && code.match(/^[1-3]$/)) {
        const dayIndex = i - faiqIndex; // First code is day 1
        shifts.push({
          day: dayIndex,
          code,
          column: String.fromCharCode(68 + dayIndex - 1) // D=68 in ASCII
        });
      }
    }

    return shifts;
  }
}

module.exports = GoogleSheetsFetcher;
