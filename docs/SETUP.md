# Setup Guide

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed
- Telegram account
- **At least ONE** LLM provider API key (see options below)
- OpenAI API key (for voice transcription)
- Obsidian installed (optional but recommended)

### LLM Provider Options

You need **at least one** of these:
- **Claude** (Anthropic) - Recommended for quality
- **MegaLLM** - Access to 70+ models via single API
- **Gemini** (Google) - Good for multimodal tasks
- **OpenAI GPT** - General purpose (can reuse Whisper key)

See [LLM Providers Guide](LLM_PROVIDERS.md) for detailed comparison.

## Step 1: Get API Keys

### Telegram Bot Token

1. Open Telegram and search for @BotFather
2. Send `/newbot` and follow instructions
3. Copy the bot token (looks like `123456:ABC-DEF...`)
4. Send a message to your bot
5. Get your user ID: `https://api.telegram.org/bot<TOKEN>/getUpdates`

### LLM Provider APIs (Choose at least one)

**Claude (Anthropic) - Recommended:**
1. Sign up at https://console.anthropic.com/
2. Create an API key
3. Copy the key (starts with `sk-ant-...`)

**MegaLLM - Multi-Model Gateway:**
1. Sign up at https://megallm.io
2. Get API key from dashboard
3. Access 70+ models including GPT-5, Claude 4, Gemini Pro

**Gemini (Google):**
1. Sign up at https://ai.google.dev/
2. Create an API key
3. Supports multimodal tasks

**OpenAI GPT (Optional):**
1. Sign up at https://platform.openai.com/
2. Create an API key (starts with `sk-...`)
3. Can reuse for both GPT models and Whisper transcription

### OpenAI API (Required for Voice Transcription)

1. Sign up at https://platform.openai.com/
2. Create an API key
3. Copy the key (starts with `sk-...`)
4. Used for Whisper voice-to-text transcription

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

**Minimal Configuration (Claude only):**
```env
TELEGRAM_BOT_TOKEN=your_actual_token
TELEGRAM_USER_ID=your_actual_id

# LLM Provider
LLM_PROVIDERS=claude
ANTHROPIC_API_KEY=sk-ant-your_key

# Voice Transcription
OPENAI_API_KEY=sk-your_key

# Tududi
TUDUDI_API_URL=http://localhost:3000
TUDUDI_API_TOKEN=your_tududi_token

# Obsidian
OBSIDIAN_VAULT_PATH=/path/to/your/vault
```

**With Fallback (Recommended):**
```env
# Configure multiple providers for reliability
LLM_PROVIDERS=megallm,claude,gemini

# MegaLLM (70+ models)
MEGALM_API_KEY=your_megallm_key
MEGALM_MODEL=gpt-4o-mini

# Claude (fallback)
ANTHROPIC_API_KEY=sk-ant-your_key

# Gemini (fallback)
GEMINI_API_KEY=your_gemini_key

# ... rest of configuration
```

**Using MegaLLM Only:**
```env
LLM_PROVIDERS=megallm
MEGALM_API_KEY=your_megallm_key
MEGALM_MODEL=gpt-4o  # or gpt-5, claude-3.7-sonnet, etc.
```

For more provider configurations, see [LLM Providers Guide](LLM_PROVIDERS.md).

## Step 4: Install Dependencies

```bash
npm install
```

**Optional: Install provider-specific packages**

Only if you plan to use these providers:

```bash
# For Gemini
npm install @google/generative-ai

# For OpenAI GPT models (separate from Whisper)
npm install openai
```

**Note:**
- Claude and MegaLLM dependencies are already included
- axios (for MegaLLM) is already installed
- These are optional and will only be loaded if configured

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

**LLM Provider errors:**
- Ensure at least ONE provider is configured with valid API key
- Check `LLM_PROVIDERS` environment variable is set
- Verify API keys are correct (check key format)
- For provider-specific issues, see [LLM Providers Guide](LLM_PROVIDERS.md#troubleshooting)
- Test with `/status` command in Telegram to see active providers

**All providers failing:**
```
Error: All LLM providers failed
```
- Check that at least one API key is valid
- Verify npm packages are installed for configured providers
- Test with single provider: `LLM_PROVIDERS=claude`

**Tududi connection failed:**
- Ensure Docker containers are running: `docker ps`
- Check Tududi API URL is correct
- Verify API token is valid

**Obsidian sync not working:**
- Check vault path exists and is accessible
- Ensure Daily Notes folder exists
- Check file permissions

## Verifying Setup

Use the `/status` command in Telegram to verify everything is working:

```
**System Status** ✅

📋 Active tasks: 0
🧠 LLM Providers: MegaLLM → Claude
🎯 Primary: MegaLLM
💾 Obsidian: Connected
📡 Tududi API: Connected
```

## Next Steps

- Read [User Guide](USER_GUIDE.md) for usage instructions
- Explore [LLM Providers Guide](LLM_PROVIDERS.md) for advanced configuration
- Configure daily planning cron job
- Set up automatic backups
