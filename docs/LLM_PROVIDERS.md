# LLM Providers & Fallback Configuration

This system supports multiple LLM providers with automatic fallback. If one provider fails, the system automatically tries the next provider in the configured order.

## Supported Providers

### 1. **Claude** (Anthropic)
- **Best for**: High-quality reasoning, JSON parsing, complex tasks
- **Models**: claude-3-5-sonnet-20241022, claude-3-opus, claude-3-haiku
- **Setup**: Requires `ANTHROPIC_API_KEY`

```env
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
CLAUDE_MAX_TOKENS=4096
```

### 2. **MegaLM** (Multi-Model Gateway)
- **Best for**: Access to 70+ models via single API, automatic fallback chains, cost optimization
- **Models**: gpt-5, gpt-4o, gpt-4o-mini, claude-3.7-sonnet, claude-opus-4, gemini-2.5-pro, llama-4, mistral, and more
- **Features**: OpenAI-compatible API, smart fallback, automatic failover on errors/rate limits
- **Setup**: Requires `MEGALM_API_KEY` from https://megallm.io

```env
MEGALM_API_KEY=your_megalm_key
MEGALM_MODEL=gpt-4o-mini
MEGALM_BASE_URL=https://ai.megallm.io/v1
MEGALM_MAX_TOKENS=4096
```

**Available Models** (via MegaLM):
- GPT: `gpt-5`, `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`
- Claude: `claude-3.7-sonnet`, `claude-opus-4-1-20250805`, `claude-3.5-sonnet`
- Gemini: `gemini-2.5-pro`, `gemini-pro-ultra`
- Others: `llama-4`, `mistral`, `command-r+`

### 3. **Gemini** (Google)
- **Best for**: Multimodal tasks, Google ecosystem integration
- **Models**: gemini-pro, gemini-pro-vision
- **Setup**: Requires `GEMINI_API_KEY`

```env
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-pro
GEMINI_MAX_TOKENS=4096
```

### 4. **OpenAI** (GPT)
- **Best for**: General purpose, wide availability
- **Models**: gpt-4, gpt-4-turbo, gpt-3.5-turbo
- **Setup**: Requires `OPENAI_API_KEY` (already used for Whisper)

```env
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4
OPENAI_MAX_TOKENS=4096
```

## Configuring Fallback Order

Set the `LLM_PROVIDERS` environment variable with a comma-separated list of providers in your preferred fallback order:

```env
# Try MegaLM first, then Gemini, then Claude, finally OpenAI
LLM_PROVIDERS=megalm,gemini,claude,openai
```

### Common Configurations

**Cost-Optimized (Cheapest First):**
```env
LLM_PROVIDERS=gemini,openai,claude
```

**Quality-First (Best First):**
```env
LLM_PROVIDERS=claude,gpt-4,gemini
```

**Local-First (Privacy):**
```env
LLM_PROVIDERS=megalm,claude
```

**Single Provider (No Fallback):**
```env
LLM_PROVIDERS=claude
```

## How Fallback Works

1. **Sequential Attempt**: System tries providers in configured order
2. **Automatic Retry**: On failure, immediately tries next provider
3. **Error Logging**: Each failure is logged with provider name and error
4. **Success Notification**: Logs which provider successfully handled the request
5. **Complete Failure**: Only fails if ALL providers fail

### Example Flow

```
User sends message → System tries MegaLM → Fails (API timeout)
                   → System tries Gemini → Fails (Rate limit)
                   → System tries Claude → Success! ✓
```

## Installation Requirements

Each provider requires its corresponding npm package:

```bash
# Claude (Anthropic) - Already installed
npm install @anthropic-ai/sdk

# Gemini (Google)
npm install @google/generative-ai

# MegaLM (uses axios for HTTP)
npm install axios

# OpenAI (for GPT models - already installed for Whisper)
npm install openai
```

**Note:** Only install packages for providers you plan to use.

## Provider Status Checking

Use the `/status` command in Telegram to see configured providers:

```
**System Status** ✅

📋 Active tasks: 12
🧠 LLM Providers: MegaLM → Gemini → Claude
🎯 Primary: MegaLM
💾 Obsidian: Connected
📡 Tududi API: Connected
```

## Troubleshooting

### Provider Not Working

1. **Check API Key**: Ensure the API key is correctly set in `.env`
2. **Check Package Installation**: Verify the provider's npm package is installed
3. **Check Logs**: Look for error messages in console output
4. **Test Single Provider**: Set `LLM_PROVIDERS` to just one provider for testing

### All Providers Failing

```
Error: All LLM providers failed:
- MegaLM: API key not configured
- Gemini: Package not installed
- Claude: Invalid API key
```

**Solution**: Ensure at least one provider is properly configured with:
- Valid API key
- Required npm package installed
- Correct model name (if specified)

### Provider-Specific Issues

**MegaLM**:
- Verify `MEGALM_BASE_URL` points to correct endpoint
- Check if service supports OpenAI-compatible API format

**Gemini**:
- Install package: `npm install @google/generative-ai`
- Verify model name (e.g., `gemini-pro`)

**Claude**:
- Check API key starts with `sk-ant-`
- Verify model name is valid (see [Anthropic docs](https://docs.anthropic.com/))

**OpenAI**:
- Install package: `npm install openai`
- Check API key starts with `sk-`
- Verify sufficient credits/quota

## Best Practices

1. **Always Configure Fallback**: Set at least 2 providers to ensure reliability
2. **Order by Priority**: Put your preferred provider first
3. **Monitor Costs**: Different providers have different pricing
4. **Test Configuration**: Use `/status` command to verify setup
5. **Check Logs**: Monitor which providers are being used in production

## Migration from Old Config

If you're upgrading from the old Claude-only setup:

**Old `.env`:**
```env
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

**New `.env` (backward compatible):**
```env
LLM_PROVIDERS=claude
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

**New `.env` (with fallback):**
```env
LLM_PROVIDERS=claude,gemini
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-3-5-sonnet-20241022
GEMINI_API_KEY=your_key_here
```

## Architecture

```
LLMClient (Manages Fallback)
    ├── ProviderFactory (Creates Providers)
    │   ├── ClaudeProvider
    │   ├── GeminiProvider
    │   ├── MegaLMProvider
    │   └── OpenAIProvider
    └── BaseLLMProvider (Common Interface)
```

All providers implement the same interface:
- `sendMessage(message, options)` - Get text response
- `parseJSON(message, options)` - Get JSON response
- `isConfigured()` - Check if provider is ready

This ensures seamless fallback between any provider.

## Real-World Use Cases

### Use Case 1: Cost-Optimized Setup
**Goal**: Minimize LLM costs while maintaining reliability

```env
LLM_PROVIDERS=megalm,gemini
MEGALM_API_KEY=your_key
MEGALM_MODEL=gpt-4o-mini  # Cheap and fast
GEMINI_API_KEY=your_key
```

**Result**: ~90% cost reduction compared to Claude-only setup, with automatic fallback to Gemini if MegaLM has issues.

### Use Case 2: Quality-First with Cost Fallback
**Goal**: Best quality with cheaper fallback

```env
LLM_PROVIDERS=claude,megalm
ANTHROPIC_API_KEY=your_key
CLAUDE_MODEL=claude-3-5-sonnet-20241022
MEGALM_API_KEY=your_key
MEGALM_MODEL=gpt-4o-mini
```

**Result**: Always tries Claude first (best quality), falls back to cheap GPT-4o-mini if Claude has rate limits or downtime.

### Use Case 3: Maximum Reliability
**Goal**: Never fail, always have a working LLM

```env
LLM_PROVIDERS=megalm,claude,gemini,openai
MEGALM_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
GEMINI_API_KEY=your_key
OPENAI_API_KEY=your_key
```

**Result**: 4-layer fallback ensures the system almost never fails due to LLM issues.

### Use Case 4: Single Provider (Simple)
**Goal**: Just use MegaLM's built-in fallback

```env
LLM_PROVIDERS=megalm
MEGALM_API_KEY=your_key
MEGALM_MODEL=gpt-4o
```

**Result**: Simplest setup. MegaLM itself has internal fallback chains, so you get multi-model reliability with one API.

## Performance Tips

### 1. Provider Order Matters
Put faster/cheaper providers first for better response times:
```env
# Fast: gpt-4o-mini responds in ~1-2s
LLM_PROVIDERS=megalm,claude

# Slower: claude-3-5-sonnet can take 3-5s
LLM_PROVIDERS=claude,megalm
```

### 2. Model Selection
Choose models based on your task complexity:

**Simple Tasks** (task parsing, quick responses):
```env
MEGALM_MODEL=gpt-4o-mini      # Fast & cheap
CLAUDE_MODEL=claude-3-haiku   # Fast Claude
GEMINI_MODEL=gemini-pro       # Balanced
```

**Complex Tasks** (daily planning, analysis):
```env
MEGALM_MODEL=gpt-4o           # Better reasoning
CLAUDE_MODEL=claude-3-5-sonnet # Best quality
GEMINI_MODEL=gemini-2.5-pro   # Advanced
```

### 3. Avoid Over-Configuration
More providers = more potential points of failure in startup.

**Good**:
```env
LLM_PROVIDERS=megalm,claude  # 2 providers
```

**Overkill**:
```env
LLM_PROVIDERS=megalm,claude,gemini,openai  # 4 providers
```

Unless you need maximum reliability, 2-3 providers is optimal.

## Cost Comparison

Approximate costs per 1M tokens (as of 2024):

| Provider | Model | Input | Output | Best For |
|----------|-------|-------|--------|----------|
| MegaLM | gpt-4o-mini | $0.15 | $0.60 | Daily use |
| MegaLM | gpt-4o | $2.50 | $10.00 | Quality tasks |
| Claude | claude-3-haiku | $0.25 | $1.25 | Fast tasks |
| Claude | claude-3-5-sonnet | $3.00 | $15.00 | Best quality |
| Gemini | gemini-pro | $0.50 | $1.50 | Balanced |
| OpenAI | gpt-3.5-turbo | $0.50 | $1.50 | Legacy |

**Cost Optimization Example**:
```env
# 90% of tasks use cheap model, 10% fallback to quality
LLM_PROVIDERS=megalm,claude
MEGALM_MODEL=gpt-4o-mini  # $0.15/1M tokens
CLAUDE_MODEL=claude-3-5-sonnet  # $3.00/1M tokens (fallback only)
```

## FAQ

### Q: Can I use only MegaLM and skip other providers?
**A**: Yes! MegaLM is a gateway to 70+ models with built-in fallback. One MegaLM API key gives you access to GPT, Claude, Gemini, and more.

### Q: What happens if my API key runs out of credits?
**A**: The system will log an error and try the next provider in your fallback chain. If all providers fail, user gets an error message.

### Q: Can I change providers without restarting?
**A**: No, you need to restart the application after changing `.env` configuration.

### Q: Do I need to install npm packages for all providers?
**A**: No, only install packages for providers you configured in `LLM_PROVIDERS`. Unused providers won't be loaded.

### Q: Which provider is best for Indonesian language?
**A**:
- **MegaLM with GPT-4o**: Excellent Indonesian support
- **Claude 3.5 Sonnet**: Very good Indonesian
- **Gemini Pro**: Good Indonesian

### Q: Can I use different models for different tasks?
**A**: Currently no. All tasks use the same fallback chain. Future versions may support task-specific routing.

### Q: Is MegaLM the same as running models locally?
**A**: No, MegaLM is a cloud gateway that proxies to various cloud LLMs. It's not running models locally.

### Q: How do I know which provider was used?
**A**: Check logs. Each request logs which provider was attempted and which succeeded:
```
INFO: Attempting to use MegaLM provider
INFO: Successfully used MegaLM provider
```

### Q: Can I set up provider-specific retry logic?
**A**: The fallback system IS the retry logic. Each provider gets one attempt before moving to the next.

### Q: What's the recommended setup for production?
**A**:
```env
LLM_PROVIDERS=megalm,claude
MEGALM_MODEL=gpt-4o-mini  # Cost-effective primary
CLAUDE_MODEL=claude-3-5-sonnet  # Quality fallback
```

This gives you 99.9% uptime with reasonable costs.
