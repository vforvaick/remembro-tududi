/**
 * ElevenLabs Transcriber with Diarization
 * 
 * Uses ElevenLabs Scribe API for speech-to-text with speaker diarization.
 */

const fs = require('fs');
const logger = require('../utils/logger');

class ElevenLabsTranscriber {
    constructor(config) {
        this.apiKey = config.apiKey;
        this._client = null; // Lazy initialized
    }

    /**
     * Get or create the ElevenLabs client
     */
    get client() {
        if (!this._client && this.apiKey) {
            const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
            this._client = new ElevenLabsClient({ apiKey: this.apiKey });
        }
        return this._client;
    }

    /**
     * Check if transcriber is configured
     * @returns {boolean} True if API key is set
     */
    isConfigured() {
        return !!this.apiKey;
    }

    /**
     * Transcribe audio with speaker diarization
     * @param {string} filePath - Path to audio file
     * @param {Object} options - Transcription options
     * @returns {Promise<Object>} Transcription result with speaker labels
     */
    async transcribeWithDiarization(filePath, options = {}) {
        try {
            logger.info(`Transcribing with ElevenLabs Scribe: ${filePath}`);

            const result = await this.client.speechToText.convert({
                file: fs.createReadStream(filePath),
                model_id: 'scribe_v1',
                diarize: true,
                language_code: options.language || 'id' // Default to Indonesian
            });

            logger.info(`Transcription complete with ${this.countSpeakers(result)} speaker(s)`);

            // Clean up temp file
            try {
                fs.unlinkSync(filePath);
            } catch (e) {
                logger.warn(`Failed to delete temp file: ${e.message}`);
            }

            return this.formatDiarizedResult(result);
        } catch (error) {
            logger.error(`ElevenLabs transcription failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Count unique speakers in result
     * @param {Object} result - API response
     * @returns {number} Number of speakers
     */
    countSpeakers(result) {
        if (!result.words) return 1;
        const speakers = new Set(result.words.map(w => w.speaker).filter(Boolean));
        return speakers.size || 1;
    }

    /**
     * Format the diarized result for display
     * @param {Object} result - API response
     * @returns {Object} Formatted result
     */
    formatDiarizedResult(result) {
        // Build segments grouped by speaker
        const segments = [];
        let currentSpeaker = null;
        let currentText = '';

        if (result.words && result.words.length > 0) {
            result.words.forEach(word => {
                const speaker = word.speaker || 'Speaker 0';

                if (speaker !== currentSpeaker) {
                    if (currentText) {
                        segments.push({
                            speaker: currentSpeaker,
                            text: currentText.trim()
                        });
                    }
                    currentSpeaker = speaker;
                    currentText = word.text;
                } else {
                    currentText += ' ' + word.text;
                }
            });

            // Add final segment
            if (currentText) {
                segments.push({
                    speaker: currentSpeaker,
                    text: currentText.trim()
                });
            }
        } else {
            // Fallback to full text if no word-level data
            segments.push({
                speaker: 'Speaker 0',
                text: result.text || ''
            });
        }

        return {
            text: result.text,
            segments,
            speakerCount: this.countSpeakers(result),
            formatted: this.formatForTelegram(segments)
        };
    }

    /**
     * Format diarized segments for Telegram display
     * @param {Array} segments - Speaker segments
     * @returns {string} Formatted message
     */
    formatForTelegram(segments) {
        if (segments.length <= 1) {
            // Single speaker, just return the text
            return segments[0]?.text || '';
        }

        // Multiple speakers, format with labels
        return segments.map(seg => {
            const speakerLabel = this.getSpeakerEmoji(seg.speaker);
            return `${speakerLabel} ${seg.text}`;
        }).join('\n\n');
    }

    /**
     * Get emoji for speaker label
     * @param {string} speaker - Speaker identifier
     * @returns {string} Emoji + label
     */
    getSpeakerEmoji(speaker) {
        const speakerNum = parseInt(speaker.replace(/\D/g, ''), 10) || 0;
        const emojis = ['👤', '👥', '🗣️', '💬', '🎤', '🔊'];
        return `${emojis[speakerNum % emojis.length]} *Speaker ${speakerNum + 1}:*`;
    }
}

module.exports = ElevenLabsTranscriber;
