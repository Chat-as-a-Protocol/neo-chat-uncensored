import "dotenv/config";
import { emailService } from "../services/email.js";

// ==========================================
// CONFIGURAÇÃO DA CAMPANHA
// ==========================================
const CAMPAIGN_TITLE = "// UPGRADE +++++++++--------";
const CAMPAIGN_CONTENT = `
[i] Inicializando transmissão de dados...

**[+] FULL ACCESS**
Upgrade de identidade: O NØX agora recebeu um leve ajuste de personalidade mais humana e fluida.

**[+] INTERFACE REFACT**
Ouvimos os pedidos e ajustamos o botão de envio no mobile. Ficou muito mais rápido e responsivo.

**[+] MEMORY BANK**
Agora a IA lembra de informações passadas em mensagens antigas, tornando suas conversas contínuas.

Se curtir o novo NØX, responda este e-mail e ganhe tokens grátis.
`;
const ACTION_LABEL = "ACESSAR NØX \u203A";
const ACTION_URL = "https://noxai.chat/account";

// ==========================================
// FILTRO DE USUÁRIOS (Padrão: Todos)
// Altere a query se quiser mandar só para pagantes. Ex: WHERE tier != 'guest'
// ==========================================
// Para produção, importe query de "../utils/db.js" e use:
//
// const GET_USERS_QUERY = `
//   SELECT id, name, email, tier
//   FROM users
//   WHERE email IS NOT NULL
//   AND email != ''
//   AND marketing_opt_out = FALSE
// `;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function runCampaign() {
  console.log("==========================================");
  console.log("🚀 INICIANDO DISPARO DE CAMPANHA NØX");
  console.log(`Título: ${CAMPAIGN_TITLE}`);
  console.log("==========================================\n");

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ ERRO: Variável RESEND_API_KEY não encontrada no .env");
    process.exit(1);
  }

  try {
    console.log("==========================================");
    console.log("🛡️ MODO DE SEGURANÇA ATIVO (APENAS TESTE)");
    console.log(
      "Para enviar para todos, edite este script e comente a linha do mock.",
    );
    console.log("==========================================\n");

    // MODO DE TESTE (Padrão e Seguro):
    const users = [
      {
        id: "test-id",
        name: "test-user",
        email: process.env.NOX_TEST_EMAIL || "nox@noxai.chat",
        tier: "admin",
      },
    ];

    // MODO PRODUÇÃO (Descomente para valer, apos importar query):
    // const { rows: users } = await query(GET_USERS_QUERY);

    console.log(`Encontrados ${users.length} usuários válidos com e-mail.`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(
        `[${i + 1}/${users.length}] Enviando para: ${user.email} (${user.tier})...`,
      );

      try {
        await emailService.sendFeatureAnnouncement(user.email, {
          userId: user.id,
          userName: user.name,
          title: CAMPAIGN_TITLE,
          content: CAMPAIGN_CONTENT,
          actionLabel: ACTION_LABEL,
          actionUrl: ACTION_URL,
          // Agendamento (Descomente para agendar no Resend e poder cancelar se errar):
          // scheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutos de delay
        });

        console.log(`   ✅ Enviado com sucesso!`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Falha ao enviar para ${user.email}:`, err.message);
        errorCount++;
      }

      // Delay de 500ms entre envios para evitar Rate Limit severo do Resend
      await delay(500);
    }

    console.log("\n==========================================");
    console.log("🏁 CAMPANHA CONCLUÍDA!");
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`❌ Falhas: ${errorCount}`);
    console.log("==========================================");

    process.exit(0);
  } catch (err) {
    console.error("Erro fatal ao rodar a campanha:", err);
    process.exit(1);
  }
}

// Inicia a execução
runCampaign();
