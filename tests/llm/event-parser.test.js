const EventParser = require('../../src/llm/event-parser');

describe('EventParser', () => {
    let parser;
    let mockLlmClient;

    beforeEach(() => {
        mockLlmClient = {
            generateResponse: jest.fn()
        };
        parser = new EventParser(mockLlmClient);
    });

    it('should parse valid event text', async () => {
        const mockResponse = JSON.stringify({
            summary: 'Meeting with John',
            startTime: '2025-12-25T15:00:00.000Z',
            endTime: '2025-12-25T16:00:00.000Z',
            location: 'Office',
            description: 'Discuss project'
        });

        mockLlmClient.generateResponse.mockResolvedValue(mockResponse);

        const result = await parser.parseEvent('Meeting with John tomorrow at 3pm');

        expect(result.summary).toBe('Meeting with John');
        expect(result.startTime).toBeInstanceOf(Date);
        expect(result.endTime).toBeInstanceOf(Date);
        expect(mockLlmClient.generateResponse).toHaveBeenCalled();
    });

    it('should handle markdown code blocks in LLM response', async () => {
        const mockResponse = '```json\n{"summary": "Test"}\n```';
        mockLlmClient.generateResponse.mockResolvedValue(mockResponse);

        const result = await parser.parseEvent('Test event');
        expect(result.summary).toBe('Test');
    });

    it('should throw error on invalid JSON', async () => {
        mockLlmClient.generateResponse.mockResolvedValue('Invalid JSON');

        await expect(parser.parseEvent('Bad input'))
            .rejects.toThrow('Failed to parse event details');
    });
});
