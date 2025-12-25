/**
 * Event Parser Service
 * 
 * Uses LLM to extract calendar event details from natural language.
 */

const logger = require('../utils/logger');

class EventParser {
    constructor(llmClient) {
        this.llmClient = llmClient;
    }

    /**
     * Parse natural language into structured event details
     * @param {string} text - User input text (e.g., "Meeting tomorrow at 3pm")
     * @returns {Promise<Object>} Structured event object
     */
    async parseEvent(text) {
        const now = new Date();
        const systemPrompt = `
You are an AI assistant that extracts calendar event details from text.
Current time: ${now.toISOString()} (${now.toLocaleDateString('en-US', { weekday: 'long' })})
Timezone: Asia/Jakarta

Extract the following fields in JSON format:
- summary: Event title (string)
- startTime: ISO 8601 string (absolute time based on current time)
- endTime: ISO 8601 string (default to 1 hour duration if not specified)
- location: Location/Venue (string, optional)
- description: Additional details (string, optional)

Rules:
1. If "tomorrow" is mentioned, calculate the date based on current time.
2. If time is missing, default to 09:00 AM next occurrence.
3. If duration is missing, default to 1 hour.
4. Return ONLY raw JSON. No markdown formatting.
`;

        try {
            const response = await this.llmClient.generateResponse(text, systemPrompt);
            const cleanJson = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const eventData = JSON.parse(cleanJson);

            // Convert strings to Date objects for validation
            eventData.startTime = new Date(eventData.startTime);
            eventData.endTime = new Date(eventData.endTime);

            return eventData;
        } catch (error) {
            logger.error(`Event parsing failed: ${error.message}`);
            throw new Error('Failed to parse event details from text.');
        }
    }
}

module.exports = EventParser;
