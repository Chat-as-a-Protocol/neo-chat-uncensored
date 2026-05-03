import assert from "node:assert";
import test from "node:test";
import { resolveFlowPayEntitlement } from "./payments.js";

const plans = {
  packages: { "1k": { id: "1k", tokens: 1000, tier_upgrade: "paid_basic" } },
  products: { pro: { id: "pro", tier_upgrade: "paid_pro" } }
};

test("Payment Service - Stress & Error Reality", async (t) => {
  
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

    // Se o tier for inválido, não deveria ser PRO automaticamente por segurança
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
