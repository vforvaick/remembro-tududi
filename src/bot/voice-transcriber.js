const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const logger = require('../utils/logger');

class VoiceTranscriber {
  constructor(config) {
    this.apiKey = config.apiKey;
    this.apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
  }

  async transcribe(filePath, options = {}) {
    try {
      logger.info(`Transcribing voice file: ${filePath}`);

      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('model', 'whisper-1');

      // Default to Indonesian language
      formData.append('language', options.language || 'id');

      const response = await axios.post(this.apiUrl, formData, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          ...formData.getHeaders()
        }
      });

      const transcription = response.data.text;
      logger.info(`Transcription complete: ${transcription.substring(0, 50)}...`);

      // Clean up temp file
      fs.unlinkSync(filePath);

      return transcription;
    } catch (error) {
      logger.error(`Transcription failed: ${error.message}`);
      throw error;
    }
  }

  async transcribeWithFallback(filePath, options = {}) {
    try {
      // Try Indonesian first
      return await this.transcribe(filePath, { language: 'id', ...options });
    } catch (error) {
      logger.warn('Indonesian transcription failed, trying auto-detect');
      // Fallback to auto-detect language
      return await this.transcribe(filePath, { language: null, ...options });
    }
  }
}

module.exports = VoiceTranscriber;
