const VoiceTranscriber = require('../../src/bot/voice-transcriber');
const axios = require('axios');
const fs = require('fs');

jest.mock('axios');
jest.mock('fs');

describe('VoiceTranscriber', () => {
  let transcriber;

  beforeEach(() => {
    transcriber = new VoiceTranscriber({
      apiKey: 'test-openai-key'
    });
  });

  test('transcribes voice file', async () => {
    const mockFormData = {
      append: jest.fn()
    };

    fs.createReadStream = jest.fn().mockReturnValue('mock-stream');

    axios.post.mockResolvedValue({
      data: {
        text: 'Beli susu anak'
      }
    });

    const result = await transcriber.transcribe('/tmp/voice.ogg');

    expect(result).toBe('Beli susu anak');
    expect(axios.post).toHaveBeenCalledWith(
      'https://api.openai.com/v1/audio/transcriptions',
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-openai-key'
        })
      })
    );
  });

  test('supports Indonesian language', async () => {
    fs.createReadStream = jest.fn().mockReturnValue('mock-stream');

    axios.post.mockResolvedValue({
      data: { text: 'Besok meeting jam 9 pagi' }
    });

    const result = await transcriber.transcribe('/tmp/voice.ogg', {
      language: 'id'
    });

    expect(result).toContain('Besok meeting');
  });

  test('handles transcription errors', async () => {
    fs.createReadStream = jest.fn().mockReturnValue('mock-stream');
    axios.post.mockRejectedValue(new Error('API error'));

    await expect(transcriber.transcribe('/tmp/voice.ogg'))
      .rejects.toThrow('API error');
  });
});
