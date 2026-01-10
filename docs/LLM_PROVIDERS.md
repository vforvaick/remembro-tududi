# LLM Processing Architecture

The system uses a modernized, CLIProxy-centric approach for LLM interactions, moving away from legacy multi-provider fallbacks to a structured, two-stage processing pipeline.

## CLIProxy Provider

The `CLIProxyProvider` acts as the unified gateway for all LLM requests. It uses semantic model aliases to ensure the right model is used for the right task while maintaining speed and reliability.

### Model Aliases

| Alias | Recommended Model | Use Case |
|-------|-------------------|----------|
| `flash` | `gemini-2.0-flash` | Fast, empathetic responses and chitchat |
| `pro` | `gemini-2.5-pro-preview` | Strict JSON extraction, complex planning, and analysis |
| `vision` | `gemini-2.0-flash` | Image analysis and OCR |

## Two-Stage Processing Loop

All incoming messages go through a two-stage pipeline in the `MessageOrchestrator`:

### Stage 1: The Extractor (pro)
- **Role**: A strict JSON extraction engine.
- **Task**: Classifies intent, extracts tasks, identifies entities (people, projects), and assigns a confidence score.
- **Context Injection**: Known people and projects are injected into the prompt for accurate entity linking.

### Stage 2: The Companion (flash)
- **Role**: A friendly, empathetic "voice" for the user.
- **Task**: Generates a conversational reply based on the Extractor's output and the system's actions.

## Confirmation Flow (Tentative State)

The system introduces a `tentative` state for unreliable extractions:
1. If the Extractor's `confidence` is low or `needs_confirmation` is true.
2. The Orchestrator halts execution and asks for user confirmation.
3. Once confirmed, the action is executed and a final response is generated.

## Configuration

Set the `CLIPROXY_URL` and `CLIPROXY_API_KEY` in your `.env`:

```env
CLIPROXY_URL=https://your-cliproxy-endpoint.com/v1
CLIPROXY_API_KEY=your_secure_token
```

## Internal Retry Logic

The system still maintains high reliability:
1. **Network Retries**: Built-in retries for transient HTTP errors.
2. **JSON Parsing**: Advanced Markdown code block stripping for robust JSON extraction.
3. **Model Selection**: Automatically selects the most capable model based on the alias requested.

---

## Troubleshooting

### High Latency
- Ensure you are using `flash` for chitchat and `pro` only where complex reasoning is required.
- Check the health of the `CLIProxy` endpoint via `/status`.

### Parsing Errors
- The `parseJSON` method automatically attempts to clean the LLM output. If errors persist, check the Extractor prompt in `src/llm/prompts/extractor-prompt.js`.

### Entity Recognition Issues
- Ensure `PeopleService` and `ProjectService` are correctly populated. The Extractor relies on injected context to link entities correctly.
