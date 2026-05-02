/**
 * Email Service — Resend integration
 * Handles transactional emails for the NØX platform.
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const MAGIC_LINK_EXPIRATION_MINUTES =
  parseInt(process.env.MAGIC_LINK_EXPIRATION_MINUTES, 10) || 10;

/**
 * Builds the HTML body for a magic link email.
 * @param {string} magicLinkUrl - The full magic link URL.
 * @returns {string} HTML string.
 */
function buildMagicLinkHtml(magicLinkUrl) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Seu link de acesso NØX</title>
</head>
<body style="margin:0;padding:0;background:#0d0e14;font-family:'Segoe UI',Arial,sans-serif;color:#f4f5f8;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0e14;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1c1d26;border:1px solid rgba(255,255,255,0.08);border-radius:24px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:36px 40px 24px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
              <span style="font-size:28px;font-weight:800;letter-spacing:-0.5px;color:#f4f5f8;">NØX<span style="color:#b9d631;">.</span>AI</span>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f4f5f8;line-height:1.3;">
                Seu link de acesso chegou
              </p>
              <p style="margin:0 0 28px;font-size:15px;color:#a3a4aa;line-height:1.6;">
                Clique no botão abaixo para entrar na sua conta. Nenhuma senha necessária.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 32px;">
                    <a href="${magicLinkUrl}"
                       style="display:inline-block;background:#b9d631;color:#181923;font-size:15px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:12px;letter-spacing:0.2px;">
                      Acessar NØX agora →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Expiration notice -->
              <p style="margin:0 0 16px;font-size:13px;color:#a3a4aa;line-height:1.5;text-align:center;">
                ⏱ Este link expira em <strong style="color:#f4f5f8;">${MAGIC_LINK_EXPIRATION_MINUTES} minutos</strong>.
              </p>

              <!-- Fallback URL -->
              <p style="margin:0;font-size:12px;color:#6b6c72;line-height:1.5;text-align:center;">
                Se o botão não funcionar, copie e cole este link no seu navegador:<br/>
                <span style="color:#b9d631;word-break:break-all;">${magicLinkUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:12px;color:#6b6c72;line-height:1.6;text-align:center;">
                🔒 Se você não solicitou este link, ignore este e-mail com segurança — sua conta permanece protegida.<br/>
                Este link só pode ser usado uma vez.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Sends a magic link email via Resend.
 * @param {object} opts
 * @param {string} opts.to - Recipient email address.
 * @param {string} opts.magicLinkUrl - The full magic link URL.
 * @returns {Promise<{ success: boolean, id?: string, error?: string }>}
 */
export async function sendMagicLinkEmail({ to, magicLinkUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const from =
    process.env.RESEND_FROM_EMAIL || "NØX.AI <noreply@nox.ai>";

  const payload = {
    from,
    to: [to],
    subject: "Seu link de acesso NØX — válido por 10 minutos",
    html: buildMagicLinkHtml(magicLinkUrl),
  };

  const response = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `Resend API error (${response.status}): ${data?.message || JSON.stringify(data)}`,
    );
  }

  return { success: true, id: data.id };
}
