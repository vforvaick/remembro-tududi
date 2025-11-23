# Production Setup Guide

## Environment Setup Complete ✅

Tanggal: 2025-11-23

### 1. CodeRabbit CLI Installation

```bash
# Installed via official script
curl -fsSL https://cli.coderabbit.ai/install.sh | sh

# Version: 0.3.4
# Location: /root/.local/bin/coderabbit
# Alias: cr
```

**Authentication configured** at `~/.coderabbit/auth.json`

### 2. Production Environment Configuration

File `.env` telah dikonfigurasi dengan:

#### Telegram Bot
- Token: Configured
- User ID: 658569851

#### LLM Providers (Multi-Provider Fallback)
Primary → Fallback order:
1. **MegaLM** (llama3.3-70b-instruct)
   - Max tokens: 131,072
   - Base URL: https://ai.megallm.io/v1

2. **Gemini** (gemini-3-pro-preview)
   - Max tokens: 1,000,000

3. **OpenAI** (gpt-4) - Available as backup
   - Max tokens: 200,000

#### Application Settings
- **Port**: 3001
- **Timezone**: Asia/Jakarta
- **Obsidian Vault**: `/tmp/obsidian-vault` (untuk testing)

### 3. Dependencies Installed

```bash
npm install
# 522 packages installed
```

### 4. Application Startup Test

**Status**: ✅ **BERHASIL**

```
✅ Telegram bot initialized
✅ LLM Client initialized with 2 provider(s): MegaLM, Gemini
✅ Obsidian vault watcher active
✅ System started successfully! 🚀
✅ Bot is now listening for messages...
```

### 5. Docker Installation

Docker dan Docker Compose terinstall dengan baik:
- **Docker version**: 28.2.2
- **Docker Compose**: 1.29.2

**Catatan**: Docker daemon tidak dapat berjalan di sandboxed environment karena keterbatasan kernel modules dan network stack. Untuk production deployment yang sebenarnya, gunakan environment dengan Docker support penuh.

### 6. Tududi API Integration

Untuk production deployment lengkap:

```bash
# 1. Start Tududi service
docker-compose up -d

# 2. Tunggu service ready (30-60 detik)
docker-compose ps

# 3. Dapatkan API token dari Tududi
# Akses Tududi di http://localhost:3000
# Login dan generate API token di settings

# 4. Update .env
TUDUDI_API_TOKEN=your_real_token_here

# 5. Restart aplikasi
npm start
```

## Production Deployment Checklist

Untuk deployment ke production server:

- [x] Install dependencies (`npm install`)
- [x] Configure `.env` dengan API keys yang valid
- [x] Setup Obsidian vault path yang sesuai
- [ ] Start Docker services (`docker-compose up -d`)
- [ ] Dapatkan Tududi API token yang valid
- [ ] Update TUDUDI_API_TOKEN di `.env`
- [ ] Test complete integration
- [ ] Setup process manager (PM2/systemd)
- [ ] Configure reverse proxy jika diperlukan
- [ ] Setup monitoring & logging

## Running the Application

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### With Docker (Tududi services)
```bash
# Start all services
docker-compose up -d

# Start only app
npm start

# View logs
docker-compose logs -f
```

## Environment Variables Summary

| Variable | Status | Notes |
|----------|--------|-------|
| TELEGRAM_BOT_TOKEN | ✅ Configured | Production token |
| TELEGRAM_USER_ID | ✅ Configured | 658569851 |
| LLM_PROVIDERS | ✅ Configured | megalm,gemini |
| MEGALM_API_KEY | ✅ Configured | Production key |
| GEMINI_API_KEY | ✅ Configured | Production key |
| OPENAI_API_KEY | ✅ Configured | Backup provider |
| TUDUDI_API_URL | ✅ Configured | localhost:3000 |
| TUDUDI_API_TOKEN | ⚠️  Test token | Need real token in production |
| OBSIDIAN_VAULT_PATH | ⚠️  Temp path | Update untuk production |
| PORT | ✅ Configured | 3001 |
| TIMEZONE | ✅ Configured | Asia/Jakarta |

## Testing Status

✅ Application starts successfully
✅ Telegram bot initializes
✅ Multi-LLM provider system works
✅ Obsidian watcher active
⚠️  Tududi integration - needs real deployment environment

## Next Steps

1. Deploy to server dengan Docker support penuh
2. Dapatkan Tududi API token yang valid
3. Configure Obsidian vault path sesuai kebutuhan
4. Setup process manager untuk auto-restart
5. Configure monitoring dan alerting

---

**Setup completed by**: Claude Code
**Branch**: claude/setup-coderabbit-cli-01NyAMASuo7qwDZ5VHvwL8Eq
**Ready for production deployment**: ✅ (with Tududi token update)
