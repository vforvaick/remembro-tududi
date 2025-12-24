const ElevenLabsTranscriber = require('../../src/bot/elevenlabs-transcriber');

describe('ElevenLabsTranscriber', () => {
    describe('isConfigured', () => {
        it('should return true when API key is set', () => {
            const transcriber = new ElevenLabsTranscriber({ apiKey: 'test-key' });
            expect(transcriber.isConfigured()).toBe(true);
        });

        it('should return false when API key is not set', () => {
            const transcriber = new ElevenLabsTranscriber({ apiKey: null });
            expect(transcriber.isConfigured()).toBe(false);
        });
    });

    describe('countSpeakers', () => {
        let transcriber;

        beforeEach(() => {
            transcriber = new ElevenLabsTranscriber({ apiKey: 'test-key' });
        });

        it('should count unique speakers', () => {
            const result = {
                words: [
                    { text: 'Hello', speaker: 'speaker_0' },
                    { text: 'Hi', speaker: 'speaker_1' },
                    { text: 'there', speaker: 'speaker_0' }
                ]
            };
            expect(transcriber.countSpeakers(result)).toBe(2);
        });

        it('should return 1 when no word-level data', () => {
            const result = { text: 'Hello world' };
            expect(transcriber.countSpeakers(result)).toBe(1);
        });
    });

    describe('formatDiarizedResult', () => {
        let transcriber;

        beforeEach(() => {
            transcriber = new ElevenLabsTranscriber({ apiKey: 'test-key' });
        });

        it('should format single speaker result', () => {
            const result = {
                text: 'Hello world',
                words: [
                    { text: 'Hello', speaker: 'speaker_0' },
                    { text: 'world', speaker: 'speaker_0' }
                ]
            };

            const formatted = transcriber.formatDiarizedResult(result);
            expect(formatted.speakerCount).toBe(1);
            expect(formatted.segments).toHaveLength(1);
        });

        it('should group by speaker', () => {
            const result = {
                text: 'Hello Hi there',
                words: [
                    { text: 'Hello', speaker: 'speaker_0' },
                    { text: 'Hi', speaker: 'speaker_1' },
                    { text: 'there', speaker: 'speaker_0' }
                ]
            };

            const formatted = transcriber.formatDiarizedResult(result);
            expect(formatted.segments).toHaveLength(3);
            expect(formatted.speakerCount).toBe(2);
        });
    });

    describe('getSpeakerEmoji', () => {
        let transcriber;

        beforeEach(() => {
            transcriber = new ElevenLabsTranscriber({ apiKey: 'test-key' });
        });

        it('should return speaker label with emoji', () => {
            const label = transcriber.getSpeakerEmoji('speaker_0');
            expect(label).toContain('Speaker 1');
        });
    });
});
