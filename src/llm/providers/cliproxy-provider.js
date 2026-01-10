const BaseLLMProvider = require('./base-provider');
const logger = require('../../utils/logger');

/**
 * CLIProxyAPI Provider
 * OpenAI-compatible API proxy with multiple backend models
 * Deployed at fight-dos:8317
 *
 * Model Strategy:
 * - 'flash': Fast, cheap, good for empathetic replies (gemini-2.0-flash)
 * - 'pro': Slower, smarter, for strict JSON extraction (gemini-2.5-pro-preview)
 * - 'vision': For image analysis
 */
class CLIProxyProvider extends BaseLLMProvider {
    constructor(config) {
        super('CLIProxy', config);

        this.baseURL = config.baseURL || 'http://fight-dos:8317/v1';
        this.apiKey = config.apiKey || '';

        // Model aliases - use these in options.model
        this.modelAliases = {
            flash: config.modelFlash || 'gemini-2.0-flash',
            pro: config.modelPro || 'gemini-2.5-pro-preview',
            vision: config.modelVision || 'gemini-2.0-flash' // flash supports vision
        };

        // Default model for general use
        this.defaultModel = config.defaultModel || 'flash';

        this.maxRetries = config.maxRetries || 3;

        logger.info(`${this.name}: Initialized with base URL ${this.baseURL}`);
        logger.info(`${this.name}: Models - flash:${this.modelAliases.flash}, pro:${this.modelAliases.pro}, vision:${this.modelAliases.vision}`);
    }

    /**
     * Resolve model alias to actual model name
     * @param {string} modelOrAlias - 'flash', 'pro', or an actual model name
     * @returns {string} Resolved model name
     */
    resolveModel(modelOrAlias) {
        if (!modelOrAlias) {
            return this.modelAliases[this.defaultModel];
        }
        // Check if it's an alias
        if (this.modelAliases[modelOrAlias]) {
            return this.modelAliases[modelOrAlias];
        }
        // Otherwise, use as-is (it's a direct model name)
        return modelOrAlias;
    }

    async _makeRequest(endpoint, body, retries = this.maxRetries) {
        const url = `${this.baseURL}${endpoint}`;

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.apiKey}`
                    },
                    body: JSON.stringify(body)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 200)}`);
                }

                return await response.json();
            } catch (error) {
                const isRetryable = error.message.includes('429') ||
                    error.message.includes('500') ||
                    error.message.includes('502') ||
                    error.message.includes('503');

                if (isRetryable && attempt < retries - 1) {
                    const delay = Math.pow(2, attempt) * 1000;
                    logger.warn(`${this.name}: Retry ${attempt + 1}/${retries} after ${delay}ms`);
                    await new Promise(r => setTimeout(r, delay));
                } else {
                    throw error;
                }
            }
        }
    }

    async sendMessage(userMessage, options = {}) {
        if (!this.apiKey) {
            throw new Error(`${this.name}: API key not configured`);
        }

        const modelName = this.resolveModel(options.model);
        logger.info(`${this.name}: Using model ${modelName} (alias: ${options.model || this.defaultModel})`);

        // Build messages array
        const messages = [];
        if (options.systemPrompt) {
            messages.push({ role: 'system', content: options.systemPrompt });
        }
        messages.push({ role: 'user', content: userMessage });

        const result = await this._makeRequest('/chat/completions', {
            model: modelName,
            messages: messages,
            max_tokens: options.maxTokens || 4096
        });

        const responseText = result.choices?.[0]?.message?.content;
        if (!responseText) {
            throw new Error('Invalid response structure from CLIProxy API');
        }

        logger.info(`${this.name}: Received response from ${modelName}`);
        return responseText;
    }

    /**
     * Send message and parse JSON response
     * Uses 'pro' model by default for better accuracy
     */
    async parseJSON(userMessage, options = {}) {
        // Default to 'pro' for JSON parsing tasks
        const modelToUse = options.model || 'pro';
        const response = await this.sendMessage(userMessage, { ...options, model: modelToUse });

        // Extract JSON from response (handle markdown code blocks)
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```json')) {
            jsonStr = jsonStr.slice(7);
        } else if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.slice(3);
        }
        if (jsonStr.endsWith('```')) {
            jsonStr = jsonStr.slice(0, -3);
        }
        jsonStr = jsonStr.trim();

        try {
            return JSON.parse(jsonStr);
        } catch (parseError) {
            logger.error(`Failed to parse JSON response: ${jsonStr.substring(0, 200)}`);
            throw new Error(`Failed to parse JSON: ${parseError.message}`);
        }
    }

    /**
     * Send message with image for vision tasks
     */
    async sendMessageWithImage(prompt, imageBuffer, mimeType = 'image/jpeg') {
        if (!this.apiKey) {
            throw new Error(`${this.name}: API key not configured`);
        }

        const modelName = this.modelAliases.vision;
        logger.info(`${this.name}: Vision with ${modelName}`);

        const base64Image = imageBuffer.toString('base64');
        const dataUrl = `data:${mimeType};base64,${base64Image}`;

        const result = await this._makeRequest('/chat/completions', {
            model: modelName,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: prompt },
                        { type: 'image_url', image_url: { url: dataUrl } }
                    ]
                }
            ],
            max_tokens: 4096
        });

        const responseText = result.choices?.[0]?.message?.content;
        if (!responseText) {
            throw new Error('Invalid response structure from CLIProxy Vision API');
        }

        logger.info(`${this.name}: Received vision response`);
        return responseText;
    }

    isConfigured() {
        return !!this.apiKey && !!this.baseURL;
    }

    isVisionConfigured() {
        return this.isConfigured();
    }

    getStats() {
        return {
            baseURL: this.baseURL,
            models: this.modelAliases,
            defaultModel: this.defaultModel,
            configured: this.isConfigured()
        };
    }
}

module.exports = CLIProxyProvider;
