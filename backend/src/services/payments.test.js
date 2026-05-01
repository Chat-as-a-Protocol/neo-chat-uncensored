import assert from "node:assert";
import test from "node:test";
import { paymentService, resolveFlowPayEntitlement } from "./payments.js";

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
});
