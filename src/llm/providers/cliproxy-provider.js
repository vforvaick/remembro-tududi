const BaseLLMProvider = require('./base-provider');
const logger = require('../../utils/logger');

/**
 * CLIProxyAPI Provider
 * OpenAI-compatible API proxy with multiple backend models
 * Deployed at fight-cuatro:8317
 */
class CLIProxyProvider extends BaseLLMProvider {
    constructor(config) {
        super('CLIProxy', config);

        this.baseURL = config.baseURL || 'http://fight-cuatro:8317/v1';
        this.apiKey = config.apiKey || '';

        // Model routing configuration
        this.models = {
            short: config.modelShort || 'gemini-2.5-flash-lite',
            medium: config.modelMedium || 'gemini-2.5-flash',
            long: config.modelLong || 'gemini-3-pro-preview',
            vision: config.modelVision || 'gemini-3-pro-image-preview'
        };

        this.maxRetries = config.maxRetries || 3;

        logger.info(`${this.name}: Initialized with base URL ${this.baseURL}`);
        logger.info(`${this.name}: Models - short:${this.models.short}, medium:${this.models.medium}, long:${this.models.long}, vision:${this.models.vision}`);
    }

    /**
     * Select model based on input length
     */
    selectModel(inputText) {
        const charCount = inputText?.length || 0;

        if (charCount < 100) {
            return this.models.short;
        } else if (charCount < 500) {
            return this.models.medium;
        } else {
            return this.models.long;
        }
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
                    throw new Error(`HTTP ${response.status}: ${errorText.substring(0, 100)}`);
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

        const modelName = options.model || this.selectModel(userMessage);
        logger.info(`${this.name}: Using model ${modelName}`);

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
     * Send message with image for vision tasks
     */
    async sendMessageWithImage(prompt, imageBuffer, mimeType = 'image/jpeg') {
        if (!this.apiKey) {
            throw new Error(`${this.name}: API key not configured`);
        }

        const modelName = this.models.vision;
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
            models: this.models,
            configured: this.isConfigured()
        };
    }
}

module.exports = CLIProxyProvider;
