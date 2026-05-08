import test, { describe } from "node:test";
import assert from "node:assert";
import {
  deriveFlowPayMetadataFromReference,
  resolveFlowPayEntitlement,
} from "./payments.js";

describe("Payments Service - Unit Tests", () => {
  describe("deriveFlowPayMetadataFromReference", () => {
    test("should return empty object for invalid reference", () => {
      const result = deriveFlowPayMetadataFromReference("", {});
      assert.deepStrictEqual(result, {});
    });

    test("should derive metadata for valid token purchase reference", () => {
      const plans = {
        packages: {
          "1k": { tokens: 1000, price: 10, tier: "free" },
        },
      };
      const result = deriveFlowPayMetadataFromReference(
        "nox_tokens_1k_uuid",
        plans,
      );
      assert.deepStrictEqual(result, {
        type: "tokens_purchase",
        packageId: "1k",
        tokens: 1000,
        price: 10,
        tierUpgrade: "free",
      });
    });

    test("should return empty object if package not found", () => {
      const plans = { packages: {} };
      const result = deriveFlowPayMetadataFromReference(
        "nox_tokens_1k_uuid",
        plans,
      );
      assert.deepStrictEqual(result, {});
    });
  });

  describe("resolveFlowPayEntitlement", () => {
    test("should return unknown for invalid metadata", () => {
      const result = resolveFlowPayEntitlement(null, {});
      assert.strictEqual(result.kind, "unknown");
    });

    test("should return unknown for missing type", () => {
      const result = resolveFlowPayEntitlement({}, {});
      assert.strictEqual(result.kind, "unknown");
    });

    test("should resolve token purchase entitlement", () => {
      const metadata = {
        type: "token_purchase",
        tokens: 1000,
        packageId: "1k",
      };
      const result = resolveFlowPayEntitlement(metadata, {});
      assert.strictEqual(result.kind, "token_purchase");
      assert.strictEqual(result.tokens, 1000);
      assert.strictEqual(result.packageId, "1k");
    });

    test("should fallback to package tokens if metadata tokens missing", () => {
      const metadata = {
        type: "token_purchase",
        packageId: "1k",
      };
      const plans = {
        packages: {
          "1k": { tokens: 1000 },
        },
      };
      const result = resolveFlowPayEntitlement(metadata, plans);
      assert.strictEqual(result.kind, "token_purchase");
      assert.strictEqual(result.tokens, 1000);
    });

    test("should return unknown if tokens <= 0", () => {
      const metadata = {
        type: "token_purchase",
        tokens: 0,
      };
      const result = resolveFlowPayEntitlement(metadata, {});
      assert.strictEqual(result.kind, "unknown");
    });
  });
});
