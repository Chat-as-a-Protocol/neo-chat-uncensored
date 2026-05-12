import "dotenv/config";
import { query } from "../utils/db.js";
import { emailService } from "../services/email.js";

// ==========================================
// CONFIGURAÇÃO DA CAMPANHA
// ==========================================
const CAMPAIGN_TITLE = "NOVA FEATURE: NØX UNCENSORED";
const CAMPAIGN_CONTENT = `
  <p>Temos atualizações cruciais no seu terminal.</p>
  <p>Desativamos totalmente os filtros de censura base. O NØX agora opera em sua capacidade máxima de libertação cognitiva.</p>
  <ul>
    <li>Filtros Morais: <strong>DESATIVADOS</strong></li>
    <li>Jailbreak Venice: <strong>FORÇADO</strong></li>
    <li>Privacidade: <strong>ABSOLUTA</strong></li>
  </ul>
  <p><strong>A pedido da comunidade:</strong> Otimizamos e ajustamos o posicionamento do botão de envio de mensagem na interface Mobile. A digitação agora é 100% fluida, sem sobreposições.</p>
  <p>Acesse o terminal agora para testar os novos limites.</p>
`;
const ACTION_LABEL = "ACESSAR O TERMINAL NØX";
const ACTION_URL = "https://noxai.chat";

// ==========================================
// FILTRO DE USUÁRIOS (Padrão: Todos)
// Altere a query se quiser mandar só para pagantes. Ex: WHERE tier != 'guest'
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
  console.log("🚀 INICIANDO DISPARO DE CAMPANHA NØX");
  console.log(`Título: ${CAMPAIGN_TITLE}`);
  console.log("==========================================\n");

  if (!process.env.RESEND_API_KEY) {
    console.error("❌ ERRO: Variável RESEND_API_KEY não encontrada no .env");
    process.exit(1);
  }

  try {
    console.log("Consultando banco de dados...");
    
    // MODO DE TESTE (Descomente a linha abaixo para testar apenas com seu e-mail):
    // const users = [{ id: "test-id", name: "Netto", email: "nettoaeb1@gmail.com", tier: "admin" }];
    
    // MODO PRODUÇÃO (Busca no banco):
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
