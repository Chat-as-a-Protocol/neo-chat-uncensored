import test, { describe } from "node:test";
import assert from "node:assert";
import {
  deriveFlowPayMetadataFromReference,
  resolveCanonicalFlowPayReference,
  resolveFlowPayEntitlement,
  normalizePlanPriceToCents,
  normalizeFlowPayAmountToCents,
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

  describe("resolveCanonicalFlowPayReference", () => {
    const plans = {
      packages: {
        "1k": { tokens: 1000, price: 49, tier: "paid_basic" },
        "40k": { tokens: 40000, price: 499, tier: "paid_pro" },
      },
    };

    test("prioriza reference/orderId canônico antes de paymentId/id", () => {
      const result = resolveCanonicalFlowPayReference(
        {
          paymentId: "gateway_internal_123",
          id: "gateway_id_456",
          orderId: "nox_tokens_40k_testuuid",
        },
        plans,
      );

      assert.strictEqual(result, "nox_tokens_40k_testuuid");
    });

    test("aceita metadata.reference antes de paymentId interno", () => {
      const result = resolveCanonicalFlowPayReference(
        {
          metadata: { reference: "nox_tokens_40k_testuuid" },
          paymentId: "gateway_internal_123",
        },
        plans,
      );

      assert.strictEqual(result, "nox_tokens_40k_testuuid");
    });

    test("aceita metadata.chargeId antes de paymentId interno", () => {
      const result = resolveCanonicalFlowPayReference(
        {
          metadata: { chargeId: "nox_tokens_40k_testuuid" },
          paymentId: "gateway_internal_123",
        },
        plans,
      );

      assert.strictEqual(result, "nox_tokens_40k_testuuid");
    });

    test("falha fechado quando referência não deriva pacote configurado", () => {
      const result = resolveCanonicalFlowPayReference(
        {
          orderId: "nox_tokens_unknown_testuuid",
          paymentId: "gateway_internal_123",
        },
        plans,
      );

      assert.strictEqual(result, null);
    });

    test("contrato Chat: reference 40k deriva entitlement paid_pro", () => {
      const reference = "nox_tokens_40k_testuuid";
      const resolved = resolveCanonicalFlowPayReference(
        {
          reference,
          orderId: reference,
        },
        plans,
      );
      const metadata = deriveFlowPayMetadataFromReference(resolved, plans);

      assert.strictEqual(resolved, reference);
      assert.strictEqual(metadata.packageId, "40k");
      assert.strictEqual(metadata.tokens, 40000);
      assert.strictEqual(metadata.tierUpgrade, "paid_pro");
    });
  });

  describe("resolveFlowPayEntitlement", () => {
    test("should return unknown for invalid trustedMetadata", () => {
      const result = resolveFlowPayEntitlement(null, {}, {});
      assert.strictEqual(result.kind, "unknown");
    });

    test("should return unknown for missing type in trustedMetadata", () => {
      const result = resolveFlowPayEntitlement({}, {}, {});
      assert.strictEqual(result.kind, "unknown");
    });

    test("should resolve token purchase entitlement using trustedMetadata", () => {
      const trustedMetadata = {
        type: "token_purchase",
        tokens: 1000,
        packageId: "1k",
      };
      const result = resolveFlowPayEntitlement(trustedMetadata, {}, {});
      assert.strictEqual(result.kind, "token_purchase");
      assert.strictEqual(result.tokens, 1000);
      assert.strictEqual(result.packageId, "1k");
    });

    test("should fallback to package tokens if trustedMetadata tokens missing", () => {
      const trustedMetadata = {
        type: "token_purchase",
        packageId: "1k",
      };
      const plans = {
        packages: {
          "1k": { tokens: 1000 },
        },
      };
      const result = resolveFlowPayEntitlement(trustedMetadata, {}, plans);
      assert.strictEqual(result.kind, "token_purchase");
      assert.strictEqual(result.tokens, 1000);
    });

    test("should return unknown if tokens <= 0", () => {
      const trustedMetadata = {
        type: "token_purchase",
        tokens: 0,
      };
      const result = resolveFlowPayEntitlement(trustedMetadata, {}, {});
      assert.strictEqual(result.kind, "unknown");
    });

    // Novos testes solicitados pelo usuário
    test("plano atual com tier funciona", () => {
      const trustedMetadata = { type: "token_purchase", packageId: "1k" };
      const plans = { packages: { "1k": { tokens: 1000, tier: "paid_basic" } } };
      const result = resolveFlowPayEntitlement(trustedMetadata, {}, plans);
      assert.strictEqual(result.tierUpgrade, "paid_basic");
    });

    test("plano legado com tier_upgrade funciona", () => {
      const trustedMetadata = { type: "token_purchase", packageId: "1k" };
      const plans = { packages: { "1k": { tokens: 1000, tier_upgrade: "paid_pro" } } };
      const result = resolveFlowPayEntitlement(trustedMetadata, {}, plans);
      assert.strictEqual(result.tierUpgrade, "paid_pro");
    });

    test("metadata externo tentando injetar tierUpgrade paid_pro é ignorado", () => {
      const trustedMetadata = { type: "token_purchase", packageId: "1k" };
      const externalMetadata = { tierUpgrade: "paid_pro" };
      const plans = { packages: { "1k": { tokens: 1000, tier: "paid_basic" } } };
      const result = resolveFlowPayEntitlement(trustedMetadata, externalMetadata, plans);
      assert.strictEqual(result.tierUpgrade, "paid_basic"); // Deve manter o do plano
    });

    test("metadata externo tentando injetar packageId superior é ignorado", () => {
      const trustedMetadata = { type: "token_purchase", packageId: "1k" };
      const externalMetadata = { packageId: "40k" };
      const plans = {
        packages: {
          "1k": { tokens: 1000, tier: "paid_basic" },
          "40k": { tokens: 40000, tier: "paid_pro" }
        }
      };
      const result = resolveFlowPayEntitlement(trustedMetadata, externalMetadata, plans);
      assert.strictEqual(result.packageId, "1k");
      assert.strictEqual(result.tokens, 1000);
    });

    test("metadata externo tentando injetar tokens maior é ignorado", () => {
      const trustedMetadata = { type: "token_purchase", packageId: "1k" };
      const externalMetadata = { tokens: 50000 };
      const plans = { packages: { "1k": { tokens: 1000 } } };
      const result = resolveFlowPayEntitlement(trustedMetadata, externalMetadata, plans);
      assert.strictEqual(result.tokens, 1000);
    });

    test("ausência de pacote confiável falha de forma segura", () => {
      const trustedMetadata = { type: "token_purchase", packageId: "unknown" };
      const result = resolveFlowPayEntitlement(trustedMetadata, {}, { packages: {} });
      assert.strictEqual(result.kind, "unknown");
    });
  });

  describe("Normalization Functions", () => {
    test("normalizePlanPriceToCents converts Reais to Cents", () => {
      assert.strictEqual(normalizePlanPriceToCents(49), 4900);
      assert.strictEqual(normalizePlanPriceToCents("49.00"), 4900);
      assert.strictEqual(normalizePlanPriceToCents("49,00"), 4900);
      assert.strictEqual(normalizePlanPriceToCents(49.9), 4990);
    });

    test("normalizePlanPriceToCents returns null for invalid values", () => {
      assert.strictEqual(normalizePlanPriceToCents(null), null);
      assert.strictEqual(normalizePlanPriceToCents(0), null);
      assert.strictEqual(normalizePlanPriceToCents(-10), null);
      assert.strictEqual(normalizePlanPriceToCents("abc"), null);
    });

    test("normalizeFlowPayAmountToCents converts Reais to Cents", () => {
      assert.strictEqual(normalizeFlowPayAmountToCents(49), 4900);
      assert.strictEqual(normalizeFlowPayAmountToCents("49.00"), 4900);
      assert.strictEqual(normalizeFlowPayAmountToCents("49,00"), 4900);
    });

    test("normalizeFlowPayAmountToCents returns null for invalid values", () => {
      assert.strictEqual(normalizeFlowPayAmountToCents(null), null);
      assert.strictEqual(normalizeFlowPayAmountToCents(0), null);
      assert.strictEqual(normalizeFlowPayAmountToCents(-10), null);
    });
  });
});
