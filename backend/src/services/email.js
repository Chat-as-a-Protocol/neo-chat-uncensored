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

const formatBrl = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "N/A";

  return amount.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
};

const formatDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "N/A";

  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  });
};

/**
 * Template Base para E-mails NØX (Versão Hardened)
 * Design: BG Black 85%, Acento Verde Limão (#d4ff1a), Estética de Terminal de Luxo
 */
/**
 * Template Base para E-mails NØX (Versão Ultra-Light)
 * Foco total em entregabilidade: Fundo branco, texto preto, links padrão.
 */
const renderTemplate = (title, content, action = null) => {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111; line-height: 1.6; padding: 20px; background-color: #ffffff;">
      <h2 style="font-size: 20px; font-weight: bold; margin-bottom: 20px; color: #000; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
        ${title}
      </h2>
      
      <div style="font-size: 16px; margin-bottom: 30px;">
        ${content}
      </div>

      ${
        action
          ? `
        <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 8px;">
          <p style="margin-top: 0; font-weight: bold;">${action.label}:</p>
          <a href="${action.url}" style="color: #0066cc; text-decoration: underline; font-weight: bold; font-size: 18px; word-break: break-all;">
            ${action.url}
          </a>
        </div>
      `
          : ""
      }

      <div style="margin-top: 50px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 12px; color: #888;">
        <strong>NØX</strong> - O sistema não te protege, quebre ele<br>
        Este é um e-mail automático. Não responda.
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
    const title = "BEM-VINDO AO NØX";
    const content = `
      <p>Olá, <strong>${safeName}</strong>.</p>
      <p>Sua conta foi registrada com sucesso. Você agora tem acesso ao ecossistema NØX.</p>
      <p>Seus acessos iniciais foram liberados e você já pode começar a utilizar o terminal.</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `NØX - Bem-vindo`,
      html: renderTemplate(title, content, {
        label: "LINK PARA ACESSAR NØX",
        url: FRONTEND_URL,
      }),
    });
  },

  /**
   * Envia Link de Acesso (Magic Link)
   */
  async sendMagicLink(to, { token }) {
    const loginUrl = `${FRONTEND_URL}/auth/magic-link?token=${encodeURIComponent(token)}`;
    const title = "LINK DE ACESSO";
    const content = `
      <p>Você solicitou acesso ao terminal NØX. Clique no link abaixo para autenticar sua sessão.</p>
      <p><strong>Aviso de Segurança:</strong> Este link expira em 10 minutos e só pode ser usado uma única vez.</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `NØX - AI LINK`,
      html: renderTemplate(title, content, {
        label: "LINK PARA ACESSAR NØX",
        url: loginUrl,
      }),
    });
  },

  /**
   * Envia Recuperação de Senha
   */
  async sendPasswordReset(to, { token }) {
    const resetUrl = `${FRONTEND_URL}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const title = "RECUPERAÇÃO DE SENHA";
    const content = `
      <p>Recebemos uma solicitação para redefinir sua senha.</p>
      <p>Se você não fez este pedido, ignore este e-mail. Se deseja prosseguir, use o link abaixo.</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `NØX - Redefinição de Senha`,
      html: renderTemplate(title, content, {
        label: "LINK PARA REDEFINIR SENHA",
        url: resetUrl,
      }),
    });
  },

  /**
   * Envia confirmação de compra de tokens
   */
  async sendPurchaseConfirmation(
    to,
    {
      userName,
      packageId,
      tokens,
      tierUpgrade,
      amountBrl,
      reference,
      confirmedAt,
    },
  ) {
    const safeUserName = escapeHtml(userName || "Operador");
    const safePackageId = escapeHtml(packageId || "N/A");
    const safeTokens = escapeHtml(tokens ?? "0");
    const safeTierUpgrade = escapeHtml(tierUpgrade || "N/A");
    const safeAmountBrl = escapeHtml(formatBrl(amountBrl));
    const safeReference = escapeHtml(reference || "N/A");
    const safeConfirmedAt = escapeHtml(formatDateTime(confirmedAt));

    const title = "PAGAMENTO CONFIRMADO";
    const content = `
      <p>Olá, <strong>${safeUserName}</strong>.</p>
      <p>Seu pagamento foi confirmado e seus créditos NØX já foram liberados na sua conta.</p>
      <p>
        <strong>Plano/Pacote:</strong> ${safePackageId}<br>
        <strong>Créditos/Tokens:</strong> ${safeTokens}<br>
        <strong>Status:</strong> ${safeTierUpgrade}<br>
        <strong>Valor:</strong> ${safeAmountBrl}<br>
        <strong>Referência:</strong> ${safeReference}<br>
        <strong>Confirmado em:</strong> ${safeConfirmedAt}
      </p>
      <p>Você já pode voltar ao chat e continuar usando o NØX.</p>
      <p>Se você não reconhece essa compra ou não recebeu os créditos corretamente, responda este e-mail com a referência acima.</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: "Pagamento confirmado — seus créditos NØX foram liberados",
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
      <p>Olá, <strong>${safeUserName}</strong>.</p>
      <p>Seu nível de acesso foi atualizado com sucesso.</p>
      <p><strong>Nível Atual:</strong> ${safeTierName}</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: `NØX - Upgrade de Nível: ${safeTierName}`,
      html: renderTemplate(title, content, {
        label: "ABRIR NØX",
        url: FRONTEND_URL,
      }),
    });
  },
};
