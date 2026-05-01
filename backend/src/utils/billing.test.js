import test from 'node:test';
import assert from 'node:assert';
import { countTokensFromText } from './billing.js';

test('Billing Utilities - Unit Tests (Tiktoken)', async (t) => {
  await t.test('countTokensFromText - should return precise token count', () => {
    // 'How are you?' -> 4 tokens
    assert.strictEqual(countTokensFromText('How are you?'), 4);
    
    // Texto vazio
    assert.strictEqual(countTokensFromText(''), 0);
  });

  await t.test('countTokensFromText - should handle PT-BR specific tokens', () => {
    // 'Olá mundo' -> Tiktoken cl100k_base geralmente conta como 4 ou 5 tokens
    const count = countTokensFromText('Olá mundo');
    assert.ok(count >= 3 && count <= 5);
  });
});
