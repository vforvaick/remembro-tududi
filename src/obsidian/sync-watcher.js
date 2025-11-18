const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ObsidianSyncWatcher {
  constructor(config) {
    this.vaultPath = config.vaultPath;
    this.watcher = null;
    this.changeHandler = null;
    this.taskChangeHandler = null;
    this.debounceTimers = {};
    this.debounceDelay = 2000; // 2 seconds
    this.lastTaskStates = {}; // Track previous task states
  }

  onChange(handler) {
    this.changeHandler = handler;
  }

  onTaskChange(handler) {
    this.taskChangeHandler = handler;
  }

  extractTasksFromContent(content) {
    const tasks = [];
    const taskPattern = /- \[([ x])\](.+?)\[\[Tududi-(\d+)\]\]/g;
    let match;

    while ((match = taskPattern.exec(content)) !== null) {
      tasks.push({
        taskId: parseInt(match[3]),
        completed: match[1] === 'x',
        title: match[2].trim()
      });
    }

    return tasks;
  }

  async handleFileChange(filePath) {
    try {
      // Debounce: wait for file changes to settle
      if (this.debounceTimers[filePath]) {
        clearTimeout(this.debounceTimers[filePath]);
      }

      return new Promise((resolve) => {
        this.debounceTimers[filePath] = setTimeout(async () => {
          logger.info(`File changed: ${filePath}`);

          // Call generic change handler
          if (this.changeHandler) {
            await this.changeHandler(filePath);
          }

          // Check for task changes
          if (this.taskChangeHandler && filePath.endsWith('.md')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const tasks = this.extractTasksFromContent(content);

            for (const task of tasks) {
              const key = `${filePath}-${task.taskId}`;
              const previousState = this.lastTaskStates[key];

              // Call handler if state changed OR if this is first time seeing task and it's completed
              const shouldNotify = (previousState !== undefined && previousState !== task.completed) ||
                                 (previousState === undefined && task.completed);

              if (shouldNotify) {
                logger.info(`Task ${task.taskId} status changed: ${task.completed}`);
                await this.taskChangeHandler({
                  taskId: task.taskId,
                  completed: task.completed,
                  title: task.title
                });
              }

              this.lastTaskStates[key] = task.completed;
            }
          }

          delete this.debounceTimers[filePath];
          resolve();
        }, this.debounceDelay);
      });
    } catch (error) {
      logger.error(`Error handling file change: ${error.message}`);
    }
  }

  start() {
    logger.info(`Starting Obsidian vault watcher: ${this.vaultPath}`);

    this.watcher = chokidar.watch(this.vaultPath, {
      persistent: true,
      ignoreInitial: true,
      ignored: /(^|[\/\\])\../, // Ignore hidden files
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    this.watcher
      .on('change', (filePath) => this.handleFileChange(filePath))
      .on('ready', () => {
        logger.info('Obsidian watcher ready');
      })
      .on('error', (error) => {
        logger.error(`Watcher error: ${error.message}`);
      });
  }

  stop() {
    if (this.watcher) {
      logger.info('Stopping Obsidian watcher');
      this.watcher.close();
      this.watcher = null;
    }
  }
}

module.exports = ObsidianSyncWatcher;
