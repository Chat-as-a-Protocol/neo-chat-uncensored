import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const plansPath = resolve(__dirname, '../../../shared/plans.json');

let plans = { tiers: {}, packages: {} };
try {
  const plansData = fs.readFileSync(plansPath, 'utf-8');
  plans = JSON.parse(plansData);
} catch (err) {
  console.error("ERRO: Falha ao carregar shared/plans.json em utils/plans.js");
}

export const FALLBACK_GUEST_PLAN = {
  initialBalance: 500,
  maxOutputTokens: 184,
};

export const normalizeAccessTier = (rawTier) => {
  if (rawTier === "premium" || rawTier === "paid_pro") return "pro";
  return rawTier || "guest";
};

export const resolvePlanKey = (accessTier, isGuest) => {
  if (isGuest || accessTier === "guest") return "guest";
  if (accessTier === "pro") return plans.tiers.paid_pro ? "paid_pro" : "pro";
  if (accessTier === "paid_basic") return "paid_basic";
  return plans.tiers[accessTier] ? accessTier : "guest";
};

export const getUserPlan = ({ redisTier, jwtTier, isGuest }) => {
  const accessTier = normalizeAccessTier(
    isGuest ? "guest" : redisTier || jwtTier,
  );
  const planKey = resolvePlanKey(accessTier, isGuest);
  return {
    accessTier,
    planKey,
    tierConfig:
      plans.tiers[planKey] || plans.tiers.guest || FALLBACK_GUEST_PLAN,
  };
};

export { plans };
