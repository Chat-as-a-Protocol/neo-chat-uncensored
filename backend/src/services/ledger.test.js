import assert from "node:assert";
import test, { beforeEach, describe, mock } from "node:test";
import redis from "../lib/redis.js";
import { ledgerService, LEDGER_TYPES } from "./ledger.js";

describe("Ledger Service - Unit Tests", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  test("TOKEN_GRANT increases balance", async () => {
    const userId = "user123";
    const amount = 500;
    const type = LEDGER_TYPES.TOKEN_GRANT;
    const reference = "test_grant";

    const redisEntries = [];
    mock.method(redis, "sadd", () => Promise.resolve(1));
    mock.method(redis, "lpush", (_, value) => {
      redisEntries.push(value);
      return Promise.resolve(1);
    });
    mock.method(redis, "lrange", () => Promise.resolve(redisEntries));

    const result = await ledgerService.addEntry(userId, amount, type, reference);

    assert.strictEqual(result.userId, userId);
    assert.strictEqual(result.amount, amount);
    assert.strictEqual(result.type, type);
    assert.strictEqual(result.reference, reference);
    assert.strictEqual(result.balanceAfter, amount);
  });

  test("TOKEN_PURCHASE is valid and increases balance", async () => {
    const userId = "user123";
    const amount = 1000;
    const type = LEDGER_TYPES.TOKEN_PURCHASE;
    const reference = "test_purchase";

    const redisEntries = [];
    mock.method(redis, "sadd", () => Promise.resolve(1));
    mock.method(redis, "lpush", (_, value) => {
      redisEntries.push(value);
      return Promise.resolve(1);
    });
    mock.method(redis, "lrange", () => Promise.resolve(redisEntries));

    const result = await ledgerService.addEntry(userId, amount, type, reference);

    assert.strictEqual(result.amount, amount);
    assert.strictEqual(result.type, type);
    assert.strictEqual(result.balanceAfter, amount);
  });
});
