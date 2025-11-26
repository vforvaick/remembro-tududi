const IntentDetector = require('../../src/knowledge-search/intent-detector');

describe('IntentDetector', () => {
  let detector;

  beforeEach(() => {
    detector = new IntentDetector();
  });

  test('should detect search intent from "dulu aku pernah baca"', () => {
    const message = 'dulu aku pernah baca tentang bitcoin timing';
    const intent = detector.detect(message);
    expect(intent.type).toBe('search');
    expect(intent.topic).toContain('bitcoin');
  });

  test('should detect search intent from "apa aja"', () => {
    const message = 'apa aja yang aku tulis tentang trading?';
    const intent = detector.detect(message);
    expect(intent.type).toBe('search');
    expect(intent.topic).toContain('trading');
  });

  test('should detect search intent from "cari"', () => {
    const message = 'cari semua notes tentang productivity';
    const intent = detector.detect(message);
    expect(intent.type).toBe('search');
  });

  test('should detect capture intent from fact statement', () => {
    const message = 'Bitcoin dips before US open biasanya';
    const intent = detector.detect(message);
    expect(intent.type).toBe('capture');
  });

  test('should extract topic from search query', () => {
    const message = 'dulu aku pernah baca tentang technical analysis';
    const intent = detector.detect(message);
    expect(intent.topic).toContain('technical');
  });

  test('should handle "summarize all" command', () => {
    const message = 'summarize semua bitcoin notes';
    const intent = detector.detect(message);
    expect(intent.type).toBe('search');
    expect(intent.action).toBe('summarize_all');
  });

  test('should handle rangkum command (Indonesian)', () => {
    const message = 'rangkum semua notes tentang AI';
    const intent = detector.detect(message);
    expect(intent.type).toBe('search');
    expect(intent.action).toBe('summarize_all');
  });

  test('should extract topic even without "tentang"', () => {
    const message = 'cari cryptocurrency';
    const intent = detector.detect(message);
    expect(intent.type).toBe('search');
    expect(intent.topic).toBeDefined();
  });
});
