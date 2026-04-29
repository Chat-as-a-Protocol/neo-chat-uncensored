import test from 'node:test';
import assert from 'node:assert';
import { ledgerService } from './ledger.js';
import redis from '../lib/redis.js';

test('Ledger Service - Integration Tests', async (t) => {
  // Setup: Flush redis mock before tests
  if (redis._flush) redis._flush();

  const userId = 'test_user_123';

  await t.test('should start with zero balance', async () => {
    const balance = await ledgerService.getBalance(userId);
    assert.strictEqual(balance, 0);
  });

  await t.test('should add a purchase entry (credit)', async () => {
    await ledgerService.addEntry(userId, 1000, 'PURCHASE', 'ref_1');
    const balance = await ledgerService.getBalance(userId);
    assert.strictEqual(balance, 1000);
  });

  await t.test('should add a consumption entry (debit)', async () => {
    await ledgerService.addEntry(userId, -200, 'CONSUMPTION', 'ref_2');
    const balance = await ledgerService.getBalance(userId);
    assert.strictEqual(balance, 800);
  });

  await t.test('should calculate daily usage correctly', async () => {
    const today = new Date().toISOString().split('T')[0];
    const usage = await ledgerService.getDailyUsage(userId, today);
    // Note: getDailyUsage returns absolute value of CONSUMPTION
    assert.strictEqual(usage, 200);
  });

  await t.test('should return full statement sorted by date', async () => {
    const statement = await ledgerService.getStatement(userId);
    assert.strictEqual(statement.length, 2);
    assert.strictEqual(statement[0].reference, 'ref_2'); // Newest first
    assert.strictEqual(statement[1].reference, 'ref_1');
  });

  await t.test('should handle multiple users independently', async () => {
    const user2 = 'other_user';
    await ledgerService.addEntry(user2, 500, 'TOPUP', 'ref_3');
    
    const balance1 = await ledgerService.getBalance(userId);
    const balance2 = await ledgerService.getBalance(user2);
    
    assert.strictEqual(balance1, 800);
    assert.strictEqual(balance2, 500);
  });

  await t.test('should be idempotent (ignore duplicate references)', async () => {
    const user3 = 'idempotent_user';
    const ref = 'unique_payment_id';
    
    // First try
    const first = await ledgerService.addEntry(user3, 100, 'PURCHASE', ref);
    assert.notStrictEqual(first, null);
    
    // Second try with same reference
    const second = await ledgerService.addEntry(user3, 100, 'PURCHASE', ref);
    assert.strictEqual(second, null);
    
    const balance = await ledgerService.getBalance(user3);
    assert.strictEqual(balance, 100); // Should only have counted once
  });
});
