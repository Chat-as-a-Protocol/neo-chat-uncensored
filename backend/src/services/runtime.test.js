import { describe, before, after, it } from "node:test";
import assert from "node:assert";
import crypto from "crypto";
import request from "supertest";
import { pool } from "../utils/db.js";
import app from "../server.js";
import jwt from "jsonwebtoken";

// Como o teste exige integração real com Postgres e o usuário
// especificou "concorrência", precisamos usar process.env.DATABASE_URL
const TEST_RUN_ID = Date.now();
const TEST_USER_ID = "test_runtime_user_" + TEST_RUN_ID;
const JWT_SECRET = process.env.JWT_SECRET || "test-secret";
const FLOWPAY_WEBHOOK_SECRET = process.env.FLOWPAY_WEBHOOK_SECRET || "test-flowpay-secret";
process.env.FLOWPAY_WEBHOOK_SECRET = FLOWPAY_WEBHOOK_SECRET;

const generateToken = (userId) => {
  return jwt.sign({ id: userId, tier: "paid_pro" }, JWT_SECRET, { expiresIn: "1h" });
};

describe("Runtime Extraction - Authority & Idempotency", () => {
  // Pula os testes se não tivermos Postgres ativo para testar locks atômicos
  if (!process.env.DATABASE_URL) {
    console.log("Skipping Postgres-only runtime tests.");
    return;
  }

  before(async () => {
    // Preparar dados do usuário e saldo 
    await pool.query(`INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [TEST_USER_ID, `runtime_${TEST_RUN_ID}@test.com`]);
    // Limpar ledger e reservas deste usuário
    await pool.query(`DELETE FROM ledger_reservations WHERE user_id = $1`, [TEST_USER_ID]);
    await pool.query(`DELETE FROM ledger WHERE user_id = $1`, [TEST_USER_ID]);

    // Injetar 10.000 tokens de saldo
    await pool.query(
      `INSERT INTO ledger (user_id, amount, type, reference) VALUES ($1, $2, $3, $4)`,
      [TEST_USER_ID, 10000, "TOKEN_GRANT", "test_grant_1"]
    );
  });

  after(async () => {
    await pool.query(`DELETE FROM ledger_reservations WHERE user_id = $1`, [TEST_USER_ID]);
    await pool.query(`DELETE FROM ledger WHERE user_id = $1`, [TEST_USER_ID]);
    await pool.query(`DELETE FROM users WHERE id = $1`, [TEST_USER_ID]);
  });

  it("1. [Concorrência] Duas autorizações simultâneas não devem ultrapassar o saldo livre", async () => {
    const token = generateToken(TEST_USER_ID);
    
    // Disparar duas requisições EXTAMENTE ao mesmo tempo para competir pelo lock
    const p1 = request(app)
      .post("/chat/authorize")
      .set("Authorization", `Bearer ${token}`)
      .send({ agentId: "test_agent" });

    const p2 = request(app)
      .post("/chat/authorize")
      .set("Authorization", `Bearer ${token}`)
      .send({ agentId: "test_agent" });

    const [res1, res2] = await Promise.all([p1, p2]);

    // A primeira que pegar o lock vai reservar min(10000, 8000) = 8000
    // O saldo livre cairá para 2000.
    // A segunda deve reservar apenas 2000.
    // Total de reserva será 10000.
    // Não pode haver oversubscription!
    
    const statusCodes = [res1.status, res2.status].sort();
    assert.deepStrictEqual(statusCodes, [200, 200]);

    const reservedAmounts = [res1.body.reservedTokens, res2.body.reservedTokens].sort((a,b) => b-a);
    // Esperamos 8000 e 2000
    assert.strictEqual(reservedAmounts[0], 8000);
    assert.strictEqual(reservedAmounts[1], 2000);

    // O request de quem pegou 8000:
    global.req1 = res1.body.reservedTokens === 8000 ? res1.body : res2.body;
    global.req2 = res1.body.reservedTokens === 2000 ? res1.body : res2.body;
  });

  it("2. Saldo insuficiente/comprometido", async () => {
    const token = generateToken(TEST_USER_ID);
    
    // O saldo atual é 10.000, e temos duas reservas ativas: 8.000 e 2.000.
    // Saldo livre é 0. Deve retornar 402.
    const res = await request(app)
      .post("/chat/authorize")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    assert.strictEqual(res.status, 402);
    assert.strictEqual(res.body.error, "INSUFFICIENT_FUNDS");
  });

  it("3. Replay com timestamp velho deve falhar (Janela de 5 min)", async () => {
    const oldTimestamp = Date.now() - (6 * 60 * 1000); // 6 minutos atrás
    const payload = JSON.stringify({
      requestId: global.req1.requestId,
      jti: global.req1.requestId,
      userId: TEST_USER_ID,
      status: "completed",
      inputTokens: 100, outputTokens: 200, totalTokens: 300
    });

    const signature = crypto.createHmac("sha256", FLOWPAY_WEBHOOK_SECRET)
      .update(`${oldTimestamp}.${payload}`)
      .digest("hex");

    const res = await request(app)
      .post("/runtime/usage")
      .set("X-Nexus-Signature", signature)
      .set("X-Nexus-Timestamp", oldTimestamp.toString())
      .set("Content-Type", "application/json")
      .send(payload);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, "Request expired (replay protection)");
  });

  it("4. Assinatura inválida (HMAC rawBody) deve falhar", async () => {
    const timestamp = Date.now();
    const payload = JSON.stringify({
      requestId: global.req1.requestId, jti: global.req1.requestId,
      userId: TEST_USER_ID, status: "completed",
      inputTokens: 100, outputTokens: 200, totalTokens: 300
    });

    // Assinando com um secret errado para forjar
    const signature = crypto.createHmac("sha256", "wrong_secret")
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    const res = await request(app)
      .post("/runtime/usage")
      .set("X-Nexus-Signature", signature)
      .set("X-Nexus-Timestamp", timestamp.toString())
      .set("Content-Type", "application/json")
      .send(payload);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.error, "Invalid signature");
  });

  it("5. Reconciliação parcial bem sucedida e idempotente", async () => {
    const timestamp = Date.now();
    const payload = JSON.stringify({
      requestId: global.req1.requestId,
      jti: global.req1.requestId,
      userId: TEST_USER_ID,
      status: "aborted", // Execução parou no meio (reconciliação parcial)
      inputTokens: 100, outputTokens: 200, totalTokens: 300
    });

    const signature = crypto.createHmac("sha256", FLOWPAY_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    // Primeira chamada: deve reconciliar e cobrar 300 tokens do ledger
    const res1 = await request(app)
      .post("/runtime/usage")
      .set("X-Nexus-Signature", signature)
      .set("X-Nexus-Timestamp", timestamp.toString())
      .set("Content-Type", "application/json")
      .send(payload);

    assert.strictEqual(res1.status, 200);
    assert.strictEqual(res1.body.reconciled, true);

    // Segunda chamada idêntica: idempotência (retorna 200 already_reconciled)
    const res2 = await request(app)
      .post("/runtime/usage")
      .set("X-Nexus-Signature", signature)
      .set("X-Nexus-Timestamp", timestamp.toString())
      .set("Content-Type", "application/json")
      .send(payload);

    assert.strictEqual(res2.status, 200);
    assert.strictEqual(res2.body.already_reconciled, true);
    assert.strictEqual(res2.body.status, "aborted");

    // Verificar se o ledger subtraiu apenas uma vez
    const ledger = await pool.query(`SELECT SUM(amount)::int as total FROM ledger WHERE user_id = $1`, [TEST_USER_ID]);
    // Saldo inicial 10000 - 300 = 9700
    assert.strictEqual(ledger.rows[0].total, 9700);
  });

  it("6. Usage duplicado com requestId não existente", async () => {
    const timestamp = Date.now();
    const payload = JSON.stringify({
      requestId: "req_invalid_id_not_exist",
      jti: "req_invalid_id_not_exist",
      userId: TEST_USER_ID,
      status: "completed",
      inputTokens: 0, outputTokens: 0, totalTokens: 0
    });

    const signature = crypto.createHmac("sha256", FLOWPAY_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    const res = await request(app)
      .post("/runtime/usage")
      .set("X-Nexus-Signature", signature)
      .set("X-Nexus-Timestamp", timestamp.toString())
      .set("Content-Type", "application/json")
      .send(payload);

    assert.strictEqual(res.status, 404);
  });

  it("7. Reserva Expirada deve ignorar e registrar late_usage_event", async () => {
    const expiredReqId = "req_expired_123";
    // Força uma reserva expirada no banco
    await pool.query(
      `INSERT INTO ledger_reservations (request_id, user_id, reserved_amount, status, expires_at)
       VALUES ($1, $2, 1000, 'expired', NOW() - INTERVAL '1 hour')`,
      [expiredReqId, TEST_USER_ID]
    );

    const timestamp = Date.now();
    const payload = JSON.stringify({
      requestId: expiredReqId,
      jti: expiredReqId,
      userId: TEST_USER_ID,
      status: "completed",
      inputTokens: 10, outputTokens: 20, totalTokens: 30
    });

    const signature = crypto.createHmac("sha256", FLOWPAY_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest("hex");

    const res = await request(app)
      .post("/runtime/usage")
      .set("X-Nexus-Signature", signature)
      .set("X-Nexus-Timestamp", timestamp.toString())
      .set("Content-Type", "application/json")
      .send(payload);

    // Requisito: Não debita, apenas loga e retorna reconciled=false, reason='late_usage_event'
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.reconciled, false);
    assert.strictEqual(res.body.reason, "late_usage_event");
    assert.strictEqual(res.body.status, "expired");
  });
});
