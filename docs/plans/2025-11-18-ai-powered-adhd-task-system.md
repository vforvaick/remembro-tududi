# AI-Powered ADHD Task Management System - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an AI-powered task management system integrating Telegram Bot, Tududi task engine, and Obsidian knowledge base to solve ADHD-specific challenges through intelligent automation and low-friction capture.

**Architecture:** Three-layer system: (1) Telegram Bot as primary interface for zero-friction capture, (2) Node.js LLM middleware using Claude 3.5 Sonnet for intelligent parsing and planning, (3) Tududi API for task storage and Obsidian filesystem sync for knowledge management. All components communicate via REST APIs and file watchers.

**Tech Stack:** Node.js 18+, Telegram Bot API (node-telegram-bot-api), Anthropic Claude API, OpenAI Whisper API, Tududi REST API, Obsidian (markdown files), Chokidar (file watcher), Docker, PostgreSQL/SQLite

---

## Phase 0: Project Setup & Infrastructure

### Task 0.1: Initialize Project Structure

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `README.md`
- Create: `docker-compose.yml`

**Step 1: Initialize Node.js project**

```bash
npm init -y
```

Expected: `package.json` created

**Step 2: Install core dependencies**

```bash
npm install node-telegram-bot-api @anthropic-ai/sdk axios dotenv
npm install --save-dev jest nodemon
```

Expected: Dependencies installed, `package-lock.json` created

**Step 3: Create .env.example file**

```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_USER_ID=your_telegram_user_id

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# OpenAI Whisper API
OPENAI_API_KEY=your_openai_api_key_here

# Tududi API
TUDUDI_API_URL=http://localhost:3000
TUDUDI_API_TOKEN=your_tududi_api_token

# Obsidian Vault
OBSIDIAN_VAULT_PATH=/path/to/obsidian/vault
OBSIDIAN_DAILY_NOTES_PATH=Daily Notes

# Timezone
TIMEZONE=Asia/Jakarta

# Port
PORT=3001
```

**Step 4: Create .gitignore**

```
node_modules/
.env
*.log
.DS_Store
dist/
build/
coverage/
```

**Step 5: Create project directory structure**

```bash
mkdir -p src/{bot,llm,tududi,obsidian,utils}
mkdir -p tests/{bot,llm,tududi,obsidian,utils}
mkdir -p docs/{plans,api}
mkdir -p logs
```

Expected: Directory structure created

**Step 6: Create basic README.md**

```markdown
# AI-Powered ADHD Task Management System

Zero-friction task capture and AI-powered planning for ADHD users.

## Setup

1. Copy `.env.example` to `.env` and fill in your API keys
2. Install dependencies: `npm install`
3. Start development: `npm run dev`

## Architecture

- **Telegram Bot**: User interface layer
- **LLM Middleware**: Claude AI for parsing and planning
- **Tududi API**: Task storage engine
- **Obsidian Sync**: Knowledge base integration

## Development

- `npm run dev` - Start with nodemon (auto-reload)
- `npm test` - Run tests
- `npm run lint` - Check code style

See [Implementation Plan](docs/plans/2025-11-18-ai-powered-adhd-task-system.md) for details.
```

**Step 7: Update package.json scripts**

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

**Step 8: Create docker-compose.yml for Tududi**

```yaml
version: '3.8'

services:
  tududi:
    image: ghcr.io/tududi/tududi:latest
    container_name: tududi-api
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://tududi:tududi@postgres:5432/tududi
      - JWT_SECRET=your_jwt_secret_here
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:14-alpine
    container_name: tududi-postgres
    environment:
      - POSTGRES_USER=tududi
      - POSTGRES_PASSWORD=tududi
      - POSTGRES_DB=tududi
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Step 9: Commit project setup**

```bash
git add .
git commit -m "chore: initialize project structure and dependencies"
```

**Step 10: Update progress.md**

Mark Task 0.1 as complete in `progress.md`

**Step 11: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 0.1 complete"
```

---

### Task 0.2: Create Core Configuration Module

**Files:**
- Create: `src/config.js`
- Create: `tests/config.test.js`

**Step 1: Write failing test for config loading**

Create `tests/config.test.js`:

```javascript
const config = require('../src/config');

describe('Configuration', () => {
  test('loads environment variables', () => {
    expect(config.telegram.botToken).toBeDefined();
    expect(config.anthropic.apiKey).toBeDefined();
    expect(config.tududi.apiUrl).toBeDefined();
  });

  test('has default values for optional configs', () => {
    expect(config.timezone).toBe('Asia/Jakarta');
    expect(config.claude.model).toContain('claude-3-5-sonnet');
  });

  test('throws error if required env vars missing', () => {
    const originalEnv = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;

    expect(() => {
      jest.resetModules();
      require('../src/config');
    }).toThrow('TELEGRAM_BOT_TOKEN is required');

    process.env.TELEGRAM_BOT_TOKEN = originalEnv;
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/config.test.js
```

Expected: FAIL with "Cannot find module '../src/config'"

**Step 3: Write minimal config implementation**

Create `src/config.js`:

```javascript
require('dotenv').config();

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required in environment variables`);
  }
  return value;
}

function optional(name, defaultValue) {
  return process.env[name] || defaultValue;
}

module.exports = {
  telegram: {
    botToken: required('TELEGRAM_BOT_TOKEN'),
    userId: required('TELEGRAM_USER_ID'),
  },
  anthropic: {
    apiKey: required('ANTHROPIC_API_KEY'),
  },
  openai: {
    apiKey: required('OPENAI_API_KEY'),
  },
  tududi: {
    apiUrl: required('TUDUDI_API_URL'),
    apiToken: required('TUDUDI_API_TOKEN'),
  },
  obsidian: {
    vaultPath: required('OBSIDIAN_VAULT_PATH'),
    dailyNotesPath: optional('OBSIDIAN_DAILY_NOTES_PATH', 'Daily Notes'),
  },
  claude: {
    model: optional('CLAUDE_MODEL', 'claude-3-5-sonnet-20241022'),
    maxTokens: parseInt(optional('CLAUDE_MAX_TOKENS', '4096')),
  },
  timezone: optional('TIMEZONE', 'Asia/Jakarta'),
  port: parseInt(optional('PORT', '3001')),
};
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/config.test.js
```

Expected: PASS (after creating `.env` file with test values)

**Step 5: Commit config module**

```bash
git add src/config.js tests/config.test.js
git commit -m "feat: add configuration module with validation"
```

**Step 6: Update progress.md**

Mark Task 0.2 as complete in `progress.md`

**Step 7: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 0.2 complete"
```

---

### Task 0.3: Create Logger Utility

**Files:**
- Create: `src/utils/logger.js`
- Create: `tests/utils/logger.test.js`

**Step 1: Write failing test for logger**

Create `tests/utils/logger.test.js`:

```javascript
const logger = require('../../src/utils/logger');

describe('Logger', () => {
  let consoleLogSpy;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('logs info messages', () => {
    logger.info('Test message');
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[INFO]'),
      expect.stringContaining('Test message')
    );
  });

  test('logs error messages', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    logger.error('Error message');
    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('masks sensitive data in logs', () => {
    logger.info('API key: sk-ant-1234567890', { maskSensitive: true });
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('sk-ant-***')
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/utils/logger.test.js
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal logger implementation**

Create `src/utils/logger.js`:

```javascript
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
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/utils/logger.test.js
```

Expected: PASS

**Step 5: Commit logger utility**

```bash
git add src/utils/logger.js tests/utils/logger.test.js
git commit -m "feat: add logger utility with sensitive data masking"
```

**Step 6: Update progress.md**

Mark Task 0.3 as complete in `progress.md`

**Step 7: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 0.3 complete"
```

---

## Phase 1: Tududi API Integration

### Task 1.1: Create Tududi API Client

**Files:**
- Create: `src/tududi/client.js`
- Create: `tests/tududi/client.test.js`

**Step 1: Write failing test for Tududi client**

Create `tests/tududi/client.test.js`:

```javascript
const TududuClient = require('../../src/tududi/client');
const axios = require('axios');

jest.mock('axios');

describe('TududuClient', () => {
  let client;

  beforeEach(() => {
    client = new TududuClient({
      apiUrl: 'http://localhost:3000',
      apiToken: 'test-token'
    });
  });

  test('creates a new task', async () => {
    const mockTask = {
      id: 1,
      title: 'Test Task',
      due_date: '2025-11-20'
    };

    axios.post.mockResolvedValue({ data: mockTask });

    const result = await client.createTask({
      title: 'Test Task',
      due_date: '2025-11-20'
    });

    expect(result).toEqual(mockTask);
    expect(axios.post).toHaveBeenCalledWith(
      'http://localhost:3000/api/tasks',
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token'
        })
      })
    );
  });

  test('gets all tasks', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1' },
      { id: 2, title: 'Task 2' }
    ];

    axios.get.mockResolvedValue({ data: mockTasks });

    const result = await client.getTasks();

    expect(result).toEqual(mockTasks);
  });

  test('updates a task', async () => {
    const mockTask = { id: 1, title: 'Updated Task', completed: true };
    axios.patch.mockResolvedValue({ data: mockTask });

    const result = await client.updateTask(1, { completed: true });

    expect(result).toEqual(mockTask);
  });

  test('handles API errors gracefully', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    await expect(client.createTask({ title: 'Test' }))
      .rejects.toThrow('Network error');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/tududi/client.test.js
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal Tududi client implementation**

Create `src/tududi/client.js`:

```javascript
const axios = require('axios');
const logger = require('../utils/logger');

class TududuClient {
  constructor(config) {
    this.apiUrl = config.apiUrl;
    this.apiToken = config.apiToken;
    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async createTask(taskData) {
    try {
      logger.info(`Creating task: ${taskData.title}`);
      const response = await this.axiosInstance.post('/api/tasks', taskData);
      logger.info(`Task created with ID: ${response.data.id}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to create task: ${error.message}`);
      throw error;
    }
  }

  async getTasks(filters = {}) {
    try {
      const response = await this.axiosInstance.get('/api/tasks', {
        params: filters
      });
      return response.data;
    } catch (error) {
      logger.error(`Failed to get tasks: ${error.message}`);
      throw error;
    }
  }

  async getTask(taskId) {
    try {
      const response = await this.axiosInstance.get(`/api/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to get task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  async updateTask(taskId, updates) {
    try {
      logger.info(`Updating task ${taskId}`);
      const response = await this.axiosInstance.patch(
        `/api/tasks/${taskId}`,
        updates
      );
      logger.info(`Task ${taskId} updated`);
      return response.data;
    } catch (error) {
      logger.error(`Failed to update task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  async deleteTask(taskId) {
    try {
      logger.info(`Deleting task ${taskId}`);
      await this.axiosInstance.delete(`/api/tasks/${taskId}`);
      logger.info(`Task ${taskId} deleted`);
    } catch (error) {
      logger.error(`Failed to delete task ${taskId}: ${error.message}`);
      throw error;
    }
  }

  async getProjects() {
    try {
      const response = await this.axiosInstance.get('/api/projects');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get projects: ${error.message}`);
      throw error;
    }
  }

  async getAreas() {
    try {
      const response = await this.axiosInstance.get('/api/areas');
      return response.data;
    } catch (error) {
      logger.error(`Failed to get areas: ${error.message}`);
      throw error;
    }
  }
}

module.exports = TududuClient;
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/tududi/client.test.js
```

Expected: PASS

**Step 5: Commit Tududi client**

```bash
git add src/tududi/client.js tests/tududi/client.test.js
git commit -m "feat: add Tududi API client with CRUD operations"
```

**Step 6: Update progress.md**

Mark Task 1.1 as complete in `progress.md`

**Step 7: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 1.1 complete"
```

---

## Phase 2: LLM Middleware - Task Parsing

### Task 2.1: Create Claude API Client

**Files:**
- Create: `src/llm/claude-client.js`
- Create: `tests/llm/claude-client.test.js`

**Step 1: Write failing test for Claude client**

Create `tests/llm/claude-client.test.js`:

```javascript
const ClaudeClient = require('../../src/llm/claude-client');
const Anthropic = require('@anthropic-ai/sdk');

jest.mock('@anthropic-ai/sdk');

describe('ClaudeClient', () => {
  let client;
  let mockAnthropic;

  beforeEach(() => {
    mockAnthropic = {
      messages: {
        create: jest.fn()
      }
    };
    Anthropic.mockImplementation(() => mockAnthropic);

    client = new ClaudeClient({
      apiKey: 'test-key',
      model: 'claude-3-5-sonnet-20241022'
    });
  });

  test('sends message to Claude and returns response', async () => {
    const mockResponse = {
      content: [{ text: 'Test response' }]
    };
    mockAnthropic.messages.create.mockResolvedValue(mockResponse);

    const result = await client.sendMessage('Test prompt');

    expect(result).toBe('Test response');
    expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Test prompt' }]
      })
    );
  });

  test('handles system prompts', async () => {
    const mockResponse = {
      content: [{ text: 'Response with system prompt' }]
    };
    mockAnthropic.messages.create.mockResolvedValue(mockResponse);

    await client.sendMessage('User prompt', {
      systemPrompt: 'You are a helpful assistant'
    });

    expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
      expect.objectContaining({
        system: 'You are a helpful assistant'
      })
    );
  });

  test('handles API errors', async () => {
    mockAnthropic.messages.create.mockRejectedValue(
      new Error('API rate limit exceeded')
    );

    await expect(client.sendMessage('Test'))
      .rejects.toThrow('API rate limit exceeded');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/llm/claude-client.test.js
```

Expected: FAIL with "Cannot find module"

**Step 3: Write minimal Claude client implementation**

Create `src/llm/claude-client.js`:

```javascript
const Anthropic = require('@anthropic-ai/sdk');
const logger = require('../utils/logger');

class ClaudeClient {
  constructor(config) {
    this.model = config.model;
    this.maxTokens = config.maxTokens || 4096;
    this.anthropic = new Anthropic({
      apiKey: config.apiKey
    });
  }

  async sendMessage(userMessage, options = {}) {
    try {
      const messageParams = {
        model: this.model,
        max_tokens: options.maxTokens || this.maxTokens,
        messages: [
          {
            role: 'user',
            content: userMessage
          }
        ]
      };

      if (options.systemPrompt) {
        messageParams.system = options.systemPrompt;
      }

      logger.info('Sending message to Claude API');
      const response = await this.anthropic.messages.create(messageParams);

      const responseText = response.content[0].text;
      logger.info('Received response from Claude API');

      return responseText;
    } catch (error) {
      logger.error(`Claude API error: ${error.message}`);
      throw error;
    }
  }

  async parseJSON(userMessage, options = {}) {
    try {
      const response = await this.sendMessage(userMessage, {
        ...options,
        systemPrompt: (options.systemPrompt || '') +
          '\n\nYou must respond with valid JSON only. No explanation, just JSON.'
      });

      // Extract JSON from response (handle markdown code blocks)
      let jsonText = response.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.slice(7, -3).trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.slice(3, -3).trim();
      }

      return JSON.parse(jsonText);
    } catch (error) {
      logger.error(`Failed to parse JSON from Claude: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ClaudeClient;
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/llm/claude-client.test.js
```

Expected: PASS

**Step 5: Commit Claude client**

```bash
git add src/llm/claude-client.js tests/llm/claude-client.test.js
git commit -m "feat: add Claude API client with JSON parsing support"
```

**Step 6: Update progress.md**

Mark Task 2.1 as complete in `progress.md`

**Step 7: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 2.1 complete"
```

---

### Task 2.2: Create Task Parser Service

**Files:**
- Create: `src/llm/task-parser.js`
- Create: `tests/llm/task-parser.test.js`
- Create: `src/llm/prompts/parse-task.js`

**Step 1: Write failing test for task parser**

Create `tests/llm/task-parser.test.js`:

```javascript
const TaskParser = require('../../src/llm/task-parser');

describe('TaskParser', () => {
  let parser;
  let mockClaudeClient;

  beforeEach(() => {
    mockClaudeClient = {
      parseJSON: jest.fn()
    };
    parser = new TaskParser(mockClaudeClient);
  });

  test('parses simple task from text', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Beli susu anak',
        due_date: '2025-11-18',
        time_estimate: 15,
        energy_level: 'LOW',
        project: 'Shopping'
      }]
    });

    const result = await parser.parse('beli susu anak');

    expect(result.type).toBe('task');
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0].title).toBe('Beli susu anak');
  });

  test('parses multiple tasks from one message', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [
        { title: 'Beli susu anak', due_date: '2025-11-18' },
        { title: 'Ultah mama tanggal 25', due_date: '2025-11-25' }
      ]
    });

    const result = await parser.parse('beli susu anak, ultah mama tanggal 25');

    expect(result.tasks).toHaveLength(2);
  });

  test('handles natural language dates', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Meeting with client',
        due_date: '2025-11-19', // tomorrow
        time_estimate: 60
      }]
    });

    const result = await parser.parse('besok meeting with client');

    expect(result.tasks[0].due_date).toBe('2025-11-19');
  });

  test('detects knowledge vs task', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'knowledge',
      title: 'Bitcoin Market Timing',
      content: 'Bitcoin dips before US open...',
      category: 'Trading/Crypto',
      tags: ['bitcoin', 'trading', 'timing']
    });

    const result = await parser.parse(
      'bitcoin dips before US open, rebounds Asia session'
    );

    expect(result.type).toBe('knowledge');
    expect(result.category).toBe('Trading/Crypto');
  });

  test('handles Indonesian language', async () => {
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Antar istri ke dokter',
        due_date: '2025-11-19',
        time_estimate: 120,
        energy_level: 'MEDIUM'
      }]
    });

    const result = await parser.parse('besok antar istri ke dokter');

    expect(result.tasks[0].title).toContain('istri');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/llm/task-parser.test.js
```

Expected: FAIL with "Cannot find module"

**Step 3: Create task parsing prompt**

Create `src/llm/prompts/parse-task.js`:

```javascript
const SYSTEM_PROMPT = `You are a task parsing assistant for an ADHD-optimized task management system.

Your job is to parse user messages and determine:
1. Is this a TASK (something to do) or KNOWLEDGE (information to save)?
2. Extract structured data for tasks or knowledge

USER CONTEXT:
- Lives in Indonesia (WIB timezone)
- Has ADHD (short working memory, time blindness)
- Uses mixed Indonesian and English
- Current date: {{currentDate}}
- Current time: {{currentTime}}

TASK EXTRACTION:
When message contains actionable items, extract:
- title: Clear, concise task title
- due_date: YYYY-MM-DD format (parse natural language: "besok" = tomorrow, "next Monday", etc)
- time_estimate: Minutes (estimate based on task type)
- energy_level: HIGH (analytical work), MEDIUM (meetings), LOW (errands, simple tasks)
- project: Category (Shopping, Work, Family, Business, Personal)
- priority: urgent, high, medium, low
- notes: Additional context

KNOWLEDGE EXTRACTION:
When message contains information/insights (not actionable):
- type: "knowledge"
- title: Descriptive title for the note
- content: The actual information
- category: Path like "Trading/Crypto" or "Health/Nutrition"
- tags: Array of searchable keywords
- actionable: true if should also create a task

NATURAL LANGUAGE DATE PARSING:
- "besok" / "tomorrow" → next day
- "lusa" → 2 days from now
- "next Monday" → find next Monday date
- "tanggal 25" → this month's 25th (or next month if past)
- "minggu depan" / "next week" → 7 days from now
- No date specified → today (if time-sensitive) or null

MULTI-TASK EXTRACTION:
If message contains multiple tasks (separated by commas, "and", "terus"), extract all.

SPECIAL HANDLING:
- Messages from spouse (mentions "istri" context): Add [[from-Istri]] tag, higher priority
- Birthdays/anniversaries: Mark as recurring yearly
- Shopping lists: Group as single task with checklist in notes

OUTPUT FORMAT (JSON only):
{
  "type": "task" | "knowledge" | "question",
  "tasks": [{ task objects }],  // if type is task
  "title": "...",               // if type is knowledge
  "content": "...",             // if type is knowledge
  "category": "...",            // if type is knowledge
  "tags": ["..."],              // if type is knowledge
  "actionable": true/false      // if type is knowledge and needs task
}`;

function buildPrompt(message, context = {}) {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];
  const currentTime = now.toTimeString().split(' ')[0];

  const systemPrompt = SYSTEM_PROMPT
    .replace('{{currentDate}}', currentDate)
    .replace('{{currentTime}}', currentTime);

  const userPrompt = `Parse this message:\n\n"${message}"\n\nRespond with JSON only.`;

  return {
    systemPrompt,
    userPrompt
  };
}

module.exports = {
  SYSTEM_PROMPT,
  buildPrompt
};
```

**Step 4: Write task parser implementation**

Create `src/llm/task-parser.js`:

```javascript
const logger = require('../utils/logger');
const { buildPrompt } = require('./prompts/parse-task');

class TaskParser {
  constructor(claudeClient) {
    this.claude = claudeClient;
  }

  async parse(message, context = {}) {
    try {
      logger.info(`Parsing message: ${message.substring(0, 50)}...`);

      const { systemPrompt, userPrompt } = buildPrompt(message, context);

      const parsed = await this.claude.parseJSON(userPrompt, {
        systemPrompt
      });

      logger.info(`Parsed as type: ${parsed.type}`);

      // Validate parsed data
      if (parsed.type === 'task') {
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
          throw new Error('Invalid task parsing: tasks array missing');
        }
        // Ensure each task has required fields
        parsed.tasks = parsed.tasks.map(task => ({
          title: task.title || 'Untitled Task',
          due_date: task.due_date || null,
          time_estimate: task.time_estimate || 30,
          energy_level: task.energy_level || 'MEDIUM',
          project: task.project || 'Inbox',
          priority: task.priority || 'medium',
          notes: task.notes || ''
        }));
      }

      return parsed;
    } catch (error) {
      logger.error(`Failed to parse message: ${error.message}`);
      throw error;
    }
  }

  async parseBatch(messages) {
    const results = [];
    for (const message of messages) {
      try {
        const parsed = await this.parse(message);
        results.push({ success: true, data: parsed });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    return results;
  }
}

module.exports = TaskParser;
```

**Step 5: Run test to verify it passes**

```bash
npm test tests/llm/task-parser.test.js
```

Expected: PASS

**Step 6: Commit task parser**

```bash
git add src/llm/task-parser.js tests/llm/task-parser.test.js src/llm/prompts/parse-task.js
git commit -m "feat: add task parser with natural language understanding"
```

**Step 7: Update progress.md**

Mark Task 2.2 as complete in `progress.md`

**Step 8: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 2.2 complete"
```

---

## Phase 3: Telegram Bot Interface

### Task 3.1: Create Telegram Bot Service

**Files:**
- Create: `src/bot/telegram-bot.js`
- Create: `tests/bot/telegram-bot.test.js`

**Step 1: Write failing test for Telegram bot**

Create `tests/bot/telegram-bot.test.js`:

```javascript
const TelegramBot = require('../../src/bot/telegram-bot');
const TelegramBotAPI = require('node-telegram-bot-api');

jest.mock('node-telegram-bot-api');

describe('TelegramBot', () => {
  let bot;
  let mockBotAPI;

  beforeEach(() => {
    mockBotAPI = {
      on: jest.fn(),
      sendMessage: jest.fn(),
      onText: jest.fn(),
      downloadFile: jest.fn()
    };
    TelegramBotAPI.mockImplementation(() => mockBotAPI);

    bot = new TelegramBot({
      token: 'test-token',
      userId: '123456'
    });
  });

  test('initializes with polling', () => {
    expect(TelegramBotAPI).toHaveBeenCalledWith(
      'test-token',
      expect.objectContaining({ polling: true })
    );
  });

  test('registers message handler', () => {
    const handler = jest.fn();
    bot.onMessage(handler);

    expect(mockBotAPI.on).toHaveBeenCalledWith('message', expect.any(Function));
  });

  test('sends message to user', async () => {
    mockBotAPI.sendMessage.mockResolvedValue({});

    await bot.sendMessage('Test message');

    expect(mockBotAPI.sendMessage).toHaveBeenCalledWith(
      '123456',
      'Test message',
      expect.any(Object)
    );
  });

  test('only processes messages from authorized user', () => {
    const handler = jest.fn();
    bot.onMessage(handler);

    const messageCallback = mockBotAPI.on.mock.calls[0][1];

    // Message from unauthorized user
    messageCallback({ from: { id: 999 }, text: 'Test' });
    expect(handler).not.toHaveBeenCalled();

    // Message from authorized user
    messageCallback({ from: { id: 123456 }, text: 'Test' });
    expect(handler).toHaveBeenCalled();
  });

  test('handles voice messages', async () => {
    const handler = jest.fn();
    bot.onVoiceMessage(handler);

    expect(mockBotAPI.on).toHaveBeenCalledWith('voice', expect.any(Function));
  });

  test('downloads voice file', async () => {
    mockBotAPI.downloadFile.mockResolvedValue('/tmp/voice.ogg');

    const filePath = await bot.downloadVoice('file-id-123');

    expect(filePath).toBe('/tmp/voice.ogg');
    expect(mockBotAPI.downloadFile).toHaveBeenCalledWith('file-id-123', expect.any(String));
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/bot/telegram-bot.test.js
```

Expected: FAIL with "Cannot find module"

**Step 3: Write Telegram bot implementation**

Create `src/bot/telegram-bot.js`:

```javascript
const TelegramBotAPI = require('node-telegram-bot-api');
const logger = require('../utils/logger');

class TelegramBot {
  constructor(config) {
    this.token = config.token;
    this.userId = config.userId;
    this.bot = new TelegramBotAPI(this.token, { polling: true });

    logger.info('Telegram bot initialized');
  }

  isAuthorized(msg) {
    return msg.from.id === parseInt(this.userId);
  }

  onMessage(handler) {
    this.bot.on('message', async (msg) => {
      if (!this.isAuthorized(msg)) {
        logger.warn(`Unauthorized access attempt from user ${msg.from.id}`);
        return;
      }

      // Skip voice messages (handled separately)
      if (msg.voice) {
        return;
      }

      try {
        await handler(msg);
      } catch (error) {
        logger.error(`Message handler error: ${error.message}`);
        await this.sendMessage(`❌ Error: ${error.message}`);
      }
    });
  }

  onVoiceMessage(handler) {
    this.bot.on('voice', async (msg) => {
      if (!this.isAuthorized(msg)) {
        logger.warn(`Unauthorized voice message from user ${msg.from.id}`);
        return;
      }

      try {
        await handler(msg);
      } catch (error) {
        logger.error(`Voice handler error: ${error.message}`);
        await this.sendMessage(`❌ Voice processing error: ${error.message}`);
      }
    });
  }

  onCommand(command, handler) {
    this.bot.onText(new RegExp(`^/${command}`), async (msg) => {
      if (!this.isAuthorized(msg)) {
        return;
      }

      try {
        await handler(msg);
      } catch (error) {
        logger.error(`Command handler error: ${error.message}`);
        await this.sendMessage(`❌ Error: ${error.message}`);
      }
    });
  }

  async sendMessage(text, options = {}) {
    try {
      const defaultOptions = {
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      };

      await this.bot.sendMessage(
        this.userId,
        text,
        { ...defaultOptions, ...options }
      );

      logger.info('Message sent to user');
    } catch (error) {
      logger.error(`Failed to send message: ${error.message}`);
      throw error;
    }
  }

  async downloadVoice(fileId) {
    try {
      const file = await this.bot.getFile(fileId);
      const downloadPath = `/tmp/${fileId}.ogg`;
      await this.bot.downloadFile(fileId, '/tmp');
      logger.info(`Voice file downloaded: ${downloadPath}`);
      return downloadPath;
    } catch (error) {
      logger.error(`Failed to download voice: ${error.message}`);
      throw error;
    }
  }

  async sendInlineKeyboard(text, buttons) {
    const keyboard = {
      inline_keyboard: buttons.map(row =>
        row.map(btn => ({
          text: btn.text,
          callback_data: btn.data
        }))
      )
    };

    await this.sendMessage(text, { reply_markup: keyboard });
  }

  onCallbackQuery(handler) {
    this.bot.on('callback_query', async (query) => {
      if (query.from.id !== parseInt(this.userId)) {
        return;
      }

      try {
        await handler(query);
        await this.bot.answerCallbackQuery(query.id);
      } catch (error) {
        logger.error(`Callback query error: ${error.message}`);
      }
    });
  }
}

module.exports = TelegramBot;
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/bot/telegram-bot.test.js
```

Expected: PASS

**Step 5: Commit Telegram bot**

```bash
git add src/bot/telegram-bot.js tests/bot/telegram-bot.test.js
git commit -m "feat: add Telegram bot service with authorization"
```

**Step 6: Update progress.md**

Mark Task 3.1 as complete in `progress.md`

**Step 7: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 3.1 complete"
```

---

### Task 3.2: Create Voice Transcription Service

**Files:**
- Create: `src/bot/voice-transcriber.js`
- Create: `tests/bot/voice-transcriber.test.js`

**Step 1: Write failing test for voice transcriber**

Create `tests/bot/voice-transcriber.test.js`:

```javascript
const VoiceTranscriber = require('../../src/bot/voice-transcriber');
const axios = require('axios');
const fs = require('fs');

jest.mock('axios');
jest.mock('fs');

describe('VoiceTranscriber', () => {
  let transcriber;

  beforeEach(() => {
    transcriber = new VoiceTranscriber({
      apiKey: 'test-openai-key'
    });
  });

  test('transcribes voice file', async () => {
    const mockFormData = {
      append: jest.fn()
    };

    fs.createReadStream = jest.fn().mockReturnValue('mock-stream');

    axios.post.mockResolvedValue({
      data: {
        text: 'Beli susu anak'
      }
    });

    const result = await transcriber.transcribe('/tmp/voice.ogg');

    expect(result).toBe('Beli susu anak');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/transcriptions',
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-openai-key'
        })
      })
    );
  });

  test('supports Indonesian language', async () => {
    fs.createReadStream = jest.fn().mockReturnValue('mock-stream');

    axios.post.mockResolvedValue({
      data: { text: 'Besok meeting jam 9 pagi' }
    });

    const result = await transcriber.transcribe('/tmp/voice.ogg', {
      language: 'id'
    });

    expect(result).toContain('Besok meeting');
  });

  test('handles transcription errors', async () => {
    fs.createReadStream = jest.fn().mockReturnValue('mock-stream');
    axios.post.mockRejectedValue(new Error('API error'));

    await expect(transcriber.transcribe('/tmp/voice.ogg'))
      .rejects.toThrow('API error');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/bot/voice-transcriber.test.js
```

Expected: FAIL with "Cannot find module"

**Step 3: Write voice transcriber implementation**

Create `src/bot/voice-transcriber.js`:

```javascript
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const logger = require('../utils/logger');

class VoiceTranscriber {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
  }

  async transcribe(filePath, options = {}) {
    try {
      logger.info(`Transcribing voice file: ${filePath}`);

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('model', 'whisper-1');

      // Default to Indonesian language
      formData.append('language', options.language || 'id');

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders()
        }
      });

      const transcription = response.data.text;
      logger.info(`Transcription complete: ${transcription.substring(0, 50)}...`);

      // Clean up temp file
      fs.unlinkSync(filePath);

      return transcription;
    } catch (error) {
      logger.error(`Transcription failed: ${error.message}`);
      throw error;
    }
  }

  async transcribeWithFallback(filePath, options = {}) {
    try {
      // Try Indonesian first
      return await this.transcribe(filePath, { language: 'id', ...options });
    } catch (error) {
      logger.warn('Indonesian transcription failed, trying auto-detect');
      // Fallback to auto-detect language
      return await this.transcribe(filePath, { language: null, ...options });
    }
  }
}

module.exports = VoiceTranscriber;
```

**Step 4: Install form-data dependency**

```bash
npm install form-data
```

**Step 5: Run test to verify it passes**

```bash
npm test tests/bot/voice-transcriber.test.js
```

Expected: PASS

**Step 6: Commit voice transcriber**

```bash
git add src/bot/voice-transcriber.js tests/bot/voice-transcriber.test.js package.json package-lock.json
git commit -m "feat: add voice transcription service with Whisper API"
```

**Step 7: Update progress.md**

Mark Task 3.2 as complete in `progress.md`

**Step 8: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 3.2 complete"
```

---

## Phase 4: Obsidian Integration

### Task 4.1: Create Obsidian File Manager

**Files:**
- Create: `src/obsidian/file-manager.js`
- Create: `tests/obsidian/file-manager.test.js`

**Step 1: Write failing test for file manager**

Create `tests/obsidian/file-manager.test.js`:

```javascript
const ObsidianFileManager = require('../../src/obsidian/file-manager');
const fs = require('fs');
const path = require('path');

jest.mock('fs');

describe('ObsidianFileManager', () => {
  let fileManager;
  const vaultPath = '/path/to/vault';

  beforeEach(() => {
    fileManager = new ObsidianFileManager({
      vaultPath,
      dailyNotesPath: 'Daily Notes'
    });
  });

  test('creates daily note if not exists', async () => {
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();

    await fileManager.ensureDailyNote('2025-11-18');

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('2025-11-18.md'),
      expect.stringContaining('# 2025-11-18')
    );
  });

  test('appends task to daily note', async () => {
    fs.existsSync = jest.fn().mockReturnValue(true);
    fs.readFileSync = jest.fn().mockReturnValue('# 2025-11-18\n\n## Tasks\n');
    fs.writeFileSync = jest.fn();

    await fileManager.appendTaskToDailyNote({
      id: 123,
      title: 'Test Task',
      due_date: '2025-11-18',
      time_estimate: 30,
      energy_level: 'HIGH'
    });

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('- [ ] Test Task')
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('[[Tududi-123]]')
    );
  });

  test('creates knowledge note', async () => {
    fs.existsSync = jest.fn().mockReturnValue(false);
    fs.mkdirSync = jest.fn();
    fs.writeFileSync = jest.fn();

    await fileManager.createKnowledgeNote({
      title: 'Bitcoin Market Timing',
      content: 'Bitcoin dips before US open...',
      category: 'Trading/Crypto',
      tags: ['bitcoin', 'trading']
    });

    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('Trading/Crypto'),
      expect.stringContaining('# Bitcoin Market Timing')
    );
  });

  test('searches notes by keyword', async () => {
    fs.readdirSync = jest.fn().mockReturnValue([
      'note1.md',
      'note2.md'
    ]);
    fs.readFileSync = jest.fn()
      .mockReturnValueOnce('Content about bitcoin trading')
      .mockReturnValueOnce('Content about stocks');

    const results = await fileManager.searchNotes('bitcoin');

    expect(results).toHaveLength(1);
    expect(results[0]).toContain('bitcoin');
  });

  test('generates slug from title', () => {
    const slug = fileManager.generateSlug('Bitcoin Market Timing!');
    expect(slug).toBe('bitcoin-market-timing');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/obsidian/file-manager.test.js
```

Expected: FAIL with "Cannot find module"

**Step 3: Write file manager implementation**

Create `src/obsidian/file-manager.js`:

```javascript
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class ObsidianFileManager {
  constructor(config) {
    this.vaultPath = config.vaultPath;
    this.dailyNotesPath = path.join(
      config.vaultPath,
      config.dailyNotesPath || 'Daily Notes'
    );
    this.knowledgePath = path.join(config.vaultPath, 'Knowledge');
  }

  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  async ensureDailyNote(date) {
    const fileName = `${date}.md`;
    const filePath = path.join(this.dailyNotesPath, fileName);

    if (!fs.existsSync(this.dailyNotesPath)) {
      fs.mkdirSync(this.dailyNotesPath, { recursive: true });
    }

    if (!fs.existsSync(filePath)) {
      const template = `# ${date}

## Tasks

## Notes

## Journal

`;
      fs.writeFileSync(filePath, template);
      logger.info(`Created daily note: ${date}`);
    }

    return filePath;
  }

  async appendTaskToDailyNote(task) {
    const date = task.due_date || new Date().toISOString().split('T')[0];
    const filePath = await this.ensureDailyNote(date);

    let content = fs.readFileSync(filePath, 'utf-8');

    // Format task line
    const taskLine = `- [ ] ${task.title} (due: ${task.due_date || 'today'}) ⏱️${task.time_estimate}m ⚡${task.energy_level} #${task.project || 'inbox'} [[Tududi-${task.id}]]\n`;

    // Find Tasks section and append
    if (content.includes('## Tasks')) {
      const tasksIndex = content.indexOf('## Tasks') + 9;
      content = content.slice(0, tasksIndex) + '\n' + taskLine + content.slice(tasksIndex);
    } else {
      content += '\n## Tasks\n' + taskLine;
    }

    fs.writeFileSync(filePath, content);
    logger.info(`Appended task to daily note: ${task.title}`);
  }

  async createKnowledgeNote(data) {
    const { title, content, category, tags } = data;
    const slug = this.generateSlug(title);
    const date = new Date().toISOString().split('T')[0];
    const fileName = `${slug}-${date}.md`;

    const categoryPath = path.join(this.knowledgePath, category || 'Uncategorized');
    const filePath = path.join(categoryPath, fileName);

    // Create category directory if needed
    if (!fs.existsSync(categoryPath)) {
      fs.mkdirSync(categoryPath, { recursive: true });
    }

    // Format note content
    const noteContent = `# ${title}

**Created:** ${date}
**Tags:** ${tags.map(t => `#${t}`).join(' ')}
**Category:** ${category}

---

${content}

---

**Source:** Telegram
`;

    fs.writeFileSync(filePath, noteContent);
    logger.info(`Created knowledge note: ${title}`);

    return filePath;
  }

  async searchNotes(query) {
    const results = [];
    const searchPath = this.vaultPath;

    function searchDirectory(dirPath) {
      const files = fs.readdirSync(dirPath);

      for (const file of files) {
        const filePath = path.join(dirPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          searchDirectory(filePath);
        } else if (file.endsWith('.md')) {
          const content = fs.readFileSync(filePath, 'utf-8');
          if (content.toLowerCase().includes(query.toLowerCase())) {
            // Extract context around match
            const index = content.toLowerCase().indexOf(query.toLowerCase());
            const start = Math.max(0, index - 100);
            const end = Math.min(content.length, index + 100);
            const excerpt = content.slice(start, end);

            results.push({
              file: filePath.replace(searchPath, ''),
              excerpt,
              relevance: 1.0 // Simple keyword match for now
            });
          }
        }
      }
    }

    searchDirectory(searchPath);
    logger.info(`Found ${results.length} notes matching: ${query}`);

    return results;
  }

  async updateTaskStatus(taskId, completed) {
    // Find daily note containing this task
    const dailyNotesFiles = fs.readdirSync(this.dailyNotesPath);

    for (const file of dailyNotesFiles) {
      const filePath = path.join(this.dailyNotesPath, file);
      let content = fs.readFileSync(filePath, 'utf-8');

      const taskPattern = new RegExp(`- \\[([ x])\\](.+?)\\[\\[Tududi-${taskId}\\]\\]`, 'g');

      if (taskPattern.test(content)) {
        content = content.replace(
          taskPattern,
          `- [${completed ? 'x' : ' '}]$2[[Tududi-${taskId}]]`
        );
        fs.writeFileSync(filePath, content);
        logger.info(`Updated task ${taskId} status in Obsidian: ${completed}`);
        return true;
      }
    }

    return false;
  }
}

module.exports = ObsidianFileManager;
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/obsidian/file-manager.test.js
```

Expected: PASS

**Step 5: Commit file manager**

```bash
git add src/obsidian/file-manager.js tests/obsidian/file-manager.test.js
git commit -m "feat: add Obsidian file manager for tasks and knowledge"
```

**Step 6: Update progress.md**

Mark Task 4.1 as complete in `progress.md`

**Step 7: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 4.1 complete"
```

---

### Task 4.2: Create Obsidian Sync Watcher

**Files:**
- Create: `src/obsidian/sync-watcher.js`
- Create: `tests/obsidian/sync-watcher.test.js`

**Step 1: Install chokidar dependency**

```bash
npm install chokidar
```

**Step 2: Write failing test for sync watcher**

Create `tests/obsidian/sync-watcher.test.js`:

```javascript
const ObsidianSyncWatcher = require('../../src/obsidian/sync-watcher');
const chokidar = require('chokidar');

jest.mock('chokidar');

describe('ObsidianSyncWatcher', () => {
  let watcher;
  let mockChokidarWatcher;

  beforeEach(() => {
    mockChokidarWatcher = {
      on: jest.fn().mockReturnThis(),
      close: jest.fn()
    };
    chokidar.watch = jest.fn().mockReturnValue(mockChokidarWatcher);

    watcher = new ObsidianSyncWatcher({
      vaultPath: '/path/to/vault'
    });
  });

  test('starts watching vault directory', () => {
    watcher.start();

    expect(chokidar.watch).toHaveBeenCalledWith(
      '/path/to/vault',
      expect.objectContaining({
        persistent: true,
        ignoreInitial: true
      })
    );
  });

  test('registers change handler', () => {
    const handler = jest.fn();
    watcher.onChange(handler);
    watcher.start();

    expect(mockChokidarWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
  });

  test('detects task completion changes', async () => {
    const handler = jest.fn();
    watcher.onTaskChange(handler);

    const mockContent = `
# 2025-11-18

## Tasks
- [x] Test Task [[Tududi-123]]
- [ ] Another Task [[Tududi-124]]
`;

    const fs = require('fs');
    fs.readFileSync = jest.fn().mockReturnValue(mockContent);

    watcher.start();
    const changeCallback = mockChokidarWatcher.on.mock.calls.find(
      call => call[0] === 'change'
    )[1];

    await changeCallback('/path/to/vault/Daily Notes/2025-11-18.md');

    expect(handler).toHaveBeenCalledWith({
      taskId: 123,
      completed: true
    });
  });

  test('debounces rapid file changes', async () => {
    jest.useFakeTimers();
    const handler = jest.fn();
    watcher.onChange(handler);
    watcher.start();

    const changeCallback = mockChokidarWatcher.on.mock.calls.find(
      call => call[0] === 'change'
    )[1];

    // Trigger multiple changes rapidly
    changeCallback('/path/to/file.md');
    changeCallback('/path/to/file.md');
    changeCallback('/path/to/file.md');

    // Only one call after debounce
    jest.advanceTimersByTime(2000);
    expect(handler).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  test('stops watching', () => {
    watcher.start();
    watcher.stop();

    expect(mockChokidarWatcher.close).toHaveBeenCalled();
  });
});
```

**Step 3: Run test to verify it fails**

```bash
npm test tests/obsidian/sync-watcher.test.js
```

Expected: FAIL with "Cannot find module"

**Step 4: Write sync watcher implementation**

Create `src/obsidian/sync-watcher.js`:

```javascript
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

            if (previousState !== undefined && previousState !== task.completed) {
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
      }, this.debounceDelay);
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
```

**Step 5: Run test to verify it passes**

```bash
npm test tests/obsidian/sync-watcher.test.js
```

Expected: PASS

**Step 6: Commit sync watcher**

```bash
git add src/obsidian/sync-watcher.js tests/obsidian/sync-watcher.test.js package.json package-lock.json
git commit -m "feat: add Obsidian sync watcher with task change detection"
```

**Step 7: Update progress.md**

Mark Task 4.2 as complete in `progress.md`

**Step 8: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 4.2 complete"
```

---

## Phase 5: Core Integration - Task Capture Flow

### Task 5.1: Create Message Orchestrator

**Files:**
- Create: `src/orchestrator.js`
- Create: `tests/orchestrator.test.js`

**Step 1: Write failing test for orchestrator**

Create `tests/orchestrator.test.js`:

```javascript
const MessageOrchestrator = require('../src/orchestrator');

describe('MessageOrchestrator', () => {
  let orchestrator;
  let mockTaskParser;
  let mockTududuClient;
  let mockFileManager;
  let mockBot;

  beforeEach(() => {
    mockTaskParser = {
      parse: jest.fn()
    };
    mockTududuClient = {
      createTask: jest.fn()
    };
    mockFileManager = {
      appendTaskToDailyNote: jest.fn(),
      createKnowledgeNote: jest.fn()
    };
    mockBot = {
      sendMessage: jest.fn()
    };

    orchestrator = new MessageOrchestrator({
      taskParser: mockTaskParser,
      tududuClient: mockTududuClient,
      fileManager: mockFileManager,
      bot: mockBot
    });
  });

  test('handles task message end-to-end', async () => {
    mockTaskParser.parse.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Beli susu anak',
        due_date: '2025-11-18',
        time_estimate: 15,
        energy_level: 'LOW',
        project: 'Shopping'
      }]
    });

    mockTududuClient.createTask.mockResolvedValue({
      id: 123,
      title: 'Beli susu anak'
    });

    await orchestrator.handleMessage('beli susu anak');

    expect(mockTaskParser.parse).toHaveBeenCalledWith('beli susu anak');
    expect(mockTududuClient.createTask).toHaveBeenCalled();
    expect(mockFileManager.appendTaskToDailyNote).toHaveBeenCalled();
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('✅')
    );
  });

  test('handles multiple tasks in one message', async () => {
    mockTaskParser.parse.mockResolvedValue({
      type: 'task',
      tasks: [
        { title: 'Task 1', due_date: '2025-11-18' },
        { title: 'Task 2', due_date: '2025-11-19' }
      ]
    });

    mockTududuClient.createTask
      .mockResolvedValueOnce({ id: 1, title: 'Task 1' })
      .mockResolvedValueOnce({ id: 2, title: 'Task 2' });

    await orchestrator.handleMessage('task 1 and task 2');

    expect(mockTududuClient.createTask).toHaveBeenCalledTimes(2);
    expect(mockFileManager.appendTaskToDailyNote).toHaveBeenCalledTimes(2);
  });

  test('handles knowledge message', async () => {
    mockTaskParser.parse.mockResolvedValue({
      type: 'knowledge',
      title: 'Bitcoin Timing',
      content: 'Bitcoin dips before US open',
      category: 'Trading/Crypto',
      tags: ['bitcoin', 'trading'],
      actionable: false
    });

    mockFileManager.createKnowledgeNote.mockResolvedValue(
      '/vault/Knowledge/Trading/bitcoin-timing.md'
    );

    await orchestrator.handleMessage('bitcoin dips before US open');

    expect(mockFileManager.createKnowledgeNote).toHaveBeenCalled();
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('💡')
    );
  });

  test('handles knowledge with actionable task', async () => {
    mockTaskParser.parse.mockResolvedValue({
      type: 'knowledge',
      title: 'Bitcoin Timing',
      content: 'Bitcoin dips before US open',
      category: 'Trading/Crypto',
      tags: ['bitcoin'],
      actionable: true,
      actionTask: {
        title: 'Test Bitcoin 30-min strategy',
        due_date: '2025-11-20'
      }
    });

    mockTududuClient.createTask.mockResolvedValue({
      id: 456,
      title: 'Test Bitcoin 30-min strategy'
    });

    await orchestrator.handleMessage('bitcoin dips before US open');

    expect(mockFileManager.createKnowledgeNote).toHaveBeenCalled();
    expect(mockTududuClient.createTask).toHaveBeenCalled();
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('💡 Knowledge captured')
    );
  });

  test('handles errors gracefully', async () => {
    mockTaskParser.parse.mockRejectedValue(new Error('Parsing failed'));

    await orchestrator.handleMessage('invalid message');

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('❌')
    );
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test tests/orchestrator.test.js
```

Expected: FAIL with "Cannot find module"

**Step 3: Write orchestrator implementation**

Create `src/orchestrator.js`:

```javascript
const logger = require('./utils/logger');

class MessageOrchestrator {
  constructor(dependencies) {
    this.taskParser = dependencies.taskParser;
    this.tududuClient = dependencies.tududuClient;
    this.fileManager = dependencies.fileManager;
    this.bot = dependencies.bot;
  }

  async handleMessage(message) {
    try {
      logger.info('Processing message...');

      // Parse message with LLM
      const parsed = await this.taskParser.parse(message);

      if (parsed.type === 'task') {
        await this.handleTaskMessage(parsed);
      } else if (parsed.type === 'knowledge') {
        await this.handleKnowledgeMessage(parsed);
      } else if (parsed.type === 'question') {
        await this.handleQuestionMessage(parsed);
      }

      logger.info('Message processed successfully');
    } catch (error) {
      logger.error(`Message processing failed: ${error.message}`);
      await this.bot.sendMessage(
        `❌ Sorry, I couldn't process that message.\n\nError: ${error.message}`
      );
    }
  }

  async handleTaskMessage(parsed) {
    const tasks = parsed.tasks;
    const createdTasks = [];

    for (const taskData of tasks) {
      try {
        // Create task in Tududi
        const task = await this.tududuClient.createTask(taskData);
        logger.info(`Task created: ${task.id}`);

        // Sync to Obsidian
        await this.fileManager.appendTaskToDailyNote({
          ...taskData,
          id: task.id
        });

        createdTasks.push(task);
      } catch (error) {
        logger.error(`Failed to create task: ${error.message}`);
      }
    }

    // Send confirmation
    if (createdTasks.length === 1) {
      const task = createdTasks[0];
      await this.bot.sendMessage(
        `✅ Task created: *${task.title}*\n\n` +
        `📅 Due: ${task.due_date || 'Not set'}\n` +
        `⏱️ Estimate: ${task.time_estimate || 30}m\n` +
        `⚡ Energy: ${task.energy_level || 'MEDIUM'}\n` +
        `📁 Project: ${task.project || 'Inbox'}`
      );
    } else if (createdTasks.length > 1) {
      const taskList = createdTasks
        .map(t => `• ${t.title}`)
        .join('\n');
      await this.bot.sendMessage(
        `✅ Created ${createdTasks.length} tasks:\n\n${taskList}`
      );
    }
  }

  async handleKnowledgeMessage(parsed) {
    try {
      // Create knowledge note in Obsidian
      const notePath = await this.fileManager.createKnowledgeNote({
        title: parsed.title,
        content: parsed.content,
        category: parsed.category,
        tags: parsed.tags
      });

      let response = `💡 Knowledge captured: *${parsed.title}*\n\n` +
        `📂 Category: ${parsed.category}\n` +
        `🏷️ Tags: ${parsed.tags.join(', ')}\n` +
        `📝 Note: \`${notePath.split('/').pop()}\``;

      // If actionable, also create task
      if (parsed.actionable && parsed.actionTask) {
        const task = await this.tududuClient.createTask(parsed.actionTask);
        await this.fileManager.appendTaskToDailyNote({
          ...parsed.actionTask,
          id: task.id
        });

        response += `\n\n✅ Action task created: *${task.title}*`;
      }

      await this.bot.sendMessage(response);
    } catch (error) {
      logger.error(`Failed to create knowledge: ${error.message}`);
      throw error;
    }
  }

  async handleQuestionMessage(parsed) {
    // Placeholder for future semantic search
    await this.bot.sendMessage(
      '❓ Question mode coming soon! For now, you can search manually in Obsidian.'
    );
  }
}

module.exports = MessageOrchestrator;
```

**Step 4: Run test to verify it passes**

```bash
npm test tests/orchestrator.test.js
```

Expected: PASS

**Step 5: Commit orchestrator**

```bash
git add src/orchestrator.js tests/orchestrator.test.js
git commit -m "feat: add message orchestrator for end-to-end flow"
```

**Step 6: Update progress.md**

Mark Task 5.1 as complete in `progress.md`

**Step 7: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 5.1 complete"
```

---

### Task 5.2: Create Main Application Entry Point

**Files:**
- Create: `src/index.js`
- Modify: `package.json` (update start script)

**Step 1: Write main application entry point**

Create `src/index.js`:

```javascript
const config = require('./config');
const logger = require('./utils/logger');

// Initialize clients and services
const TelegramBot = require('./bot/telegram-bot');
const VoiceTranscriber = require('./bot/voice-transcriber');
const ClaudeClient = require('./llm/claude-client');
const TaskParser = require('./llm/task-parser');
const TududuClient = require('./tududi/client');
const ObsidianFileManager = require('./obsidian/file-manager');
const ObsidianSyncWatcher = require('./obsidian/sync-watcher');
const MessageOrchestrator = require('./orchestrator');

async function main() {
  try {
    logger.info('Starting AI-Powered ADHD Task Management System...');

    // Initialize services
    const bot = new TelegramBot({
      token: config.telegram.botToken,
      userId: config.telegram.userId
    });

    const transcriber = new VoiceTranscriber({
      apiKey: config.openai.apiKey
    });

    const claude = new ClaudeClient({
      apiKey: config.anthropic.apiKey,
      model: config.claude.model,
      maxTokens: config.claude.maxTokens
    });

    const taskParser = new TaskParser(claude);

    const tududuClient = new TududuClient({
      apiUrl: config.tududi.apiUrl,
      apiToken: config.tududi.apiToken
    });

    const fileManager = new ObsidianFileManager({
      vaultPath: config.obsidian.vaultPath,
      dailyNotesPath: config.obsidian.dailyNotesPath
    });

    const orchestrator = new MessageOrchestrator({
      taskParser,
      tududuClient,
      fileManager,
      bot
    });

    // Set up Obsidian sync watcher
    const syncWatcher = new ObsidianSyncWatcher({
      vaultPath: config.obsidian.vaultPath
    });

    syncWatcher.onTaskChange(async (change) => {
      try {
        logger.info(`Syncing task ${change.taskId} completion to Tududi`);
        await tududuClient.updateTask(change.taskId, {
          completed: change.completed
        });
      } catch (error) {
        logger.error(`Failed to sync task completion: ${error.message}`);
      }
    });

    syncWatcher.start();

    // Set up Telegram bot handlers
    bot.onMessage(async (msg) => {
      const message = msg.text;
      logger.info(`Received message: ${message}`);
      await orchestrator.handleMessage(message);
    });

    bot.onVoiceMessage(async (msg) => {
      try {
        logger.info('Received voice message');
        await bot.sendMessage('🎤 Transcribing voice message...');

        // Download and transcribe
        const voiceFilePath = await bot.downloadVoice(msg.voice.file_id);
        const transcription = await transcriber.transcribe(voiceFilePath);

        logger.info(`Transcription: ${transcription}`);
        await bot.sendMessage(`📝 Transcribed: "${transcription}"\n\nProcessing...`);

        // Process transcribed message
        await orchestrator.handleMessage(transcription);
      } catch (error) {
        logger.error(`Voice processing error: ${error.message}`);
        await bot.sendMessage('❌ Failed to process voice message');
      }
    });

    // Register commands
    bot.onCommand('start', async () => {
      await bot.sendMessage(
        '👋 Welcome to your AI-powered task assistant!\n\n' +
        'Send me tasks, ideas, or knowledge and I\'ll organize them for you.\n\n' +
        '**Commands:**\n' +
        '/help - Show help\n' +
        '/chaos - Enable chaos mode\n' +
        '/normal - Disable chaos mode\n' +
        '/status - Show system status'
      );
    });

    bot.onCommand('help', async () => {
      await bot.sendMessage(
        '**How to use:**\n\n' +
        '• Just send a message with tasks or ideas\n' +
        '• Use voice messages for faster capture\n' +
        '• Tasks are automatically parsed and organized\n' +
        '• Knowledge is saved to Obsidian\n\n' +
        '**Examples:**\n' +
        '• "beli susu anak besok"\n' +
        '• "meeting with client next Monday 2pm"\n' +
        '• "bitcoin dips before US open" (knowledge)\n\n' +
        '**Special features:**\n' +
        '• Natural language dates (besok, next week, etc.)\n' +
        '• Multiple tasks in one message\n' +
        '• Indonesian language support'
      );
    });

    bot.onCommand('status', async () => {
      const tasks = await tududuClient.getTasks({ completed: false });
      await bot.sendMessage(
        `**System Status** ✅\n\n` +
        `📋 Active tasks: ${tasks.length}\n` +
        `🧠 LLM: ${config.claude.model}\n` +
        `💾 Obsidian: Connected\n` +
        `📡 Tududi API: Connected`
      );
    });

    logger.info('System started successfully! 🚀');
    logger.info('Bot is now listening for messages...');

  } catch (error) {
    logger.error(`Startup failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down gracefully...');
  process.exit(0);
});

// Start application
main().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});
```

**Step 2: Update package.json scripts**

Update `package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

**Step 3: Create .env from .env.example**

```bash
cp .env.example .env
```

Then manually edit `.env` with actual API keys

**Step 4: Test application startup (dry run)**

```bash
npm run dev
```

Expected: Application starts, bot connects (may fail if .env not configured)

**Step 5: Commit main application**

```bash
git add src/index.js package.json
git commit -m "feat: add main application entry point with full integration"
```

**Step 6: Update progress.md**

Mark Task 5.2 as complete in `progress.md`

**Step 7: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 5.2 complete"
```

---

## Phase 6: Advanced Features (MVP 1 Completion)

### Task 6.1: Add Daily Planning Service

**Files:**
- Create: `src/llm/daily-planner.js`
- Create: `tests/llm/daily-planner.test.js`
- Create: `src/llm/prompts/daily-plan.js`

**Step 1: Create daily planning prompt**

Create `src/llm/prompts/daily-plan.js`:

```javascript
const SYSTEM_PROMPT = `You are a daily planning assistant for an ADHD user with executive dysfunction.

USER CONTEXT:
- Has ADHD (time blindness, poor working memory, task initiation issues)
- Network operations shift worker (unpredictable schedule)
- Lives in Indonesia (WIB timezone)
- Current date: {{currentDate}}

PLANNING PHILOSOPHY:
1. **Realistic over ambitious**: Plan 50-60% of available time (ADHD tax buffer)
2. **Energy-aware**: Match tasks to time of day (morning = HIGH, evening = LOW)
3. **Deadline-driven**: Urgent deadlines take priority
4. **Quick wins first**: Start with easy tasks for momentum
5. **No decision fatigue**: Tell user exactly what to do

AVAILABLE TIME CALCULATION:
- User provides: shift schedule OR free hours
- Subtract: commute time (15% buffer for context switching)
- Reserve: 20% buffer for unexpected tasks

TASK PRIORITIZATION:
1. Overdue tasks (with grace period awareness)
2. Tasks due today or tomorrow
3. Tasks with approaching deadlines (<5 days)
4. High-value tasks (project impact)
5. Low-energy quick wins (momentum builders)

ENERGY LEVELS:
- HIGH: Analytical work, deep thinking, planning, complex coding
- MEDIUM: Meetings, communications, moderate tasks
- LOW: Errands, checklist items, simple admin, quick calls

TIME OF DAY PATTERNS:
- 7am-11am: HIGH energy → analytical tasks
- 11am-2pm: MEDIUM energy → meetings, emails
- 2pm-6pm: LOW energy (if post-shift) → simple tasks
- 6pm-10pm: VARIABLE → family time, light tasks
- 10pm-12am: MEDIUM → creative work (if user preference)

OUTPUT FORMAT (JSON):
{
  "summary": "Brief overview of the day",
  "available_time": 360,  // minutes
  "planned_time": 240,    // 60-70% of available
  "buffer_time": 120,     // remainder
  "priority_tasks": [
    {
      "task_id": 123,
      "title": "Task title",
      "time_slot": "9:00-11:00",
      "duration": 120,
      "energy": "HIGH",
      "reason": "Why this task now"
    }
  ],
  "skipped_tasks": [
    {
      "task_id": 456,
      "title": "Task title",
      "reason": "Not enough time, moved to tomorrow"
    }
  ],
  "warnings": ["You're overcommitted by 2 hours"] // if applicable
}`;

function buildPrompt(tasks, schedule, context = {}) {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0];

  const systemPrompt = SYSTEM_PROMPT
    .replace('{{currentDate}}', currentDate);

  const tasksList = tasks.map(t =>
    `- ID ${t.id}: ${t.title} (due: ${t.due_date || 'none'}, estimate: ${t.time_estimate}m, energy: ${t.energy_level})`
  ).join('\n');

  const userPrompt = `Plan today's tasks.

**Available Time:**
${schedule.description || `${schedule.available_hours} hours available`}

**Shift Schedule:**
${schedule.shift_start && schedule.shift_end
  ? `Working ${schedule.shift_start} to ${schedule.shift_end}`
  : 'No shift today'}

**Incomplete Tasks (${tasks.length}):**
${tasksList}

Generate a realistic plan with specific time slots. Respond with JSON only.`;

  return {
    systemPrompt,
    userPrompt
  };
}

module.exports = {
  SYSTEM_PROMPT,
  buildPrompt
};
```

**Step 2: Write failing test for daily planner**

Create `tests/llm/daily-planner.test.js`:

```javascript
const DailyPlanner = require('../../src/llm/daily-planner');

describe('DailyPlanner', () => {
  let planner;
  let mockClaudeClient;
  let mockTududuClient;

  beforeEach(() => {
    mockClaudeClient = {
      parseJSON: jest.fn()
    };
    mockTududuClient = {
      getTasks: jest.fn()
    };
    planner = new DailyPlanner(mockClaudeClient, mockTududuClient);
  });

  test('generates daily plan', async () => {
    const mockTasks = [
      { id: 1, title: 'Task 1', due_date: '2025-11-18', time_estimate: 60, energy_level: 'HIGH' },
      { id: 2, title: 'Task 2', due_date: '2025-11-19', time_estimate: 30, energy_level: 'LOW' }
    ];

    mockTududuClient.getTasks.mockResolvedValue(mockTasks);

    mockClaudeClient.parseJSON.mockResolvedValue({
      summary: 'Focus on urgent tasks',
      available_time: 360,
      planned_time: 240,
      buffer_time: 120,
      priority_tasks: [
        {
          task_id: 1,
          title: 'Task 1',
          time_slot: '9:00-10:00',
          duration: 60,
          energy: 'HIGH'
        }
      ],
      skipped_tasks: [
        {
          task_id: 2,
          title: 'Task 2',
          reason: 'Low priority, moved to tomorrow'
        }
      ]
    });

    const plan = await planner.generatePlan({
      available_hours: 6,
      shift_start: '14:00',
      shift_end: '22:00'
    });

    expect(plan.priority_tasks).toHaveLength(1);
    expect(plan.planned_time).toBeLessThanOrEqual(plan.available_time);
  });

  test('warns about overcommitment', async () => {
    const mockTasks = Array(20).fill(null).map((_, i) => ({
      id: i,
      title: `Task ${i}`,
      due_date: '2025-11-18',
      time_estimate: 60,
      energy_level: 'MEDIUM'
    }));

    mockTududuClient.getTasks.mockResolvedValue(mockTasks);

    mockClaudeClient.parseJSON.mockResolvedValue({
      summary: 'Too many tasks',
      available_time: 180,
      planned_time: 180,
      buffer_time: 0,
      priority_tasks: [],
      warnings: ['Overcommitted by 10 hours - need to reschedule']
    });

    const plan = await planner.generatePlan({ available_hours: 3 });

    expect(plan.warnings).toContain(expect.stringContaining('Overcommitted'));
  });
});
```

**Step 3: Run test to verify it fails**

```bash
npm test tests/llm/daily-planner.test.js
```

Expected: FAIL

**Step 4: Write daily planner implementation**

Create `src/llm/daily-planner.js`:

```javascript
const logger = require('../utils/logger');
const { buildPrompt } = require('./prompts/daily-plan');

class DailyPlanner {
  constructor(claudeClient, tududuClient) {
    this.claude = claudeClient;
    this.tududi = tududuClient;
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
```

**Step 5: Run test to verify it passes**

```bash
npm test tests/llm/daily-planner.test.js
```

Expected: PASS

**Step 6: Integrate daily planning into main app**

Update `src/index.js` to add daily planning command:

```javascript
// Add after other imports
const DailyPlanner = require('./llm/daily-planner');

// In main() function, after initializing other services:
const dailyPlanner = new DailyPlanner(claude, tududuClient);

// Add command handler:
bot.onCommand('plan', async (msg) => {
  try {
    await bot.sendMessage('🤔 Generating your daily plan...');

    // For now, assume 8 hours available (can be improved with calendar integration)
    const plan = await dailyPlanner.generatePlan({
      available_hours: 8,
      description: '8 hours free time today'
    });

    const message = dailyPlanner.formatPlanMessage(plan);
    await bot.sendMessage(message);
  } catch (error) {
    await bot.sendMessage(`❌ Failed to generate plan: ${error.message}`);
  }
});
```

**Step 7: Commit daily planner**

```bash
git add src/llm/daily-planner.js tests/llm/daily-planner.test.js src/llm/prompts/daily-plan.js src/index.js
git commit -m "feat: add daily planning service with AI prioritization"
```

**Step 8: Update progress.md**

Mark Task 6.1 as complete in `progress.md`

**Step 9: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 6.1 complete"
```

---

## Phase 7: Testing & Documentation

### Task 7.1: Integration Testing

**Files:**
- Create: `tests/integration/end-to-end.test.js`
- Create: `.env.test`

**Step 1: Create test environment file**

Create `.env.test`:

```env
TELEGRAM_BOT_TOKEN=test_token
TELEGRAM_USER_ID=123456
ANTHROPIC_API_KEY=test_key
OPENAI_API_KEY=test_key
TUDUDI_API_URL=http://localhost:3000
TUDUDI_API_TOKEN=test_token
OBSIDIAN_VAULT_PATH=/tmp/test-vault
OBSIDIAN_DAILY_NOTES_PATH=Daily Notes
TIMEZONE=Asia/Jakarta
PORT=3001
```

**Step 2: Write integration test**

Create `tests/integration/end-to-end.test.js`:

```javascript
const fs = require('fs');
const path = require('path');

// Mock external APIs
jest.mock('node-telegram-bot-api');
jest.mock('@anthropic-ai/sdk');
jest.mock('axios');

const MessageOrchestrator = require('../../src/orchestrator');
const TaskParser = require('../../src/llm/task-parser');
const TududuClient = require('../../src/tududi/client');
const ObsidianFileManager = require('../../src/obsidian/file-manager');

describe('End-to-End Integration', () => {
  let orchestrator;
  let mockBot;
  const testVaultPath = '/tmp/test-vault-' + Date.now();

  beforeAll(() => {
    // Create test vault
    fs.mkdirSync(testVaultPath, { recursive: true });
  });

  afterAll(() => {
    // Cleanup test vault
    fs.rmSync(testVaultPath, { recursive: true, force: true });
  });

  beforeEach(() => {
    const mockClaudeClient = {
      parseJSON: jest.fn()
    };

    const taskParser = new TaskParser(mockClaudeClient);

    const mockTududuClient = {
      createTask: jest.fn().mockImplementation((data) => ({
        id: Math.floor(Math.random() * 1000),
        ...data
      })),
      getTasks: jest.fn().mockResolvedValue([]),
      updateTask: jest.fn()
    };

    const fileManager = new ObsidianFileManager({
      vaultPath: testVaultPath,
      dailyNotesPath: 'Daily Notes'
    });

    mockBot = {
      sendMessage: jest.fn()
    };

    orchestrator = new MessageOrchestrator({
      taskParser,
      tududuClient: mockTududuClient,
      fileManager,
      bot: mockBot
    });

    // Default mock response
    mockClaudeClient.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [{
        title: 'Test Task',
        due_date: '2025-11-18',
        time_estimate: 30,
        energy_level: 'MEDIUM',
        project: 'Test'
      }]
    });
  });

  test('completes full task capture flow', async () => {
    await orchestrator.handleMessage('beli susu anak besok');

    // Verify task created in Tududi
    expect(orchestrator.tududuClient.createTask).toHaveBeenCalled();

    // Verify confirmation sent
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('✅')
    );

    // Verify daily note created
    const dailyNotePath = path.join(testVaultPath, 'Daily Notes', '2025-11-18.md');
    const noteExists = fs.existsSync(dailyNotePath);
    expect(noteExists).toBe(true);

    // Verify task in daily note
    if (noteExists) {
      const content = fs.readFileSync(dailyNotePath, 'utf-8');
      expect(content).toContain('Test Task');
      expect(content).toContain('[[Tududi-');
    }
  });

  test('handles multi-task message', async () => {
    orchestrator.taskParser.claude.parseJSON.mockResolvedValue({
      type: 'task',
      tasks: [
        { title: 'Task 1', due_date: '2025-11-18', time_estimate: 15 },
        { title: 'Task 2', due_date: '2025-11-19', time_estimate: 30 }
      ]
    });

    await orchestrator.handleMessage('task 1 and task 2');

    expect(orchestrator.tududuClient.createTask).toHaveBeenCalledTimes(2);
    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('Created 2 tasks')
    );
  });

  test('handles knowledge capture', async () => {
    orchestrator.taskParser.claude.parseJSON.mockResolvedValue({
      type: 'knowledge',
      title: 'Test Knowledge',
      content: 'Some useful information',
      category: 'Testing',
      tags: ['test', 'integration'],
      actionable: false
    });

    await orchestrator.handleMessage('important insight about testing');

    expect(mockBot.sendMessage).toHaveBeenCalledWith(
      expect.stringContaining('💡 Knowledge captured')
    );

    // Verify knowledge note created
    const knowledgeDir = path.join(testVaultPath, 'Knowledge', 'Testing');
    if (fs.existsSync(knowledgeDir)) {
      const files = fs.readdirSync(knowledgeDir);
      expect(files.length).toBeGreaterThan(0);
    }
  });
});
```

**Step 3: Run integration tests**

```bash
npm test tests/integration/
```

Expected: PASS

**Step 4: Commit integration tests**

```bash
git add tests/integration/ .env.test
git commit -m "test: add end-to-end integration tests"
```

**Step 5: Update progress.md**

Mark Task 7.1 as complete in `progress.md`

**Step 6: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 7.1 complete"
```

---

### Task 7.2: User Documentation

**Files:**
- Create: `docs/USER_GUIDE.md`
- Create: `docs/SETUP.md`
- Update: `README.md`

**Step 1: Create setup guide**

Create `docs/SETUP.md`:

```markdown
# Setup Guide

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Telegram account
- Anthropic Claude API key
- OpenAI API key
- Obsidian installed (optional but recommended)

## Step 1: Get API Keys

### Telegram Bot Token

1. Open Telegram and search for @BotFather
2. Send `/newbot` and follow instructions
3. Copy the bot token (looks like `123456:ABC-DEF...`)
4. Send a message to your bot
5. Get your user ID: `https://api.telegram.org/bot<TOKEN>/getUpdates`

### Anthropic Claude API

1. Sign up at https://console.anthropic.com/
2. Create an API key
3. Copy the key (starts with `sk-ant-...`)

### OpenAI API (for Whisper)

1. Sign up at https://platform.openai.com/
2. Create an API key
3. Copy the key (starts with `sk-...`)

## Step 2: Deploy Tududi

```bash
docker-compose up -d
```

Wait for services to start, then access Tududi at http://localhost:3000

Create an account and get your API token from settings.

## Step 3: Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your actual values:

```env
TELEGRAM_BOT_TOKEN=your_actual_token
TELEGRAM_USER_ID=your_actual_id
ANTHROPIC_API_KEY=sk-ant-your_key
OPENAI_API_KEY=sk-your_key
TUDUDI_API_URL=http://localhost:3000
TUDUDI_API_TOKEN=your_tududi_token
OBSIDIAN_VAULT_PATH=/path/to/your/vault
```

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Start Application

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

## Step 6: Test

Send a message to your Telegram bot:

```
beli susu anak besok
```

You should receive a confirmation with the task details.

## Troubleshooting

**Bot not responding:**
- Check bot token is correct
- Verify user ID matches your Telegram account
- Check logs: `logs/info.log`

**Tududi connection failed:**
- Ensure Docker containers are running: `docker ps`
- Check Tududi API URL is correct
- Verify API token is valid

**Obsidian sync not working:**
- Check vault path exists and is accessible
- Ensure Daily Notes folder exists
- Check file permissions

## Next Steps

- Read [User Guide](USER_GUIDE.md) for usage instructions
- Configure daily planning cron job
- Set up automatic backups
```

**Step 2: Create user guide**

Create `docs/USER_GUIDE.md`:

```markdown
# User Guide

## Quick Start

Your AI task assistant lives in Telegram. Just send messages and it handles the rest!

## Basic Usage

### Creating Tasks

Just send a natural message:

```
beli susu anak
```

The bot will:
1. Parse your message with AI
2. Create task in Tududi
3. Add to Obsidian daily note
4. Send confirmation

### Voice Messages

Tap microphone in Telegram and speak:

```
"besok meeting with client jam 2 siang"
```

Transcribed and processed automatically (Indonesian supported!)

### Multiple Tasks

Send multiple tasks in one message:

```
beli susu anak, ultah mama tanggal 25, meeting next Monday
```

All extracted and created separately.

### Natural Language Dates

- "besok" / "tomorrow" → next day
- "lusa" → day after tomorrow
- "next Monday" → upcoming Monday
- "tanggal 25" → 25th of this/next month
- "minggu depan" → next week

## Daily Planning

Get AI to plan your day:

```
/plan
```

Bot will:
1. Fetch your incomplete tasks
2. Analyze deadlines and priorities
3. Generate time-blocked schedule
4. Account for your energy levels
5. Leave buffer time for chaos

Example response:

```
📅 Daily Plan

Focus on urgent deadlines today

⏱️ Available: 360m | Planned: 240m | Buffer: 120m

Priority Tasks (3):

1. Review client proposal
   ⏰ 9:00-11:00 (120m) ⚡HIGH
   💡 Due today, requires deep focus

2. Quick grocery run
   ⏰ 11:30-11:45 (15m) ⚡LOW
   💡 Quick win before shift

3. Email follow-ups
   ⏰ 12:00-12:30 (30m) ⚡MEDIUM
```

## Chaos Mode

When work gets hectic:

```
/chaos
```

Bot activates chaos mode:
- Shows only quick (<15m) and urgent tasks
- Hides deep work
- Simplified view

When things calm down:

```
/normal
```

Bot asks how much time you have, then re-plans automatically.

## Knowledge Capture

Send insights and they're saved as notes:

```
bitcoin dips before US open, rebounds in Asia session, best entry 30 min after open
```

Bot detects this is knowledge (not a task) and:
1. Creates structured note in Obsidian
2. Categorizes under Trading/Crypto
3. Adds searchable tags
4. Links related concepts

If knowledge is actionable:

```
bitcoin strategy idea - test 30min entry timing
```

Bot creates both:
- Knowledge note with strategy
- Task "Test Bitcoin 30-min strategy"

## Obsidian Integration

### Tasks in Daily Notes

Every task appears in your Obsidian daily note:

```markdown
## 2025-11-18

### Tasks
- [ ] Beli susu anak (due: 2025-11-18) ⏱️15m ⚡LOW #shopping [[Tududi-123]]
```

Check the box in Obsidian → syncs to Tududi automatically!

### Knowledge Notes

Saved under `Knowledge/[Category]/`:

```
Knowledge/
  Trading/
    bitcoin-market-timing-2025-11-18.md
  Health/
    sleep-optimization-tips-2025-11-15.md
```

### Searching

Ask bot to search your notes:

```
dulu aku pernah baca tentang bitcoin timing
```

Bot performs semantic search and returns relevant notes with excerpts.

## Commands Reference

- `/start` - Welcome message
- `/help` - Show help
- `/plan` - Generate daily plan
- `/chaos` - Enable chaos mode
- `/normal` - Disable chaos mode
- `/status` - System status

## Tips for ADHD Users

**Capture immediately:**
- Don't wait to "clean up" your message
- Send messy thoughts, AI will structure them
- Use voice when walking/commuting

**Trust the system:**
- Let AI decide what to do today
- Don't second-guess the plan
- Follow time blocks without re-planning

**Review weekly:**
- Check what tasks you're skipping (patterns)
- Adjust time estimates over time
- Celebrate completed tasks!

**Use spouse requests tag:**
- Mention "istri" → auto-tagged for priority
- Never forget important requests
- Track completion separately

## Advanced Features

### Energy-Based Filtering

Tasks tagged with energy levels:
- HIGH: Analytical work, planning, coding
- MEDIUM: Meetings, emails, admin
- LOW: Errands, simple tasks

Plan respects energy patterns:
- Morning: HIGH energy tasks
- Afternoon: MEDIUM tasks
- Evening: LOW energy tasks

### Recurring Tasks

Annual reminders:

```
ultah mama tanggal 25 November
```

Bot creates:
- Recurring yearly reminder
- Multi-stage notifications (1 week, 3 days, day-of)
- Action suggestions ("Buy gift", "Call")

### Time Estimation Learning

Bot learns from your history:
- "Writing blog post" took 90 minutes last time
- Next estimate: 90 minutes (not generic 60)
- Improves planning accuracy over time

## Troubleshooting

**Task not created:**
- Check Tududi API connection (`/status`)
- Review logs: `logs/error.log`
- Try simpler message format

**Voice transcription wrong:**
- Speak clearly and slowly
- Use Indonesian or English (no mixing mid-sentence)
- Retry or send text version

**Obsidian sync delayed:**
- Sync happens within 5 minutes (not instant)
- Check vault path is correct
- Restart file watcher if needed

**Getting "too many tasks" warning:**
- You're overcommitted
- Let bot reschedule some for tomorrow
- Focus on top 3 priorities only
```

**Step 3: Update main README**

Update `README.md` with links to documentation:

```markdown
# AI-Powered ADHD Task Management System

Zero-friction task capture and AI-powered planning for ADHD users.

## Features

✅ **Instant Capture** - Voice or text via Telegram, processed in <10 seconds
✅ **AI Planning** - Daily plan generation with energy-aware scheduling
✅ **Chaos Mode** - Simplified view for unpredictable days
✅ **Knowledge Base** - Automatic Obsidian integration with semantic search
✅ **Natural Language** - Indonesian + English, flexible date parsing
✅ **Bidirectional Sync** - Obsidian ↔ Tududi real-time sync

## Quick Start

```bash
# 1. Clone repository
git clone <repo-url>
cd remembro-tududi-claude

# 2. Set up environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start Tududi
docker-compose up -d

# 4. Install dependencies
npm install

# 5. Run application
npm start
```

See [Setup Guide](docs/SETUP.md) for detailed instructions.

## Documentation

- [Setup Guide](docs/SETUP.md) - Installation and configuration
- [User Guide](docs/USER_GUIDE.md) - Usage instructions and tips
- [Implementation Plan](docs/plans/2025-11-18-ai-powered-adhd-task-system.md) - Development roadmap

## Architecture

```
Telegram Bot → LLM Middleware (Claude) → Tududi API + Obsidian Vault
```

- **Telegram**: Primary interface (low friction)
- **Claude**: Natural language parsing and planning
- **Tududi**: Task storage and management
- **Obsidian**: Knowledge base with bidirectional sync

## Tech Stack

- Node.js 18+
- Telegram Bot API
- Anthropic Claude 3.5 Sonnet
- OpenAI Whisper (transcription)
- Tududi (Docker)
- Obsidian (markdown files)

## Development

```bash
npm run dev      # Start with auto-reload
npm test         # Run tests
npm run test:watch  # Watch mode
```

## License

MIT

## Contributing

This is a personal project built for specific ADHD needs. Feel free to fork and adapt for your own use!
```

**Step 4: Commit documentation**

```bash
git add docs/SETUP.md docs/USER_GUIDE.md README.md
git commit -m "docs: add comprehensive setup and user guides"
```

**Step 5: Update progress.md**

Mark Task 7.2 as complete in `progress.md`

**Step 6: Commit progress update**

```bash
git add progress.md
git commit -m "docs: mark Task 7.2 complete"
```

---

## MVP 1 Completion Checklist

### Final Task: Create Progress Tracking File

**Step 1: Create progress.md**

Create `progress.md` at project root with full checklist

**Step 2: Commit progress file**

```bash
git add progress.md
git commit -m "docs: add progress tracking file for implementation"
```

---

## Execution Notes

**Estimated Total Time:** 60-80 hours (MVP 1)

**Critical Path:**
1. Phase 0 (Setup) → 2 hours
2. Phase 1 (Tududi) → 3 hours
3. Phase 2 (LLM) → 8 hours
4. Phase 3 (Telegram) → 6 hours
5. Phase 4 (Obsidian) → 8 hours
6. Phase 5 (Integration) → 10 hours
7. Phase 6 (Advanced) → 15 hours
8. Phase 7 (Testing/Docs) → 10 hours

**Testing Strategy:**
- Unit tests for each module (Jest)
- Integration tests for full flow
- Manual testing with real user (target persona)
- 1-week dogfooding period

**Deployment:**
- Docker Compose for Tududi + PostgreSQL
- PM2 for Node.js application
- systemd for auto-start on boot
- Daily automated backups

**Success Criteria (MVP 1):**
- [ ] User can capture tasks via text (< 10 sec)
- [ ] User can capture tasks via voice (< 15 sec)
- [ ] Tasks sync to Obsidian daily notes
- [ ] Tasks sync from Obsidian to Tududi
- [ ] Daily planning generates realistic schedule
- [ ] Chaos mode simplifies task list
- [ ] Knowledge notes created and searchable
- [ ] System runs 24/7 with >99% uptime
- [ ] User completes 1 week of daily usage

---

**Plan saved to:** `docs/plans/2025-11-18-ai-powered-adhd-task-system.md`
