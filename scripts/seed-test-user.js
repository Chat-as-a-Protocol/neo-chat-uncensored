import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Redis from "ioredis";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });

const { REDIS_URL } = process.env;

if (!REDIS_URL || REDIS_URL.includes("${{")) {
  console.error(
    "[ERR] Erro: REDIS_URL não configurada ou contém placeholder da Railway.",
  );
  console.log("Certifique-se de que o .env tem a URL real do Redis.");
  process.exit(1);
}

const redis = new Redis(REDIS_URL);

async function seed() {
  const email = "[EMAIL_ADDRESS]";
  const password = "[PASSWORD]";
  const userId = "user_" + Buffer.from(email).toString("base64");

  console.log(`[SEED] Criando usuário de teste: ${email}`);

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

  console.log("[OK] Usuário criado com sucesso!");
  console.log(`[EMAIL] E-mail: ${email}`);
  console.log(`[PWD] Senha: ${password}`);
  console.log(`[ID] ID: ${userId}`);

  process.exit(0);
}

seed().catch((err) => {
  console.error("[ERR] Falha no seed:", err);
  process.exit(1);
});
