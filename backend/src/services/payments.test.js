import assert from "node:assert";
import test from "node:test";
import {
  deriveFlowPayMetadataFromReference,
  paymentService,
  resolveFlowPayEntitlement,
} from "./payments.js";

const plans = {
  packages: {
    "1k": {
      id: "1k",
      tokens: 1000,
      price: 49,
      tier_upgrade: "paid_basic",
    },
    "10k": {
      id: "10k",
      tokens: 10000,
      price: 149,
      tier_upgrade: "paid_pro",
    },
  },
  products: {
    pro_analyst: {
      id: "pro_analyst",
      persona_id: "analyst",
      price: 499,
      tier_upgrade: "paid_pro",
    },
  },
};

test("Payment Service - Entitlement Resolution", async (t) => {
  await t.test("should resolve token package tier upgrade by packageId", () => {
    const entitlement = resolveFlowPayEntitlement(
      {
        type: "tokens_purchase",
        packageId: "1k",
      },
      plans,
    );

    assert.deepStrictEqual(entitlement, {
      kind: "token_purchase",
      tokens: 1000,
      tierUpgrade: "paid_basic",
      packageId: "1k",
    });
  });

  await t.test("should resolve legacy token purchase metadata by token amount", () => {
    const entitlement = paymentService.resolveEntitlement(
      {
        type: "tokens_purchase",
        tokens: 10000,
      },
      plans,
    );

    assert.deepStrictEqual(entitlement, {
      kind: "token_purchase",
      tokens: 10000,
      tierUpgrade: "paid_pro",
      packageId: "10k",
    });
  });

  await t.test("should normalize pro subscriptions to paid_pro", () => {
    const entitlement = resolveFlowPayEntitlement({
      type: "pro_subscription",
      plan: "pro",
    });

    assert.deepStrictEqual(entitlement, {
      kind: "subscription",
      tokens: 0,
      tierUpgrade: "paid_pro",
      packageId: null,
      productId: null,
      personaId: null,
    });
  });

  await t.test("should resolve P.R.O product metadata from plans", () => {
    const entitlement = resolveFlowPayEntitlement(
      {
        type: "product_purchase",
        productId: "pro_analyst",
      },
      plans,
    );

    assert.deepStrictEqual(entitlement, {
      kind: "subscription",
      tokens: 0,
      tierUpgrade: "paid_pro",
      packageId: null,
      productId: "pro_analyst",
      personaId: "analyst",
    });
  });

  await t.test("should derive token metadata from NØX FlowPay reference", () => {
    assert.deepStrictEqual(
      deriveFlowPayMetadataFromReference("nox_tokens_1k_abc", plans),
      {
        type: "tokens_purchase",
        packageId: "1k",
        tokens: 1000,
        price: 49,
        tierUpgrade: "paid_basic",
      },
    );
  });

  await t.test("should derive product metadata from NØX FlowPay reference", () => {
    assert.deepStrictEqual(
      deriveFlowPayMetadataFromReference("nox_product_pro_analyst_abc", plans),
      {
        type: "product_purchase",
        productId: "pro_analyst",
        personaId: "analyst",
        price: 499,
        tierUpgrade: "paid_pro",
      },
    );
  });
});

test("Payment Service - Edge Cases & Resilience", async (t) => {
  await t.test("CRASH TEST: should not crash with null metadata", () => {
    try {
      const entitlement = resolveFlowPayEntitlement(null, plans);
      assert.ok(entitlement, "Should return an object even with null input");
    } catch (e) {
      assert.fail(`Service crashed with null metadata: ${e.message}`);
    }
  });

  await t.test("SECURITY: should not default to paid_pro on invalid tier", () => {
    const entitlement = resolveFlowPayEntitlement({
      type: "pro_subscription",
      tier_upgrade: "HACK_OR_TYPO"
    }, plans);
    assert.notStrictEqual(entitlement.tierUpgrade, "paid_pro", "VULNERABILITY: Defaulting to paid_pro on invalid input");
  });

  await t.test("DATA INTEGRITY: should handle missing package values gracefully", () => {
    const entitlement = resolveFlowPayEntitlement({
      type: "tokens_purchase",
      packageId: "NON_EXISTENT"
    }, plans);
    assert.strictEqual(entitlement.tokens, 0, "Should have 0 tokens if package not found");
    assert.strictEqual(entitlement.tierUpgrade, null, "Should not grant tier if package not found");
  });

  await t.test("DATA INTEGRITY: should handle invalid token strings", () => {
    const entitlement = resolveFlowPayEntitlement({
      type: "tokens_purchase",
      tokens: "invalid_string"
    }, plans);
    assert.strictEqual(Number.isFinite(entitlement.tokens), true, "Tokens should be a finite number");
    assert.strictEqual(entitlement.tokens, 0, "Invalid tokens should resolve to 0");
  });
});
