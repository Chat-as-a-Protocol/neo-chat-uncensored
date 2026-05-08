import assert from "node:assert";
import test from "node:test";
import redis from "../lib/redis.js";
import { LEDGER_TYPES, ledgerService } from "./ledger.js";

test("Ledger Service - Integration Tests", async (t) => {
  // Setup: Flush redis mock before tests
  if (redis._flush) redis._flush();

  const userId = "test_user_123";

  await t.test("should start with zero balance", async () => {
    const balance = await ledgerService.getBalance(userId);
    assert.strictEqual(balance, 0);
  });

  await t.test("should add a purchase entry (credit)", async () => {
    await ledgerService.addEntry(userId, 1000, "PURCHASE", "ref_1");
    const balance = await ledgerService.getBalance(userId);
    assert.strictEqual(balance, 1000);
  });

  await t.test("should add a consumption entry (debit)", async () => {
    await ledgerService.addEntry(userId, -200, "CONSUMPTION", "ref_2");
    const balance = await ledgerService.getBalance(userId);
    assert.strictEqual(balance, 800);
  });

  await t.test("should calculate daily usage correctly", async () => {
    const today = new Date().toISOString().split("T")[0];
    const usage = await ledgerService.getDailyUsage(userId, today);
    // Note: getDailyUsage returns absolute value of CONSUMPTION
    assert.strictEqual(usage, 200);
  });

  await t.test(
    "should calculate guest daily token usage from canonical ledger entries",
    async () => {
      const today = new Date().toISOString().split("T")[0];
      const guestId = "guest_quota_regression";

      // Setup: Add initial credit to allow debits
      await ledgerService.addEntry(
        guestId,
        2000,
        "TEST_CREDIT",
        "guest_setup_credit",
      );

      await ledgerService.addEntry(
        guestId,
        -904,
        LEDGER_TYPES.TOKEN_CONSUMPTION,
        "guest_chat_904",
      );
      await ledgerService.addEntry(
        guestId,
        1000,
        LEDGER_TYPES.TOKEN_PURCHASE,
        "guest_credit_ignored",
      );
      await ledgerService.addEntry(
        guestId,
        -50,
        "OTHER_DEBIT",
        "guest_other_debit_ignored",
      );

      const usage = await ledgerService.getDailyUsage(guestId, today);
      assert.strictEqual(usage, 904);
    },
  );

  await t.test("should ignore token consumption from outside the requested day", async () => {
    const today = new Date().toISOString().split("T")[0];
    const guestId = "guest_previous_day_regression";
    const previousDay = Date.now() - 86400000;

    await redis.lpush(
      `ledger:${guestId}`,
      JSON.stringify({
        id: "previous-day-entry",
        userId: guestId,
        amount: -500,
        type: LEDGER_TYPES.TOKEN_CONSUMPTION,
        reference: "previous_day_chat",
        createdAt: previousDay,
      }),
    );

    // Setup: Add credit to compensate manual lpush and allow new debit
    await ledgerService.addEntry(
      guestId,
      1000,
      "TEST_CREDIT",
      "previous_day_setup_credit",
    );

    await ledgerService.addEntry(
      guestId,
      -125,
      LEDGER_TYPES.TOKEN_CONSUMPTION,
      "current_day_chat",
    );

    const usage = await ledgerService.getDailyUsage(guestId, today);
    assert.strictEqual(usage, 125);
  });

  await t.test("should return full statement sorted by date", async () => {
    const statement = await ledgerService.getStatement(userId);
    assert.strictEqual(statement.length, 2);
    assert.strictEqual(statement[0].reference, "ref_2"); // Newest first
    assert.strictEqual(statement[1].reference, "ref_1");
  });

  await t.test("should handle multiple users independently", async () => {
    const user2 = "other_user";
    await ledgerService.addEntry(user2, 500, "TOPUP", "ref_3");

    const balance1 = await ledgerService.getBalance(userId);
    const balance2 = await ledgerService.getBalance(user2);

    assert.strictEqual(balance1, 800);
    assert.strictEqual(balance2, 500);
  });

  await t.test(
    "should be idempotent (ignore duplicate references)",
    async () => {
      const user3 = "idempotent_user";
      const ref = "unique_payment_id";

      // First try
      const first = await ledgerService.addEntry(user3, 100, "PURCHASE", ref);
      assert.notStrictEqual(first, null);

      // Second try with same reference
      const second = await ledgerService.addEntry(user3, 100, "PURCHASE", ref);
      assert.strictEqual(second, null);

      const balance = await ledgerService.getBalance(user3);
      assert.strictEqual(balance, 100); // Should only have counted once
    },
  );

  await t.test(
    "should throw INSUFFICIENT_FUNDS when balance is zero",
    async () => {
      const brokeUserId = "broke_user_test";

      // Tenta debitar sem ter saldo
      await assert.rejects(
        ledgerService.addEntry(
          brokeUserId,
          -1,
          LEDGER_TYPES.TOKEN_CONSUMPTION,
          "ref_fail",
        ),
        { message: "INSUFFICIENT_FUNDS" },
      );

      // Verifica se o saldo permanece zero
      const balance = await ledgerService.getBalance(brokeUserId);
      assert.strictEqual(balance, 0);
    },
  );
});

test("Ledger Service - Entitlement Helpers", async (t) => {
  if (redis._flush) redis._flush();

  // ── hasLedgerBalance ──────────────────────────────────────────

  await t.test("hasLedgerBalance → false when balance is zero", async () => {
    const userId = "balance_zero_user";
    const result = await ledgerService.hasLedgerBalance(userId);
    assert.strictEqual(result.has, false);
    assert.strictEqual(result.balance, 0);
  });

  await t.test("hasLedgerBalance → true after TOKEN_PURCHASE", async () => {
    const userId = "balance_positive_user";
    await ledgerService.addEntry(userId, 1000, LEDGER_TYPES.TOKEN_PURCHASE, "pay_1k_abc");
    const result = await ledgerService.hasLedgerBalance(userId);
    assert.strictEqual(result.has, true);
    assert.strictEqual(result.balance, 1000);
  });

  await t.test("hasLedgerBalance → false after full consumption", async () => {
    const userId = "balance_depleted_user";
    await ledgerService.addEntry(userId, 500, LEDGER_TYPES.TOKEN_PURCHASE, "pay_500");
    await ledgerService.addEntry(userId, -500, LEDGER_TYPES.TOKEN_CONSUMPTION, "chat_500");
    const result = await ledgerService.hasLedgerBalance(userId);
    assert.strictEqual(result.has, false);
    assert.strictEqual(result.balance, 0);
  });

  // ── hasActiveSubscription ─────────────────────────────────────

  await t.test("hasActiveSubscription → false with no entries", async () => {
    const userId = "sub_none_user";
    const has = await ledgerService.hasActiveSubscription(userId);
    assert.strictEqual(has, false);
  });

  await t.test("hasActiveSubscription → false with only TOKEN_PURCHASE (paid_basic path)", async () => {
    const userId = "sub_token_only_user";
    await ledgerService.addEntry(userId, 1000, LEDGER_TYPES.TOKEN_PURCHASE, "pay_tokens_only");
    const has = await ledgerService.hasActiveSubscription(userId);
    assert.strictEqual(has, false);
  });

  await t.test("hasActiveSubscription → true after PRO_SUBSCRIPTION (pro_analyst path)", async () => {
    const userId = "sub_pro_user";
    await ledgerService.addEntry(userId, 0, LEDGER_TYPES.PRO_SUBSCRIPTION, "pay_pro_analyst_abc");
    const has = await ledgerService.hasActiveSubscription(userId);
    assert.strictEqual(has, true);
  });

  await t.test("hasActiveSubscription → true even when balance is zero (no 402 for PRO)", async () => {
    const userId = "sub_pro_zero_balance_user";
    // Simula pro_analyst sem tokens avulsos: amount=0, PRO_SUBSCRIPTION
    await ledgerService.addEntry(userId, 0, LEDGER_TYPES.PRO_SUBSCRIPTION, "pay_pro_no_tokens");
    const [{ has: hasBalance }, hasSubscription] = await Promise.all([
      ledgerService.hasLedgerBalance(userId),
      ledgerService.hasActiveSubscription(userId),
    ]);
    // Este é o caso crítico: balance=0 mas assinatura ativa → SUBSCRIPTION MODE, não 402
    assert.strictEqual(hasBalance, false);
    assert.strictEqual(hasSubscription, true);
  });

  await t.test(
    "should allow negative balance when options.allowNegative is true",
    async () => {
      const negativeUser = "negative_user_test";

      // Tenta debitar sem saldo, mas passando allowNegative
      const entry = await ledgerService.addEntry(
        negativeUser,
        -100,
        LEDGER_TYPES.TOKEN_CONSUMPTION,
        "ref_negative",
        { allowNegative: true },
      );

      assert.notStrictEqual(entry, null);
      assert.strictEqual(entry.balanceAfter, -100);

      // Verifica se o saldo ficou negativo
      const balance = await ledgerService.getBalance(negativeUser);
      assert.strictEqual(balance, -100);
    },
  );
});

