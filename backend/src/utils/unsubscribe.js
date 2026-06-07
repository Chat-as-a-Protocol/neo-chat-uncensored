import crypto from "node:crypto";

// Segredo de assinatura do token de descadastro.
// Em produção JWT_SECRET sempre existe; o fallback só cobre dev/test.
const SECRET = process.env.JWT_SECRET || "nox-unsub-fallback";

// URL pública do BACKEND (api.noxai.chat) — onde vive o endpoint de unsubscribe.
// PUBLIC_API_URL é distinto de FLOWPAY_API_URL (ver AGENTS.md).
const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || "https://api.noxai.chat")
  .split(",")[0]
  .trim()
  .replace(/\/$/, "");

/**
 * Token HMAC stateless por usuário (sem expiração — links de unsubscribe
 * não devem expirar). Determinístico: mesmo userId → mesmo token.
 */
export const unsubscribeToken = (userId) =>
  crypto
    .createHmac("sha256", SECRET)
    .update(`unsub:${userId}`)
    .digest("hex")
    .slice(0, 32);

/**
 * URL absoluta de descadastro para o header List-Unsubscribe e o rodapé.
 */
export const unsubscribeUrl = (userId) =>
  `${PUBLIC_API_URL}/api/unsubscribe?u=${encodeURIComponent(userId)}&t=${unsubscribeToken(userId)}`;

/**
 * Verificação timing-safe do par (userId, token).
 */
export const verifyUnsubscribe = (userId, token) => {
  if (!userId || !token) return false;
  const expected = unsubscribeToken(userId);
  if (token.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
};
