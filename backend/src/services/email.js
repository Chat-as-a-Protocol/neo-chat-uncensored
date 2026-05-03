const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "NØX <send@noxai.chat>";
const FRONTEND_URL = (process.env.FRONTEND_URL || "https://noxai.chat")
  .split(",")[0]
  .trim()
  .replace(/\/$/, "");

// Logo URL (PWA icon for consistency and high quality)
const LOGO_URL = "https://noxai.chat/pwaicon/apple-icon-120x120.png";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/**
 * Template Base para E-mails NØX
 * Design: BG Black 85%, Bordas suaves, Logo Centralizado
 */
const renderTemplate = (title, content, action = null) => {
  return `
    <div style="background-color: #050505; padding: 40px 20px; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f5f8; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #121212; background-color: rgba(0, 0, 0, 0.85); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <div style="margin-bottom: 30px;">
          <img src="${LOGO_URL}" alt="NØX" style="width: 64px; height: 64px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.1);">
        </div>
        
        <h1 style="font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 20px; color: #fff;">${title}</h1>
        
        <div style="font-size: 16px; line-height: 1.6; color: #a3a4aa; margin-bottom: 30px; text-align: left;">
          ${content}
        </div>

        ${
          action
            ? `
          <div style="margin: 35px 0;">
            <a href="${action.url}" style="background-color: #f4f5f8; color: #000; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 15px; display: inline-block; transition: all 0.2s ease;">
              ${action.label}
            </a>
          </div>
        `
            : ""
        }

        <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid rgba(255, 255, 255, 0.05); font-size: 11px; color: #444; letter-spacing: 1px;">
          † NΞØ PROTOCOL †<br>
          <span style="color: #222; margin-top: 8px; display: block;">NOX.AI — TERMINAL SOBERANO</span>
        </div>
      </div>
    </div>
  `;
};

const sendEmail = async (payload) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[Email] Resend API Key is missing. Email skipped.");
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
      data?.message ||
        data?.error ||
        `Resend email failed (${response.status})`,
    );
  }

  return { skipped: false, data };
};

export const emailService = {
  /**
   * Envia Boas-vindas (Confirmação de Cadastro)
   */
  async sendWelcomeEmail(to, { userName }) {
    const safeName = escapeHtml(userName || "Operador");
    const title = "NØX - BEM-VINDO";
    const content = `
      <p>Olá, <strong>${safeName}</strong>.</p>
      <p>Sua conta foi registrada com sucesso no terminal NØX. Você agora faz parte de um ecossistema de inteligência privada e sem filtros.</p>
      <p>Seus acessos iniciais foram liberados.</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `† NØX † - Bem-vindo`,
      html: renderTemplate(title, content, {
        label: "ACESSAR NØX",
        url: FRONTEND_URL,
      }),
    });
  },

  /**
   * Envia Link de Acesso (Magic Link)
   */
  async sendMagicLink(to, { token }) {
    const loginUrl = `${FRONTEND_URL}/auth/magic-link?token=${encodeURIComponent(token)}`;
    const title = "AUTENTICAÇÃO DE SESSÃO";
    const content = `
      <p>Vi que você acessou NØX de um novo dispositivo. Clique no botão abaixo para entrar.</p>
      <p style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333; font-size: 14px; color: #eee;">
        <strong>Aviso:</strong> Este link é de uso único e expira em 10 minutos por motivos de SUA segurança.
      </p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `† NØX † - Link de Acesso`,
      html: renderTemplate(title, content, {
        label: "ACESSAR NØX",
        url: loginUrl,
      }),
    });
  },

  /**
   * Envia Recuperação de Senha
   */
  async sendPasswordReset(to, { token }) {
    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const title = "RECUPERAÇÃO DE ACESSO";
    const content = `
      <p>O que aconteceu? Alguém clicou em "Esqueci minha senha".</p>
      <p>Se foi você, clique no link abaixo para escolher uma nova credencial. Se não foi você, não ignore este e-mail você pode estar em risco.</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `† NØX † - Redefinição de Senha`,
      html: renderTemplate(title, content, {
        label: "REDEFINIR SENHA",
        url: resetUrl,
      }),
    });
  },

  /**
   * Envia confirmação de compra de tokens
   */
  async sendPurchaseConfirmation(to, { userName, amount, reference }) {
    const safeUserName = escapeHtml(userName || "Operador");
    const safeAmount = escapeHtml(amount);
    const safeReference = escapeHtml(reference);

    const title = "CRÉDITOS ADICIONADOS";
    const content = `
      <p>Olá, <strong>${safeUserName}</strong>. Sua transação foi processada com sucesso.</p>
      <div style="background: #1a1a1a; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #333;">
        <span style="display: block; font-size: 12px; color: #666; margin-bottom: 5px;">MONTANTE</span>
        <span style="font-size: 32px; font-weight: 800; color: #fff;">${safeAmount} NØX</span>
        <hr style="border: 0; border-top: 1px solid #222; margin: 15px 0;">
        <span style="display: block; font-size: 10px; color: #444;">REF: ${safeReference}</span>
      </div>
      <p>Seus tokens já estão disponíveis para uso imediato no terminal.</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `† NØX † - Créditos Adicionados (${safeAmount})`,
      html: renderTemplate(title, content, {
        label: "VOLTAR AO CHAT",
        url: FRONTEND_URL,
      }),
    });
  },

  /**
   * Envia confirmação de Upgrade de Tier
   */
  async sendTierUpgrade(to, { userName, tierName }) {
    const safeUserName = escapeHtml(userName || "Soberano");
    const safeTierName = escapeHtml(tierName || "P.R.O");

    const title = "UPGRADE DE NÍVEL";
    const content = `
      <p>Finalmente <strong>${safeUserName}</strong>, decidiu ascender ao próximo nível.</p>
      <div style="border: 2px solid #fff; padding: 20px; border-radius: 12px; margin: 20px 0;">
        <p style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 2px;">NÍVEL ${safeTierName} ATIVO</p>
      </div>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `† NØX † - Upgrade de Nível: ${safeTierName}`,
      html: renderTemplate(title, content, {
        label: "TESTAR NØX AGORA",
        url: FRONTEND_URL,
      }),
    });
  },
};
