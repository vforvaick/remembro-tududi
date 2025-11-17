const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function timestamp() {
  return new Date().toISOString();
}

function maskSensitive(message) {
  // Mask API keys, tokens, passwords
  return message
    .replace(/sk-ant-[a-zA-Z0-9-]+/g, 'sk-ant-***')
    .replace(/xoxb-[a-zA-Z0-9-]+/g, 'xoxb-***')
    .replace(/(token|password|secret)[:=]\s*[^\s]+/gi, '$1: ***');
}

function log(level, message, options = {}) {
  const ts = timestamp();
  let logMessage = message;

  if (options.maskSensitive !== false) {
    logMessage = maskSensitive(String(message));
  }

  const formattedMessage = `${ts} [${level}] ${logMessage}`;

  // Console output
  if (level === 'ERROR') {
    console.error(formattedMessage);
  } else {
    console.log(formattedMessage);
  }

  // File output
  const logFile = path.join(LOG_DIR, `${level.toLowerCase()}.log`);
  fs.appendFileSync(logFile, formattedMessage + '\n');
}

module.exports = {
  info: (message, options) => log('INFO', message, options),
  warn: (message, options) => log('WARN', message, options),
  error: (message, options) => log('ERROR', message, options),
  debug: (message, options) => log('DEBUG', message, options),
};
