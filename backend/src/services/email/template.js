import { FRONTEND_URL } from "./config.js";
import { escapeHtml } from "./formatters.js";

const normalizeEmailAction = (action) => {
  if (!action?.label || !action?.url) return null;

  const url = String(action.url);
  try {
    const parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return null;
  } catch {
    return null;
  }

  return {
    label: escapeHtml(action.label),
    url: escapeHtml(url),
  };
};

/**
 * Template Base para E-mails NØX (Versão Hardened)
 * Design: BG Black 85%, Acento Verde Limão (#d4ff1a), Estética de Terminal de Luxo
 */
export const renderTemplate = (title, content, action = null) => {
  const safeAction = normalizeEmailAction(action);

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #050505; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Main Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #050505; margin: 0; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Content Container -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #0a0a0c; border: 1px solid #1a1a1f; margin: 0 auto;">
          <tr>
            <td style="padding: 40px 30px;">
              
              <!-- HEADER / LOGO -->
              <div style="text-align: center; margin-bottom: 40px;">
                <h1 style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 56px; color: #D7FF64; font-weight: 700; letter-spacing: -0.05em; margin: 0; text-transform: uppercase;">NØX</h1>
              </div>

              <!-- TITLE -->
              <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 24px; color: #ffffff; border-bottom: 1px solid #222; padding-bottom: 16px; text-transform: uppercase; letter-spacing: 2px;">
                ${title}
              </h2>
              
              <!-- CONTENT -->
              <div style="font-size: 15px; line-height: 1.7; margin-bottom: 40px; color: #a0a0a0;">
                ${content}
              </div>

              <!-- ACTION BUTTON -->
              ${
                safeAction
                  ? `
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin: 40px 0;">
                  <tr>
                    <td align="center">
                      <a href="${safeAction.url}" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 32px; text-decoration: none; font-weight: bold; font-size: 13px; letter-spacing: 1px; text-transform: uppercase; border-radius: 2px;">
                        ${safeAction.label}
                      </a>
                    </td>
                  </tr>
                </table>
              `
                  : ""
              }

              <!-- FOOTER -->
              <div style="margin-top: 50px; border-top: 1px solid #1a1a1f; padding-top: 30px; text-align: center; font-size: 12px; color: #444; line-height: 1.5;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <img src="https://noxai.chat/favicon.png" alt="NØX Icon" style="width: 20px; height: 20px; display: inline-block;" />
                </div>
                <p style="margin: 0 0 12px 0; font-weight: bold; color: #666; letter-spacing: 1px; text-transform: uppercase;">O sistema não te protege, quebre ele.</p>
                <p style="margin: 0 0 12px 0;">Você está recebendo este e-mail pois é um Operador registrado no NØX Protocol.</p>
                <p style="margin: 0;">
                  <a href="${FRONTEND_URL}/account" style="color: #555; text-decoration: underline;">Conta</a> &nbsp;&nbsp;|&nbsp;&nbsp; 
                  <a href="mailto:send@noxai.chat?subject=Unsubscribe" style="color: #555; text-decoration: underline;">Descadastrar-se</a>
                </p>
              </div>

            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};
