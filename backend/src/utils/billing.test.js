import test from 'node:test';
import assert from 'node:assert';
import { countTokensFromText } from './billing.js';

test('Billing Utilities - Unit Tests', async (t) => {
  await t.test('countTokensFromText - should return proportional token count (1:4 ratio)', () => {
    const text = 'Olá mundo'; // 9 chars
    assert.strictEqual(countTokensFromText(text), 3); // ceil(9/4) = 3
    
    const longText = 'Esta é uma frase longa para testar.'; // 35 chars
    assert.strictEqual(countTokensFromText(longText), 9); // ceil(35/4) = 9
  });

  await t.test('countTokensFromText - should handle empty string', () => {
    assert.strictEqual(countTokensFromText(''), 0);
  });
});
