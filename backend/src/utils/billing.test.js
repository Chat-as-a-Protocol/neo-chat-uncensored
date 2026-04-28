import test from 'node:test';
import assert from 'node:assert';
import { estimateTokensFromChunk, estimateTokensFromText } from './billing.js';

test('Billing Utilities - Unit Tests', async (t) => {
  await t.test('estimateTokensFromChunk - should count chunks with content', () => {
    const chunk = 'data: {"choices":[{"delta":{"content":"Olá"}}]}\ndata: {"choices":[{"delta":{"content":" mundo"}}]}';
    assert.strictEqual(estimateTokensFromChunk(chunk), 2);
  });

  await t.test('estimateTokensFromChunk - should return 0 for empty or meta chunks', () => {
    const chunk = 'data: [DONE]';
    assert.strictEqual(estimateTokensFromChunk(chunk), 0);
    assert.strictEqual(estimateTokensFromChunk(''), 0);
  });

  await t.test('estimateTokensFromText - should return proportional token count', () => {
    const text = 'Olá mundo'; // 9 chars
    assert.strictEqual(estimateTokensFromText(text), 3);
  });

  await t.test('estimateTokensFromText - should handle empty string', () => {
    assert.strictEqual(estimateTokensFromText(''), 0);
  });
});
