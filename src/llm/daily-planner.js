const logger = require('../utils/logger');
const { buildPrompt } = require('./prompts/daily-plan');

/**
 * DailyPlanner with micro-agent loop (Plan-Do-Check pattern)
 * 
 * Stage 1 (Plan): Generate initial schedule with LLM
 * Stage 2 (Do): Check calendar conflicts and constraints
 * Stage 3 (Check): If issues found, iterate with adjusted constraints
 */
class DailyPlanner {
  constructor(llmClient, tududiClient, calendarService = null) {
    this.llm = llmClient;
    this.tududi = tududiClient;
    this.calendar = calendarService;

    // Shift timing definitions
    this.shiftTimings = {
      '1': { bedtime: '23:00', wakeTime: '07:00' },
      '2': { bedtime: '02:00', wakeTime: '07:00' },
      '2_special': { bedtime: '00:00', wakeTime: '07:00' },
      '3': { bedtime: '08:00', wakeTime: '22:00' }
    };

    // Max iterations for plan-do-check loop
    this.maxIterations = 2;
  }

  /**
   * Main entry point: Generate plan with micro-agent loop
   * Plan → Check conflicts → Adjust if needed → Final plan
   */
  async generatePlan(schedule, options = {}) {
    try {
      logger.info('Starting plan-do-check loop...');

      // Fetch incomplete tasks
      const tasks = await this.tududi.getTasks({ completed: false });

      if (!Array.isArray(tasks) || tasks.length === 0) {
        return this._emptyPlan(schedule);
      }

      // Get calendar events for today (if calendar is configured)
      let calendarEvents = [];
      if (this.calendar?.isConfigured()) {
        try {
          calendarEvents = await this.calendar.getTodayEvents();
          logger.info(`Loaded ${calendarEvents.length} calendar events for planning`);
        } catch (err) {
          logger.warn(`Could not load calendar events: ${err.message}`);
        }
      }

      // === PLAN-DO-CHECK LOOP ===
      let plan = null;
      let conflicts = [];
      let iteration = 0;

      while (iteration < this.maxIterations) {
        iteration++;
        logger.info(`Plan iteration ${iteration}/${this.maxIterations}`);

        // PLAN: Generate plan with LLM
        plan = await this._generatePlanWithLLM(tasks, schedule, calendarEvents, conflicts);

        // DO: Check for conflicts
        if (this.calendar?.isConfigured() && plan.priority_tasks?.length > 0) {
          conflicts = await this._checkPlanConflicts(plan, calendarEvents);

          // CHECK: If conflicts found and we can iterate, loop again
          if (conflicts.length > 0 && iteration < this.maxIterations) {
            logger.info(`Found ${conflicts.length} conflicts, adjusting plan...`);
            continue;
          }
        }

        // No conflicts or max iterations reached
        break;
      }

      // Add conflict warnings to plan
      if (conflicts.length > 0) {
        plan.warnings = plan.warnings || [];
        conflicts.forEach(c => {
          plan.warnings.push(`⚠️ "${c.taskTitle}" overlaps with "${c.eventTitle}"`);
        });
      }

      logger.info(`Plan generated after ${iteration} iteration(s): ${plan.priority_tasks?.length || 0} tasks scheduled`);
      return plan;

    } catch (error) {
      logger.error(`Failed to generate plan: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate plan using LLM
   */
  async _generatePlanWithLLM(tasks, schedule, calendarEvents, previousConflicts) {
    // Build calendar event summary for prompt
    const eventSummary = calendarEvents
      .filter(e => e.start.dateTime)
      .map(e => {
        const start = new Date(e.start.dateTime);
        const end = new Date(e.end.dateTime);
        return `${start.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}-${end.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}: ${e.summary}`;
      })
      .join('\n');

    // Build conflict avoidance instructions
    let conflictInstructions = '';
    if (previousConflicts.length > 0) {
      conflictInstructions = `\nAVOID THESE TIME SLOTS (conflicts detected):\n`;
      previousConflicts.forEach(c => {
        conflictInstructions += `- ${c.taskTitle} cannot be at ${c.conflictTime}\n`;
      });
    }

    const { systemPrompt, userPrompt } = buildPrompt(tasks, schedule);

    // Inject calendar context into prompt
    const enhancedUserPrompt = `${userPrompt}

CALENDAR EVENTS TODAY:
${eventSummary || 'No events scheduled'}
${conflictInstructions}

IMPORTANT: Do NOT schedule tasks that overlap with calendar events.`;

    const plan = await this.llm.parseJSON(enhancedUserPrompt, {
      systemPrompt,
      model: 'pro' // Use pro for better planning
    });

    return plan;
  }

  /**
   * Check plan for conflicts with calendar events
   */
  async _checkPlanConflicts(plan, calendarEvents) {
    const conflicts = [];
    const today = new Date();

    for (const task of plan.priority_tasks || []) {
      // Parse time_slot (e.g., "09:00-10:30")
      if (!task.time_slot) continue;

      const match = task.time_slot.match(/(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/);
      if (!match) continue;

      const [_, startStr, endStr] = match;
      const taskStart = this._parseTimeToDate(today, startStr);
      const taskEnd = this._parseTimeToDate(today, endStr);

      // Check against each calendar event
      for (const event of calendarEvents) {
        if (!event.start.dateTime) continue; // Skip all-day events

        const eventStart = new Date(event.start.dateTime);
        const eventEnd = new Date(event.end.dateTime);

        // Check overlap
        if (taskStart < eventEnd && taskEnd > eventStart) {
          conflicts.push({
            taskTitle: task.title,
            eventTitle: event.summary,
            conflictTime: task.time_slot,
            eventTime: `${eventStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}-${eventEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
          });
        }
      }
    }

    return conflicts;
  }

  _parseTimeToDate(baseDate, timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(baseDate);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  _emptyPlan(schedule) {
    return {
      summary: 'No tasks to plan!',
      available_time: (schedule?.available_hours || 8) * 60,
      planned_time: 0,
      buffer_time: (schedule?.available_hours || 8) * 60,
      priority_tasks: [],
      skipped_tasks: []
    };
  }

  calculateAvailableTime(shift) {
    const timing = this.shiftTimings[shift.code];
    if (!timing) {
      return { start: '07:00', end: '23:00', totalMinutes: 960 };
    }

    if (shift.code === '1') {
      const shiftEnd = this._timeToMinutes(shift.timeEnd);
      const bedtime = this._timeToMinutes(timing.bedtime);
      return { start: shift.timeEnd, end: timing.bedtime, totalMinutes: bedtime - shiftEnd };
    } else if (shift.code === '2') {
      const wakeTime = this._timeToMinutes(timing.wakeTime);
      const shiftStart = this._timeToMinutes(shift.timeStart);
      return { start: timing.wakeTime, end: shift.timeStart, totalMinutes: shiftStart - wakeTime };
    } else if (shift.code === '3') {
      const shiftEnd = this._timeToMinutes(shift.timeEnd);
      const bedtime = this._timeToMinutes(timing.bedtime);
      return { start: shift.timeEnd, end: timing.bedtime, totalMinutes: bedtime - shiftEnd };
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
      blockedTime: { start: shift.timeStart, end: shift.timeEnd },
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

    if (plan.priority_tasks?.length > 0) {
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

    if (plan.skipped_tasks?.length > 0) {
      message += `\n**Skipped (${plan.skipped_tasks.length}):**\n`;
      plan.skipped_tasks.forEach(task => {
        message += `• ${task.title} - ${task.reason}\n`;
      });
    }

    if (plan.warnings?.length > 0) {
      message += `\n⚠️ **Warnings:**\n`;
      plan.warnings.forEach(warning => {
        message += `• ${warning}\n`;
      });
    }

    return message;
  }
}

module.exports = DailyPlanner;
