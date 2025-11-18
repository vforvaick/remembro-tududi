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
