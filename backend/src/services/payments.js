import { query } from "../utils/db.js";
import { parsePositiveInt } from "../utils/numbers.js";


const TOKEN_PURCHASE_TYPES = new Set(["tokens_purchase", "token_purchase"]);

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



export const deriveFlowPayMetadataFromReference = (reference = "", plans = {}) => {
  const safePlans = plans || {};
  const packages = safePlans.packages || {};
  const value = String(reference || "");

  const tokenPrefix = "nox_tokens_";
  if (value.startsWith(tokenPrefix)) {
    const packageId = Object.keys(packages).find((id) =>
      value.startsWith(`${tokenPrefix}${id}_`),
    );
    const selectedPackage = packageId ? packages[packageId] : null;

    if (selectedPackage) {
      return {
        type: "tokens_purchase",
        packageId,
        tokens: selectedPackage.tokens,
        price: selectedPackage.price,
        tierUpgrade: selectedPackage.tier,
      };
    }
  }

  return {};
};

export const resolveCanonicalFlowPayReference = (data = {}, plans = {}) => {
  const safePlans = plans || {};
  const packages = safePlans.packages || {};
  const candidates = [
    data?.reference,
    data?.orderId,
    data?.id_transacao,
    data?.chargeId,
    data?.metadata?.reference,
    data?.metadata?.chargeId,
    data?.paymentId,
    data?.id,
  ];

  for (const candidate of candidates) {
    const value = String(candidate || "").trim();
    if (!value) continue;

    const metadata = deriveFlowPayMetadataFromReference(value, safePlans);
    if (metadata.packageId && packages[metadata.packageId]) return value;
  }

  return null;
};

const parseBrlMajorUnit = (value) => {
  if (typeof value === "string") {
    return Number(value.replace(",", "."));
  }
  return Number(value);
};

export const normalizePlanPriceToCents = (price) => {
  if (price === null || price === undefined) return null;
  const p = parseBrlMajorUnit(price);
  if (!Number.isFinite(p) || p <= 0) return null;
  return Math.round(p * 100);
};

export const normalizeFlowPayAmountToCents = (amountBrl) => {
  if (amountBrl === null || amountBrl === undefined) return null;
  const p = parseBrlMajorUnit(amountBrl);
  if (!Number.isFinite(p) || p <= 0) return null;
  return Math.round(p * 100);
};

export const resolveFlowPayEntitlement = (trustedMetadata = {}, _externalMetadata = {}, plans = {}) => {
  if (!trustedMetadata || typeof trustedMetadata !== "object") {
    console.error("[Payments] Error: resolveFlowPayEntitlement called with null/invalid trustedMetadata");
    return { kind: "unknown", tokens: 0, tierUpgrade: null, packageId: null };
  }

  const safePlans = plans || {};
  const packages = safePlans.packages || {};

  // Sem type explícito → desconhecido.
  const purchaseType = String(trustedMetadata.type || "").toLowerCase();
  if (!purchaseType) {
    console.warn("[Payments] resolveFlowPayEntitlement: trustedMetadata.type ausente, retornando unknown.");
    return { kind: "unknown", tokens: 0, tierUpgrade: null, packageId: null };
  }

  if (TOKEN_PURCHASE_TYPES.has(purchaseType)) {
    const selectedPackage = findPackageByMetadata(trustedMetadata, packages);

    // Autoridade de tokens: Pacote > Derivado
    const tokens = parsePositiveInt(
      selectedPackage?.tokens,
      parsePositiveInt(trustedMetadata.tokens)
    );

    // Autoridade de Tier: Pacote (Novo) > Pacote (Legado) > Derivado (Novo) > Derivado (Legado)
    const tierUpgrade = normalizeTierUpgrade(
      selectedPackage?.tier ||
      selectedPackage?.tier_upgrade ||
      trustedMetadata.tierUpgrade ||
      trustedMetadata.tier_upgrade
    );

    // tokens <= 0 em token_purchase é dado inválido — barrar aqui antes do webhook
    if (!tokens || tokens <= 0) {
      console.warn(`[Payments] resolveFlowPayEntitlement: TOKEN_PURCHASE com tokens inválido (${tokens}).`);
      return { kind: "unknown", tokens: 0, tierUpgrade: null, packageId: null };
    }

    return {
      kind: "token_purchase",
      tokens,
      tierUpgrade,
      packageId: selectedPackage?.id || trustedMetadata.packageId || trustedMetadata.package || null,
    };
  }

  return { kind: "unknown", tokens: 0, tierUpgrade: null, packageId: null };
};

export const paymentService = {
  resolveEntitlement: resolveFlowPayEntitlement,
  deriveMetadataFromReference: deriveFlowPayMetadataFromReference,
  resolveCanonicalReference: resolveCanonicalFlowPayReference,

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

    try {
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
    } catch (err) {
      console.error(`[Payments] Database error recording payment ${providerReference}:`, err.message);
      return { persisted: false, reason: "database_error", error: err.message };
    }
  },
};
