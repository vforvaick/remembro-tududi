const logger = require('../utils/logger');

const PHOTO_PARSE_PROMPT = `You are a task extraction assistant. Analyze this image and extract any actionable tasks or todo items you can see.

The image may contain:
- Handwritten notes or todo lists
- Whiteboard photos with action items
- Screenshots of chat/email with action items
- Printed documents with tasks

USER CONTEXT:
- User lives in Indonesia (WIB timezone)  
- Uses mixed Indonesian and English
- Has ADHD (prefers clear, concise task titles)

EXTRACTION RULES:
1. Extract ONLY actionable tasks (not information or notes)
2. Make task titles clear and concise
3. If you see dates/times, parse them
4. If you see priorities (urgent, penting, etc.), include them
5. If no tasks found, return empty array

OUTPUT FORMAT (JSON only):
{
  "summary": "Brief description of what you see in the image",
  "potential_tasks": [
    {
      "title": "Task title",
      "sequence_order": 1,
      "priority": "high/medium/low",
      "context": "Why this task (from image context)",
      "due_date": "YYYY-MM-DD or null"
    }
  ],
  "people_mentioned": ["names seen in image"]
}`;

/**
 * PhotoParser - Extracts tasks from images using Gemini Vision
 */
class PhotoParser {
    constructor(geminiProvider) {
        this.gemini = geminiProvider;
    }

    /**
     * Parse image and extract tasks
     * @param {Buffer} imageBuffer - Image data
     * @param {string} mimeType - MIME type (image/jpeg, image/png, etc.)
     */
    async parse(imageBuffer, mimeType = 'image/jpeg') {
        try {
            logger.info(`PhotoParser: Parsing image (${mimeType})`);

            if (!this.gemini || !this.gemini.isVisionConfigured()) {
                throw new Error('Gemini Vision not configured. Set GEMINI_API_KEY.');
            }

            const response = await this.gemini.sendMessageWithImage(
                PHOTO_PARSE_PROMPT,
                imageBuffer,
                mimeType
            );

            // Parse JSON response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn('PhotoParser: No JSON found in response');
                return {
                    summary: 'Could not parse image',
                    potential_tasks: [],
                    people_mentioned: []
                };
            }

            const parsed = JSON.parse(jsonMatch[0]);
            logger.info(`PhotoParser: Extracted ${parsed.potential_tasks?.length || 0} potential tasks`);

            return {
                summary: parsed.summary || 'Image analyzed',
                potential_tasks: parsed.potential_tasks || [],
                people_mentioned: parsed.people_mentioned || []
            };
        } catch (error) {
            logger.error(`PhotoParser: Failed to parse image: ${error.message}`);
            throw error;
        }
    }

    /**
     * Check if parser is ready
     */
    isConfigured() {
        return this.gemini && this.gemini.isVisionConfigured();
    }
}

module.exports = PhotoParser;
