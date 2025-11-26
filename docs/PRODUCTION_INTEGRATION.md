# Production Integration Guide

This document covers the complete production integration of MVP1 features into the remembro-tududi Telegram bot.

## Overview

The MVP1 implementation adds four major features to the bot:
1. **Shift Schedule Integration** - Automated shift-aware planning
2. **Daily Planning Enhancement** - Shift-aware time blocking
3. **Knowledge Search** - Full-text search and summarization
4. **Article Parser** - Multi-source article extraction and storage

## Command Integration

### New Commands Added

#### `/plan [timeframe]`
Generate a shift-aware daily plan.

**Usage:**
```
/plan               # Today's plan (default)
/plan tomorrow      # Tomorrow's plan
/plan YYYY-MM-DD    # Specific date
/plan besok         # Tomorrow (Indonesian)
```

**Response Format:**
```
📅 Daily Plan: Thursday, November 27, 2025

⏰ Shift: Code 2 (16:00 - 01:00)
📊 Available Time: 7 hours
📋 Tasks: 2 tasks scheduled
⚠️ Workload: 65% capacity

Time Blocks:
• 16:00-16:30: Task 1 [30 min, HIGH energy]
• 16:30-17:30: Task 2 [60 min, MEDIUM energy]
```

#### `/search <query>`
Search knowledge notes with full-text search.

**Usage:**
```
/search bitcoin
/search trading strategies
/search cari bitcoin        # Indonesian
```

**Search Keywords Recognized:**
- Indonesian: `pernah baca`, `cari`, `apa aja`, `gimana cara`, `apa bedanya`
- English: `find`, `search`, `how to`, `what is`

#### `/summary`
Generate summary of all knowledge notes.

**Usage:**
```
/summary
```

**Response:** Overview of all notes with key points and sources

### Modified Commands

#### `/start`
Updated to show all available commands including new ones.

#### `/help`
Expanded with examples for all new features.

#### `/status`
Enhanced to show shift schedule status and new feature availability.

## Message Handler Integration

### Automatic Article Detection
When users send messages with URLs, the bot automatically:
1. Detects the URL(s)
2. Attempts to parse the article
3. Suggests topic for storage
4. Provides save/skip buttons

**Supported Domains:**
- **Blogs:** Medium, Substack, Dev.to, WordPress, LinkedIn
- **Social Media:** Twitter/X
- **Fallback:** Unsupported domains (user provides summary)

**Example Flow:**
```
User: Check this https://medium.com/trading-tips

Bot: 📖 Article Parser
✅ Trading Tips
   Source: blog
   📁 Suggested: Trading

[✅ Save] [⏭️ Skip]

User: [clicks Save]

Bot: ✅ Saved to 📁 Trading
   Article saved to Knowledge/Trading/trading-tips-2025-11-27.md
```

## Scheduled Features

### Daily Plan Generation
Automatically generates and sends shift-aware daily plan at **8:00 AM**.

**Configuration:**
- **Time:** 0 8 * * * (8 AM daily)
- **Update .env:** `PLAN_SCHEDULE_TIME` (optional)

**Example:**
```
# Custom schedule (24-hour format)
PLAN_SCHEDULE_TIME="0 7 * * *"  # 7 AM
PLAN_SCHEDULE_TIME="0 9 * * *"  # 9 AM
```

## Configuration

### Required Environment Variables
```bash
# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_USER_ID=your_user_id

# Tududi API
TUDUDI_API_URL=http://localhost:3000
TUDUDI_API_TOKEN=your_api_token

# Obsidian
OBSIDIAN_VAULT_PATH=/path/to/vault

# Shift Schedule (optional)
GOOGLE_SHEETS_ID=your_sheets_id

# LLM Provider
ANTHROPIC_API_KEY=your_api_key
```

### Optional: Redis Caching

For production environments with frequent shift schedule access, configure Redis caching:

#### Installation

```bash
npm install redis --save
```

#### Setup

**Edit `src/shift-schedule/index.js`:**

```javascript
// Add at the top
const redis = require('redis');

// In initializeShiftSchedule function, add Redis client:
const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD
});

client.on('error', (err) => {
  logger.warn(`Redis connection failed: ${err.message}, continuing with file cache`);
});

// Update cache methods to use Redis:
async fetchAndCache(shiftData) {
  // Save to file as before
  await this.saveToFile(shiftData);

  // Also save to Redis (24 hour expiration)
  if (client.isOpen) {
    try {
      await client.setEx(
        'shift_schedule:' + shiftData.month,
        86400,  // 24 hours
        JSON.stringify(shiftData)
      );
    } catch (err) {
      logger.warn(`Redis cache write failed: ${err.message}`);
    }
  }
}

async getShiftData() {
  // Try Redis first
  if (client.isOpen) {
    try {
      const cached = await client.get('shift_schedule:current');
      if (cached) {
        logger.info('Shift data loaded from Redis cache');
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn(`Redis read failed: ${err.message}, falling back to file`);
    }
  }

  // Fall back to file cache
  return this.loadFromFile();
}
```

**Environment Variables for Redis:**

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password  # Optional
```

#### Benefits

- **Performance:** 10-100x faster access to shift data
- **Reliability:** Automatic fallback to file cache if Redis unavailable
- **Scalability:** Share cache across multiple instances

### Optional: Database Logging

For production monitoring, add logging to a database:

**Install driver:**
```bash
npm install mongodb --save  # or PostgreSQL/MySQL driver
```

**Configure logging to persist messages and searches:**
```javascript
// In src/index.js
const mongoClient = new MongoClient(process.env.MONGO_URI);

bot.onMessage(async (msg) => {
  const message = msg.text;

  // Log to database
  await db.collection('messages').insertOne({
    text: message,
    timestamp: new Date(),
    type: 'received'
  });

  // ... rest of handler
});
```

## Testing

### Run Full Test Suite
```bash
npm test
```

**Current Coverage:**
- 26 test suites
- 152 tests total
- 100% pass rate

### Test Bot Integration
```bash
npm test -- tests/bot/bot-integration.test.js
```

**Covers:**
- /plan command with different timeframes
- /search command with various queries
- /summary command
- Article detection and parsing
- Concurrent operations
- Error handling

## Deployment Steps

### 1. Prepare Production Environment

```bash
# Install dependencies
npm install

# Verify all tests pass
npm test

# Build production config
cp .env.example .env
# Edit .env with production values
```

### 2. Configure Services

```bash
# Verify Obsidian vault path
mkdir -p /path/to/vault/Knowledge

# Create cache directory
mkdir -p .cache

# Create knowledge search indexes (optional)
npm run build-indexes
```

### 3. Start Bot

```bash
# Development
npm start

# Production with PM2
pm2 start src/index.js --name "remembro-bot"
pm2 save
pm2 startup

# Docker
docker build -t remembro-bot .
docker run -d \
  -e TELEGRAM_BOT_TOKEN=xxx \
  -e GOOGLE_SHEETS_ID=xxx \
  -v /path/to/vault:/app/vault \
  --name remembro-bot \
  remembro-bot
```

### 4. Monitor

```bash
# Check logs
npm logs

# Monitor memory/CPU
pm2 monit

# Health check endpoint (optional)
curl http://localhost:3001/health
```

## Troubleshooting

### Shift Schedule Not Loading
1. Verify `GOOGLE_SHEETS_ID` is correct
2. Check Google Sheets export URL accessibility
3. Review logs for CSV parsing errors
4. Fallback: Manual shift data in `.cache/shifts.json`

### Knowledge Search Not Finding Notes
1. Verify `OBSIDIAN_VAULT_PATH` points to vault directory
2. Check that .md files exist in vault
3. Verify file encoding is UTF-8
4. Ensure search keywords match intent detector patterns

### Articles Not Saving
1. Check `OBSIDIAN_VAULT_PATH` write permissions
2. Verify vault has `Knowledge/` folder
3. Check for special character issues in titles
4. Review logs for extractor errors

### Scheduler Not Running
1. Verify Node.js version supports `node-schedule`
2. Check system timezone: `date`
3. Ensure bot process hasn't crashed
4. Review logs for schedule job errors

## Performance Optimization

### Caching Strategy
- **Shift Schedule:** Redis (24h) + File (permanent)
- **Knowledge Index:** Memory (auto-rebuilt weekly)
- **Article Metadata:** File system

### Database Indexing (Optional)
```javascript
// Create indexes for faster searches
db.knowledge_notes.createIndex({ content: 'text', tags: 1 });
db.search_history.createIndex({ timestamp: -1 });
```

### Batch Operations
```javascript
// Process multiple articles in parallel
const articles = [url1, url2, url3];
const results = await Promise.all(
  articles.map(url => articleParser.parseUrl(url))
);
```

## Security Considerations

1. **API Keys:** Never commit `.env` file
2. **File Permissions:** Restrict vault directory: `chmod 700 /path/to/vault`
3. **Redis:** Use password protection in production
4. **Rate Limiting:** Consider adding rate limits for API endpoints
5. **Input Validation:** All user inputs validated before processing

## API Reference

### PlanCommand
```javascript
// Generate plan for specific date
const result = await planCommand.generatePlanForDate('2025-11-28');
// Returns: { formatted: string, plan: object }

// Available date formats:
// 'today', 'tomorrow', 'YYYY-MM-DD', 'besok', 'hari ini'
```

### KnowledgeSearchService
```javascript
// Search with intent detection
const result = await knowledgeSearch.handleQuery('cari bitcoin');
// Returns: { intent, results, formatted }

// Summarize all notes
const summary = await knowledgeSearch.summarizeAll('');
// Returns: { keyPoints, sources, formatted }
```

### ArticleParser
```javascript
// Parse URL
const parsed = await articleParser.parseUrl('https://medium.com/...');
// Returns: { success, content, suggestedTopics, extractor }

// Save article
const saved = await articleParser.saveArticle(content, reason, topic);
// Returns: { success, filepath, message }

// Handle message with URLs
const result = await articleParser.handleArticleMessage(message);
// Returns: { type, urls, results, formatted }
```

## Maintenance Tasks

### Weekly
- Check Redis memory usage
- Verify shift schedule sync is working
- Monitor error logs

### Monthly
- Clean up old cache files
- Update Google Sheets with new month
- Review and optimize slow queries

### Quarterly
- Full database backup
- Security audit
- Performance profiling

## Support & Contribution

For issues or contributions:
1. Check existing tests
2. Review implementation checklist
3. Create test case for new feature
4. Ensure all tests pass
5. Document changes

## Version History

- **v1.0.0** (Nov 27, 2025) - Initial MVP1 production integration
  - Shift schedule integration
  - Daily planning enhancement
  - Knowledge search
  - Article parser
  - 152 tests, 100% passing

---

**Last Updated:** November 27, 2025
**Maintainer:** Development Team
