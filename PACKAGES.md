# Package Dependencies

This document tracks important notes about package dependencies.

## Optional Dependencies

### @google/generative-ai (Gemini Provider)

**Status**: ⚠️ **Monitoring for deprecation/maintenance issues**

**Current Version**: ^0.21.0

**Purpose**: Provides Google Gemini API integration for the Gemini LLM provider.

**Installation**:
```bash
npm install @google/generative-ai
```

**Notes**:
- This package is marked as optional dependency
- Only required if using `LLM_PROVIDERS=gemini`
- System will gracefully skip Gemini provider if package is not installed
- Monitor official Google AI documentation for migration recommendations

**Monitoring**:
- Check package status: https://www.npmjs.com/package/@google/generative-ai
- Official docs: https://ai.google.dev/
- Report issues: https://github.com/google/generative-ai-js/issues

**Migration Plan** (if deprecated):
1. Check official Google AI SDK documentation for recommended alternatives
2. Evaluate alternatives:
   - Direct REST API implementation (no SDK dependency)
   - OpenAI-compatible proxies
   - Alternative Google SDK packages
3. Update `src/llm/providers/gemini-provider.js` with new implementation
4. Update installation documentation
5. Test full integration before removing old package
6. Update `package.json` to remove or replace dependency

**Action Items**:
- [ ] Quarterly check of package maintenance status
- [ ] Monitor for official deprecation announcements
- [ ] Keep documentation updated with latest SDK version

---

### openai (OpenAI Provider)

**Status**: ✅ **Actively maintained**

**Current Version**: ^4.73.0

**Purpose**: Provides OpenAI API integration for GPT models.

**Installation**:
```bash
npm install openai
```

**Notes**:
- Also used for Whisper voice transcription (required dependency for voice features)
- Marked as optional only for LLM provider functionality
- If using voice features, this becomes a required dependency

---

## Required Dependencies

### @anthropic-ai/sdk (Claude Provider)

**Status**: ✅ **Actively maintained**

**Current Version**: ^0.69.0

**Purpose**: Provides Anthropic Claude API integration.

**Notes**:
- Included in main dependencies
- Required for default LLM provider

---

### axios (MegaLM Provider & HTTP)

**Status**: ✅ **Actively maintained**

**Current Version**: ^1.13.2

**Purpose**: HTTP client for MegaLM API and other HTTP operations.

**Notes**:
- Included in main dependencies
- Used by MegaLM provider for OpenAI-compatible API calls
- General-purpose HTTP client for the application

---

## Dependency Maintenance

### Update Policy

1. **Security Updates**: Apply immediately
2. **Minor Updates**: Review changelog, test, then apply
3. **Major Updates**: Evaluate breaking changes, plan migration, test thoroughly

### Monitoring

Check dependencies monthly:
```bash
npm outdated
npm audit
```

### Testing After Updates

Run full test suite:
```bash
npm test
npm run dev  # Manual testing with all providers
```

---

## Related Documentation

- [LLM Providers Guide](docs/LLM_PROVIDERS.md) - Provider configuration and usage
- [Setup Guide](docs/SETUP.md) - Installation instructions
- [package.json](package.json) - Dependency versions
