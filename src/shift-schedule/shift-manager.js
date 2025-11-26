const fs = require('fs').promises;
const path = require('path');

class ShiftManager {
  constructor(config) {
    this.shiftDataPath = config.shiftDataPath || path.join(process.cwd(), '.cache/shifts.json');
    this.googleSheetId = config.googleSheetId;
    this.currentData = null;
  }

  async getShiftData() {
    if (!this.currentData) {
      try {
        const content = await fs.readFile(this.shiftDataPath, 'utf-8');
        this.currentData = JSON.parse(content);
      } catch (error) {
        this.currentData = {};
      }
    }
    return this.currentData;
  }

  async fetchAndCache(data) {
    this.currentData = data;
    const dir = path.dirname(this.shiftDataPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.shiftDataPath, JSON.stringify(data, null, 2));
  }

  async getShiftForDate(dateStr) {
    const data = await this.getShiftData();
    if (!data.shifts) return null;
    return data.shifts.find(s => s.date === dateStr) || null;
  }

  async detectChanges(newData) {
    const oldData = await this.getShiftData();
    if (!oldData.shifts || !newData.shifts) return [];

    const changes = [];
    const oldMap = new Map(oldData.shifts.map(s => [s.date, s]));
    const newMap = new Map(newData.shifts.map(s => [s.date, s]));

    for (const [date, newShift] of newMap) {
      const oldShift = oldMap.get(date);
      if (!oldShift || JSON.stringify(oldShift) !== JSON.stringify(newShift)) {
        changes.push({
          date,
          oldShift: oldShift || null,
          newShift
        });
      }
    }

    return changes;
  }
}

module.exports = ShiftManager;
