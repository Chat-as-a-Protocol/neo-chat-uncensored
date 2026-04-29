import bcrypt from "bcryptjs";
import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL || REDIS_URL.includes("${{")) {
  console.error("❌ Erro: REDIS_URL não configurada ou contém placeholder da Railway.");
  console.log("Certifique-se de que o .env tem a URL real do Redis.");
  process.exit(1);
}

const redis = new Redis(REDIS_URL);

async function seed() {
  const email = "admin@neo.ai";
  const password = "neo123456";
  const userId = "user_" + Buffer.from(email).toString("base64");
  
  console.log(`🚀 Criando usuário de teste: ${email}`);
  
  // 1. Hash da senha
  const hash = await bcrypt.hash(password, 12);
  await redis.set(`password:${userId}`, hash);
  
  // 2. Definir Tier e Limite
  await redis.set(`tier:${userId}`, "pro");
  await redis.set(`limit:${userId}`, "500000"); // 500k tokens dia
  
  // 3. Adicionar Créditos Iniciais no Ledger
  const entry = {
    id: "seed_" + Date.now(),
    userId,
    amount: 100000,
    type: "TOPUP",
    reference: "initial_seed",
    createdAt: Date.now(),
  };
  await redis.lpush(`ledger:${userId}`, JSON.stringify(entry));

  console.log("✅ Usuário criado com sucesso!");
  console.log(`📧 E-mail: ${email}`);
  console.log(`🔑 Senha: ${password}`);
  console.log(`🆔 ID: ${userId}`);
  
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Falha no seed:", err);
  process.exit(1);
});
