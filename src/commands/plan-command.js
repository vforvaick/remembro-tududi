const logger = require('../utils/logger');

class PlanCommand {
  constructor(config) {
    this.shiftManager = config.shiftManager;
    this.tududi = config.tududi;
    this.dailyPlanner = config.dailyPlanner;
  }

  parseTimeframe(message) {
    const msg = message.toLowerCase();

    if (msg.includes('hari ini') || msg.includes('today')) return 'today';
    if (msg.includes('besok') || msg.includes('tomorrow')) return 'tomorrow';

    // Try to parse date format YYYY-MM-DD
    const dateMatch = message.match(/(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) return dateMatch[1];

    return 'today'; // Default
  }

  _getDateFromTimeframe(timeframe) {
    const today = new Date();

    if (timeframe === 'today') return today;
    if (timeframe === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }

    return new Date(timeframe);
  }

  _formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  async generatePlanForDate(dateStr) {
    try {
      // If no shift manager, use default plan without shift awareness
      if (!this.shiftManager) {
        const allTasks = await this.tududi.getTasks({ completed: false });
        // Defensive check: ensure allTasks is an array
        if (!Array.isArray(allTasks)) {
          logger.warn('getTasks returned non-array, defaulting to empty list');
          return {
            date: dateStr,
            shift: null,
            plan: {
              availableTime: { start: '07:00', end: '23:00', totalMinutes: 960 },
              blockedTime: null,
              blocks: [],
              totalEstimated: 0,
              workloadPercentage: 0
            },
            formatted: this._formatPlanMessageDefault(dateStr, [])
          };
        }
        const relevantTasks = allTasks.filter(t => !t.due_date || t.due_date <= dateStr);

        return {
          date: dateStr,
          shift: null,
          plan: {
            availableTime: { start: '07:00', end: '23:00', totalMinutes: 960 },
            blockedTime: null,
            blocks: relevantTasks.slice(0, 5),
            totalEstimated: relevantTasks.reduce((s, t) => s + (t.time_estimate || 0), 0),
            workloadPercentage: 50
          },
          formatted: this._formatPlanMessageDefault(dateStr, relevantTasks)
        };
      }

      // Get shift for this date
      const shift = await this.shiftManager.getShiftForDate(dateStr);
      if (!shift) {
        throw new Error(`No shift found for ${dateStr}`);
      }

      // Get all pending tasks
      const allTasks = await this.tududi.getTasks({ completed: false });

      // Defensive check: ensure allTasks is an array
      if (!Array.isArray(allTasks)) {
        logger.warn('getTasks returned non-array, using empty task list');
        return {
          date: dateStr,
          shift,
          plan: this.dailyPlanner.generatePlanWithShift([], shift),
          formatted: this._formatPlanMessage(dateStr, shift, this.dailyPlanner.generatePlanWithShift([], shift), [])
        };
      }

      // Filter tasks for this date or earlier
      const relevantTasks = allTasks.filter(t => {
        if (!t.due_date) return false;
        return t.due_date <= dateStr;
      });

      // Generate plan with shift awareness
      const plan = this.dailyPlanner.generatePlanWithShift(relevantTasks, shift);

      return {
        date: dateStr,
        shift,
        plan,
        formatted: this._formatPlanMessage(dateStr, shift, plan, relevantTasks)
      };
    } catch (error) {
      logger.error(`Error generating plan: ${error.message}`);
      throw error;
    }
  }

  _formatPlanMessage(dateStr, shift, plan, tasks) {
    const dayName = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

    let message = `📅 **${dayName}**:\n\n`;

    // Add time blocks
    if (plan.blocks && plan.blocks.length > 0) {
      for (const block of plan.blocks) {
        message += `${block.startTime}-${block.endTime} | ${block.title} ⏱️${block.estimatedMinutes}m`;
        if (block.energyLevel) {
          message += ` ⚡${block.energyLevel}`;
        }
        message += '\n';
      }
    } else {
      message += '✅ No tasks scheduled\n';
    }

    // Add shift info
    message += `\n⏳ **Shift:** ${shift.timeStart}-${shift.timeEnd}\n`;
    message += `📊 **Workload:** ${plan.workloadPercentage}%\n`;

    // Add available time
    message += `⏰ **Available:** ${plan.availableTime.start}-${plan.availableTime.end} (${Math.floor(plan.availableTime.totalMinutes / 60)}h)\n`;

    // Add warning if overcommitted
    if (plan.warning) {
      message += `\n⚠️ ${plan.warning}`;
    }

    return message;
  }

  _formatPlanMessageDefault(dateStr, tasks) {
    const dayName = new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });

    let message = `📅 **${dayName}** (No shift info)\n\n`;

    if (tasks.length > 0) {
      message += `**Pending Tasks (${tasks.length}):**\n`;
      tasks.slice(0, 5).forEach((task, i) => {
        message += `${i + 1}. ${task.name || task.title}`;
        if (task.due_date) {
          message += ` (Due: ${task.due_date})`;
        }
        message += '\n';
      });
    } else {
      message += '✅ All caught up!\n';
    }

    return message;
  }
}

module.exports = PlanCommand;
