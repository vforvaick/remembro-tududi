const logger = require('../utils/logger');
const { buildPrompt } = require('./prompts/daily-plan');

class DailyPlanner {
  constructor(claudeClient, tududiClient) {
    this.claude = claudeClient;
    this.tududi = tududiClient;

    // Shift timing definitions
    this.shiftTimings = {
      '1': { bedtime: '23:00', wakeTime: '07:00' },
      '2': { bedtime: '02:00', wakeTime: '07:00' },
      '2_special': { bedtime: '00:00', wakeTime: '07:00' },
      '3': { bedtime: '08:00', wakeTime: '22:00' }
    };
  }

  async generatePlan(schedule, options = {}) {
    try {
      logger.info('Generating daily plan...');

      // Fetch incomplete tasks
      const tasks = await this.tududi.getTasks({
        completed: false
      });

      if (tasks.length === 0) {
        return {
          summary: 'No tasks to plan!',
          available_time: schedule.available_hours * 60,
          planned_time: 0,
          buffer_time: schedule.available_hours * 60,
          priority_tasks: [],
          skipped_tasks: []
        };
      }

      // Build prompt and generate plan
      const { systemPrompt, userPrompt } = buildPrompt(tasks, schedule);
      const plan = await this.claude.parseJSON(userPrompt, { systemPrompt });

      logger.info(`Plan generated: ${plan.priority_tasks.length} tasks scheduled`);

      return plan;
    } catch (error) {
      logger.error(`Failed to generate plan: ${error.message}`);
      throw error;
    }
  }

  calculateAvailableTime(shift) {
    // Get shift timing for this shift code
    const timing = this.shiftTimings[shift.code];
    if (!timing) {
      return { start: '07:00', end: '23:00', totalMinutes: 960 };
    }

    // Calculate available time based on shift
    if (shift.code === '1') {
      // Morning shift: available from end of shift to bedtime
      const shiftEnd = this._timeToMinutes(shift.timeEnd); // 16:00
      const bedtime = this._timeToMinutes(timing.bedtime); // 23:00
      return {
        start: shift.timeEnd,
        end: timing.bedtime,
        totalMinutes: bedtime - shiftEnd
      };
    } else if (shift.code === '2') {
      // Evening/night shift: available before shift starts
      const wakeTime = this._timeToMinutes(timing.wakeTime); // 07:00
      const shiftStart = this._timeToMinutes(shift.timeStart); // 16:00
      return {
        start: timing.wakeTime,
        end: shift.timeStart,
        totalMinutes: shiftStart - wakeTime
      };
    } else if (shift.code === '3') {
      // Night shift: available from end to bedtime
      const shiftEnd = this._timeToMinutes(shift.timeEnd); // 07:00
      const bedtime = this._timeToMinutes(timing.bedtime); // 08:00
      return {
        start: shift.timeEnd,
        end: timing.bedtime,
        totalMinutes: bedtime - shiftEnd
      };
    }

    return { start: '07:00', end: '23:00', totalMinutes: 960 };
  }

  generatePlanWithShift(tasks, shift) {
    const available = this.calculateAvailableTime(shift);
    const totalEstimated = tasks.reduce((sum, t) => sum + (t.estimatedMinutes || t.time_estimate || 0), 0);
    const workloadPercentage = Math.round((totalEstimated / available.totalMinutes) * 100);

    const blocks = this._createTimeBlocks(tasks, available);

    return {
      availableTime: available,
      blockedTime: {
        start: shift.timeStart,
        end: shift.timeEnd
      },
      blocks,
      totalEstimated,
      workloadPercentage,
      warning: workloadPercentage > 100 ? `Tasks exceed available time by ${workloadPercentage - 100}%` : null
    };
  }

  _createTimeBlocks(tasks, available) {
    const blocks = [];
    let currentTime = this._timeToMinutes(available.start);
    const endTime = this._timeToMinutes(available.end);

    for (const task of tasks) {
      const taskMinutes = task.estimatedMinutes || task.time_estimate || 30;
      if (currentTime + taskMinutes <= endTime) {
        blocks.push({
          taskId: task.id,
          title: task.title || task.name,
          startTime: this._minutesToTime(currentTime),
          endTime: this._minutesToTime(currentTime + taskMinutes),
          estimatedMinutes: taskMinutes,
          energyLevel: task.energyLevel || task.energy_level
        });
        currentTime += taskMinutes;
      }
    }

    return blocks;
  }

  _timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  _minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  formatPlanMessage(plan) {
    let message = `📅 **Daily Plan**\n\n`;
    message += `${plan.summary}\n\n`;
    message += `⏱️ Available: ${plan.available_time}m | Planned: ${plan.planned_time}m | Buffer: ${plan.buffer_time}m\n\n`;

    if (plan.priority_tasks.length > 0) {
      message += `**Priority Tasks (${plan.priority_tasks.length}):**\n\n`;
      plan.priority_tasks.forEach((task, i) => {
        message += `${i + 1}. *${task.title}*\n`;
        message += `   ⏰ ${task.time_slot} (${task.duration}m) ⚡${task.energy}\n`;
        if (task.reason) {
          message += `   💡 ${task.reason}\n`;
        }
        message += `\n`;
      });
    }

    if (plan.skipped_tasks && plan.skipped_tasks.length > 0) {
      message += `\n**Skipped (${plan.skipped_tasks.length}):**\n`;
      plan.skipped_tasks.forEach(task => {
        message += `• ${task.title} - ${task.reason}\n`;
      });
    }

    if (plan.warnings && plan.warnings.length > 0) {
      message += `\n⚠️ **Warnings:**\n`;
      plan.warnings.forEach(warning => {
        message += `• ${warning}\n`;
      });
    }

    return message;
  }
}

module.exports = DailyPlanner;
