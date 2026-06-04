import assert from "node:assert";
import test, { beforeEach, describe, mock } from "node:test";

import logger from "../lib/logger.js";
import redis from "../lib/redis.js";
import { ledgerService } from "../services/ledger.js";
import { checkQuota } from "./quota.js";

describe("checkQuota middleware", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  test("guest IP limit - below threshold allows through", async () => {
    const clientIp = "1.2.3.4";
    const redisGetMap = {
      [`tier:user1`]: "guest",
      [`limit:user1`]: "2000",
      [`usage:ip:${clientIp}`]: "1499",
    };

    mock.method(redis, "get", (key) => Promise.resolve(redisGetMap[key]));
    mock.method(redis, "incr", () => Promise.resolve(1));
    mock.method(redis, "expire", () => Promise.resolve(true));

    mock.method(ledgerService, "hasLedgerBalance", () =>
      Promise.resolve({ has: false, balance: 0 }),
    );
    mock.method(ledgerService, "hasActiveSubscription", () =>
      Promise.resolve(false),
    );
    mock.method(ledgerService, "getTotalConsumption", () => Promise.resolve(0));

    const req = {
      user: { id: "user1", tier: "guest", guest: true },
      headers: { "x-forwarded-for": clientIp },
      socket: { remoteAddress: clientIp },
    };

    let nextCalled = false;
    const res = {
      status() {
        return this;
      },
      json() {
        return this;
      },
    };
    const next = () => {
      nextCalled = true;
    };

    await checkQuota(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.quotaMode, "quota");
  });

  test("guest IP limit - equal to threshold blocks with 403", async () => {
    const clientIp = "5.6.7.8";
    const redisGetMap = {
      [`tier:user1`]: "guest",
      [`limit:user1`]: "2000",
      [`usage:ip:${clientIp}`]: "1500",
    };

    mock.method(redis, "get", (key) => Promise.resolve(redisGetMap[key]));

    mock.method(ledgerService, "hasLedgerBalance", () =>
      Promise.resolve({ has: false, balance: 0 }),
    );
    mock.method(ledgerService, "hasActiveSubscription", () =>
      Promise.resolve(false),
    );
    mock.method(ledgerService, "getTotalConsumption", () => Promise.resolve(0));
    mock.method(logger, "warn", () => {});

    const req = {
      user: { id: "user1", tier: "guest", guest: true },
      headers: { "x-forwarded-for": clientIp },
      socket: { remoteAddress: clientIp },
    };

    let statusCalledWith = null;
    let jsonCalledWith = null;
    const res = {
      status(code) {
        statusCalledWith = code;
        return this;
      },
      json(data) {
        jsonCalledWith = data;
        return this;
      },
    };
    const next = () => {};

    await checkQuota(req, res, next);

    assert.strictEqual(statusCalledWith, 403);
    assert.strictEqual(jsonCalledWith.error, "IP access limit reached");
  });

  test("ledger mode: hasBalance true sets ledger-related fields and passes", async () => {
    mock.method(redis, "get", () => Promise.resolve(null));

    mock.method(ledgerService, "hasLedgerBalance", () =>
      Promise.resolve({ has: true, balance: 1234 }),
    );
    mock.method(ledgerService, "hasActiveSubscription", () =>
      Promise.resolve(false),
    );
    mock.method(logger, "info", () => {});

    const req = {
      user: { id: "u-ledger", tier: "free" },
      headers: {},
      socket: { remoteAddress: "1.1.1.1" },
    };

    let nextCalled = false;
    const res = {
      status() {
        return this;
      },
      json() {
        return this;
      },
    };
    const next = () => {
      nextCalled = true;
    };

    await checkQuota(req, res, next);

    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.quotaMode, "ledger");
    assert.strictEqual(req.ledgerBalance, 1234);
    assert.strictEqual(req.remainingQuota, 1234);
  });

  test("quota mode: usage >= limit returns 403 for guest", async () => {
    mock.method(redis, "get", () => Promise.resolve("1000"));

    mock.method(ledgerService, "hasLedgerBalance", () =>
      Promise.resolve({ has: false, balance: 0 }),
    );
    mock.method(ledgerService, "hasActiveSubscription", () =>
      Promise.resolve(false),
    );
    mock.method(ledgerService, "getTotalConsumption", () =>
      Promise.resolve(1000),
    );
    mock.method(logger, "warn", () => {});

    const req = {
      user: { id: "u-guest-limit", tier: "guest", guest: true },
      headers: {},
      socket: { remoteAddress: "4.4.4.4" },
    };

    let statusCalledWith = null;
    let jsonCalledWith = null;
    const res = {
      status(code) {
        statusCalledWith = code;
        return this;
      },
      json(data) {
        jsonCalledWith = data;
        return this;
      },
    };
    const next = () => {};

    await checkQuota(req, res, next);

    assert.strictEqual(statusCalledWith, 403);
    assert.strictEqual(jsonCalledWith.error, "Quota exceeded");
    assert.strictEqual(jsonCalledWith.limit, 1000);
  });
});
