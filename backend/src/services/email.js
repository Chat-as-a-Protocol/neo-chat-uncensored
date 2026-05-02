const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "NØX <send@noxai.chat>";
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://noxai.chat")
  .split(",")[0]
  .trim()
  .replace(/\/$/, "");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sendEmail = async (payload) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { skipped: true, reason: "resend_api_key_missing" };
  }

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message || data?.error || `Resend email failed (${response.status})`,
    );
  }

  return { skipped: false, data };
};

export const emailService = {
  /**
   * Envia confirmação de compra de tokens
   */
  async sendPurchaseConfirmation(to, { userName, amount, reference }) {
    const safeUserName = escapeHtml(userName || "Operador");
    const safeAmount = escapeHtml(amount);
    const safeReference = escapeHtml(reference);

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `† NØX † - Créditos Adicionados (${safeAmount})`,
      text: `NØX LEDGER\n\nOlá, ${safeUserName}.\nSua transação foi processada.\nCréditos adicionados: ${safeAmount} NØX\nRef: ${safeReference}\n\nAcesse: ${FRONTEND_URL}`,
      html: `
        <div style="background: #000; color: #fff; font-family: sans-serif; padding: 40px; border: 1px solid #333; max-width: 600px; margin: auto;">
          <h1 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">NØX LEDGER</h1>
          <p>Olá, <strong>${safeUserName}</strong>.</p>
          <p>Sua transação foi processada com sucesso no protocolo.</p>
          <div style="background: #111; padding: 20px; border-radius: 4px; margin: 20px 0; border-left: 4px solid #fff;">
            <p style="margin: 0; font-size: 14px; color: #888;">CRÉDITOS ADICIONADOS</p>
            <p style="margin: 5px 0; font-size: 24px; font-weight: bold;">${safeAmount} NØX</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #444;">REF: ${safeReference}</p>
          </div>
          <p>Seus tokens já estão disponíveis para uso imediato no terminal.</p>
          <a href="${FRONTEND_URL}" style="display: inline-block; background: #fff; color: #000; text-decoration: none; padding: 12px 24px; font-weight: bold; margin-top: 20px;">ACESSAR TERMINAL</a>
          <p style="margin-top: 40px; font-size: 10px; color: #333; text-align: center;">† NΞØ PROTOCOL †</p>
        </div>
      `,
    });
  },

  /**
   * Envia Link de Acesso (Magic Link)
   */
  async sendMagicLink(to, { token }) {
    const loginUrl = `${FRONTEND_URL}/auth/magic-link?token=${encodeURIComponent(token)}`;
    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `† NØX † - Link de Acesso`,
      text: `NØX AUTH\n\nUse este link para autenticar sua sessão. Ele expira em 15 minutos.\n\n${loginUrl}`,
      html: `
        <div style="background: #000; color: #fff; font-family: sans-serif; padding: 40px; border: 1px solid #333; max-width: 600px; margin: auto;">
          <h1 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">NØX AUTH</h1>
          <p>Use o botão abaixo para autenticar sua sessão no protocolo.</p>
          <p style="color: #888; font-size: 14px;">Este link expira em 15 minutos.</p>
          <a href="${loginUrl}" style="display: inline-block; background: #fff; color: #000; text-decoration: none; padding: 12px 24px; font-weight: bold; margin: 20px 0;">ENTRAR NO PROTOCOLO</a>
          <p style="font-size: 12px; color: #444;">Se você não solicitou este acesso, ignore este e-mail.</p>
          <p style="margin-top: 40px; font-size: 10px; color: #333; text-align: center;">† NΞØ PROTOCOL †</p>
        </div>
      `,
    });
  },

  /**
   * Envia confirmação de Upgrade de Tier
   */
  async sendTierUpgrade(to, { userName, tierName }) {
    const safeUserName = escapeHtml(userName || "Soberano");
    const safeTierName = escapeHtml(tierName || "P.R.O");

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `† NØX † - Upgrade de Nível: ${safeTierName}`,
      text: `NØX UPGRADE\n\nOperador ${safeUserName}, seu acesso foi elevado para ${safeTierName}.\n\nAcesse: ${FRONTEND_URL}`,
      html: `
        <div style="background: #000; color: #fff; font-family: sans-serif; padding: 40px; border: 1px solid #333; max-width: 600px; margin: auto;">
          <h1 style="color: #fff; border-bottom: 1px solid #333; padding-bottom: 10px;">NØX UPGRADE</h1>
          <p>Operador <strong>${safeUserName}</strong>,</p>
          <p>Seu acesso foi elevado para o nível <strong>${safeTierName}</strong>.</p>
          <div style="border: 1px solid #fff; padding: 15px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px; letter-spacing: 2px;">ACESSO TOTAL LIBERADO</p>
          </div>
          <p>Vantagens ativas:</p>
          <ul style="color: #888; font-size: 14px;">
            <li>Personas Especialistas Desbloqueadas</li>
            <li>Limites de Contexto Expandidos</li>
            <li>Prioridade no Protocolo</li>
          </ul>
          <a href="${FRONTEND_URL}" style="display: inline-block; background: #fff; color: #000; text-decoration: none; padding: 12px 24px; font-weight: bold; margin-top: 20px;">INICIAR OPERAÇÃO</a>
          <p style="margin-top: 40px; font-size: 10px; color: #333; text-align: center;">† NΞØ PROTOCOL †</p>
        </div>
      `,
    });
  },
};
