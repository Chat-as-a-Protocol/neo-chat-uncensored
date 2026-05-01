import { query } from "../utils/db.js";

const TOKEN_PURCHASE_TYPES = new Set(["tokens_purchase", "token_purchase"]);

const parsePositiveInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeTierUpgrade = (tier) => {
  if (!tier) return null;
  const normalized = String(tier).trim();
  if (normalized === "premium" || normalized === "pro") return "paid_pro";
  if (
    normalized === "guest" ||
    normalized === "free" ||
    normalized === "paid_basic" ||
    normalized === "paid_pro"
  ) {
    return normalized;
  }
  return null;
};

const findPackageByMetadata = (metadata, packages) => {
  const packageId = String(metadata.packageId || metadata.package || metadata.pkg || "").trim();
  if (packageId && packages[packageId]) return packages[packageId];

  const metadataTokens = parsePositiveInt(metadata.tokens);
  if (!metadataTokens) return null;

  return Object.values(packages).find(
    (pkg) => parsePositiveInt(pkg.tokens) === metadataTokens,
  ) || null;
};

const findProductByMetadata = (metadata, products) => {
  const productId = String(metadata.productId || metadata.product_id || metadata.product || "").trim();
  if (productId && products[productId]) return products[productId];

  const personaId = String(metadata.personaId || metadata.persona_id || "").trim();
  if (!personaId) return null;

  return Object.values(products).find((product) => product.persona_id === personaId) || null;
};

export const resolveFlowPayEntitlement = (metadata = {}, plans = {}) => {
  const packages = plans.packages || {};
  const products = plans.products || {};
  const purchaseType = String(metadata.type || "pro_subscription").toLowerCase();

  if (TOKEN_PURCHASE_TYPES.has(purchaseType)) {
    const selectedPackage = findPackageByMetadata(metadata, packages);
    const tokens = parsePositiveInt(metadata.tokens, parsePositiveInt(selectedPackage?.tokens));
    const tierUpgrade = normalizeTierUpgrade(
      metadata.tierUpgrade || metadata.tier_upgrade || selectedPackage?.tier_upgrade,
    );

    return {
      kind: "token_purchase",
      tokens,
      tierUpgrade,
      packageId: selectedPackage?.id || metadata.packageId || metadata.package || null,
    };
  }

  const selectedProduct = findProductByMetadata(metadata, products);

  return {
    kind: "subscription",
    tokens: 0,
    tierUpgrade:
      normalizeTierUpgrade(
        metadata.tierUpgrade ||
          metadata.tier_upgrade ||
          selectedProduct?.tier_upgrade ||
          metadata.plan,
      ) ||
      "paid_pro",
    packageId: null,
    productId:
      selectedProduct?.id ||
      metadata.productId ||
      metadata.product_id ||
      metadata.product ||
      null,
    personaId: selectedProduct?.persona_id || metadata.personaId || metadata.persona_id || null,
  };
};

export const paymentService = {
  resolveEntitlement: resolveFlowPayEntitlement,

  async recordFlowPayPayment({
    providerReference,
    userId,
    amountBrl,
    currency = "BRL",
    status = "received",
    metadata = {},
  }) {
    if (!process.env.DATABASE_URL) {
      return { persisted: false, reason: "database_unconfigured" };
    }

    const result = await query(
      `INSERT INTO payments (
        provider,
        provider_reference,
        user_id,
        amount_brl,
        currency,
        status,
        metadata
      )
      VALUES ('flowpay', $1, $2, $3, $4, $5, $6::jsonb)
      ON CONFLICT (provider_reference)
      DO UPDATE SET
        status = EXCLUDED.status,
        metadata = payments.metadata || EXCLUDED.metadata
      RETURNING id, provider_reference, user_id, amount_brl, currency, status, metadata, created_at`,
      [
        providerReference,
        userId,
        Number.isFinite(amountBrl) ? amountBrl : 0,
        currency,
        status,
        JSON.stringify(metadata),
      ],
    );

    return { persisted: true, payment: result.rows[0] };
  },
};
