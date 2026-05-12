import "dotenv/config";
import { query } from "../utils/db.js";
import { emailService } from "../services/email.js";

// ==========================================
// CONFIGURAÇÃO DA CAMPANHA (TELEGRAM)
// ==========================================
const CAMPAIGN_TITLE = "COMUNIDADE NØX NO TELEGRAM";
const CAMPAIGN_CONTENT = `
  <p>O acesso ao terminal é só o começo da jornada.</p>
  <p>Acabamos de oficializar o nosso canal no Telegram. É lá que o submundo do NØX se encontra e se organiza.</p>
  <ul>
    <li><strong>Acesso Antecipado:</strong> Novas features e upgrades nos modelos LLM são revelados primeiro por lá.</li>
    <li><strong>Engenharia de Prompt Avançada:</strong> Vamos compartilhar dicas práticas de como extrair respostas absurdamente potentes e sem filtros do terminal.</li>
    <li><strong>Contato Direto:</strong> Converse com a comunidade e dite os próximos passos do desenvolvimento.</li>
  </ul>
  <p>O NØX evolui com quem o utiliza. Junte-se à resistência.</p>
`;
const ACTION_LABEL = "ENTRAR NO CANAL DO TELEGRAM";
const ACTION_URL = "https://t.me/noxaioficial";

// ==========================================
// FILTRO DE USUÁRIOS
// Para testar, mude para: WHERE email = 'seu_email@aqui.com'
// ==========================================
const GET_USERS_QUERY = `
  SELECT id, name, email, tier 
  FROM users 
  WHERE email IS NOT NULL 
  AND email != ''
`;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function runCampaign() {
  console.log("==========================================");
  console.log("🚀 INICIANDO DISPARO DE CAMPANHA (TELEGRAM)");
  console.log(`Título: ${CAMPAIGN_TITLE}`);
  console.log("==========================================\n");

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ ERRO: Variável RESEND_API_KEY não encontrada no .env");
    process.exit(1);
  }

  try {
    console.log("Consultando banco de dados...");
    const { rows: users } = await query(GET_USERS_QUERY);
    
    console.log(`Encontrados ${users.length} usuários válidos com e-mail.`);
    
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      console.log(`[${i + 1}/${users.length}] Enviando para: ${user.email} (${user.tier})...`);
      
      try {
        await emailService.sendFeatureAnnouncement(user.email, {
          userName: user.name,
          title: CAMPAIGN_TITLE,
          content: CAMPAIGN_CONTENT,
          actionLabel: ACTION_LABEL,
          actionUrl: ACTION_URL
        });
        
        console.log(`   ✅ Enviado com sucesso!`);
        successCount++;
      } catch (err) {
        console.error(`   ❌ Falha ao enviar para ${user.email}:`, err.message);
        errorCount++;
      }

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

runCampaign();
