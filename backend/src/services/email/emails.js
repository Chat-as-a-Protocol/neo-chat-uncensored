import { FRONTEND_URL, FROM_EMAIL } from "./config.js";
import { sendEmail } from "./client.js";
import {
  escapeHtml,
  formatAnnouncementContent,
  formatBrl,
  formatDateTime,
} from "./formatters.js";
import { renderTemplate } from "./template.js";

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
      <p>Seus acessos iniciais foram liberados e você já pode começar a utilizar o chat.</p>
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
      <p>Você solicitou acesso ao chat NØX. Clique no link abaixo para autenticar sua sessão.</p>
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

  /**
   * Notifica que os créditos/saldo do usuário acabaram.
   * Foco em conversão: CTA direto para a página de planos.
   */
  async sendBalanceDepleted(to, { userName } = {}) {
    const safeName = escapeHtml(userName || "Operador");

    const title = "SEU SALDO ACABOU";
    const content = `
      <p>Olá, <strong>${safeName}</strong>.</p>
      <p>Seus créditos $NØX chegaram a zero — por isso o chat pausou as respostas.</p>
      <p>Recarregue e continue a conversa de onde parou, sem perder o ritmo. Escolha um plano e volte pra ação.</p>
    `;

    return sendEmail({
      from: FROM_EMAIL,
      to,
      subject: "Seus créditos NØX acabaram — recarregue e continue",
      html: renderTemplate(title, content, {
        label: "VER PLANOS",
        url: `${FRONTEND_URL}/upgrade`,
      }),
    });
  },

  /**
   * Disparo genérico para Anúncios de Features / Campanhas
   */
  async sendFeatureAnnouncement(
    to,
    { userName, title, content, actionLabel, actionUrl, scheduledAt },
  ) {
    const safeName = escapeHtml(userName || "Soberano");
    const safeTitle = escapeHtml(title || "Comunicado");
    const formattedContent = formatAnnouncementContent(content);

    const htmlContent = `
      <p>Saudações, <strong>${safeName}</strong>.</p>
      <div style="margin-top: 28px;">
        ${formattedContent}
      </div>
    `;

    const payload = {
      to,
      subject: safeTitle.startsWith("NØX") ? safeTitle : `NØX - ${safeTitle}`,
      html: renderTemplate(
        safeTitle,
        htmlContent,
        actionLabel && actionUrl
          ? {
              label: actionLabel,
              url: actionUrl,
            }
          : null,
      ),
    };

    if (scheduledAt) {
      payload.scheduledAt = scheduledAt;
    }

    return sendEmail(payload);
  },
};
