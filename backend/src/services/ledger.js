import { randomUUID } from "node:crypto";
import redis, { IS_REAL_REDIS } from "../lib/redis.js";
import { query } from "../utils/db.js";

// Tipos de transação canônicos do NØX Ledger
export const LEDGER_TYPES = {
  TOKEN_GRANT: "TOKEN_GRANT",
  TOKEN_CONSUMPTION: "TOKEN_CONSUMPTION",
  PRO_SUBSCRIPTION: "PRO_SUBSCRIPTION",
  TOKEN_PURCHASE: "TOKEN_PURCHASE",
};

const shouldUsePostgres = (userId) =>
  Boolean(process.env.DATABASE_URL) &&
  !String(userId).startsWith("guest_") &&
  IS_REAL_REDIS;

const mapPostgresEntry = (row) => ({
  id: row.id,
  userId: row.user_id,
  amount: row.amount,
  type: row.type,
  reference: row.reference,
  createdAt: new Date(row.created_at).getTime(),
});

const addRedisEntry = async (userId, amount, type, reference) => {
  if (reference) {
    const exists = await redis.sadd(`processed_refs:${userId}`, reference);
    if (exists === 0) {
      return null;
    }
  }

  const entry = {
    id: randomUUID(),
    userId,
    amount,
    type,
    reference,
    createdAt: Date.now(),
  };
  await redis.lpush(`ledger:${userId}`, JSON.stringify(entry));

  // Calcular balanceAfter imediatamente após o push
  const allEntries = await redis.lrange(`ledger:${userId}`, 0, -1);
  const balanceAfter = allEntries
    .map((e) => JSON.parse(e))
    .reduce((acc, e) => acc + e.amount, 0);

  return { ...entry, balanceAfter };
};

export const ledgerService = {
  async addEntry(userId, amount, type, reference, options = {}) {
    const allowNegativeEnv = process.env.ALLOW_NEGATIVE_BALANCE === "true";

    // Recarga/crédito: reabilita o aviso de saldo esgotado para o futuro.
    if (amount > 0) {
      redis.del(`email:depleted:${userId}`).catch(() => {});
    }

    // Prevent negative balance if not explicitly allowed
    if (amount < 0 && !allowNegativeEnv && !options.allowNegative) {
      const currentBalance = await this.getBalance(userId);
      if (currentBalance + amount < 0) {
        throw new Error("INSUFFICIENT_FUNDS");
      }
    }

    if (shouldUsePostgres(userId)) {
      // CTE: insere e calcula o saldo resultante na mesma operação
      const result = await query(
        `WITH inserted AS (
           INSERT INTO ledger (user_id, amount, type, reference)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (reference) DO NOTHING
           RETURNING id, user_id, amount, type, reference, created_at
         )
         SELECT
           i.*,
           (SELECT COALESCE(SUM(amount), 0)::int FROM ledger WHERE user_id = $1) AS balance_after
         FROM inserted i`,
        [userId, amount, type, reference || null],
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        ...mapPostgresEntry(row),
        balanceAfter: row.balance_after,
      };
    }

    return addRedisEntry(userId, amount, type, reference);
  },

  async getBalance(userId) {
    if (shouldUsePostgres(userId)) {
      const result = await query(
        "SELECT COALESCE(SUM(amount), 0)::int AS balance FROM ledger WHERE user_id = $1",
        [userId],
      );
      return result.rows[0]?.balance ?? 0;
    }

    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    const entries = entriesStr.map((e) => JSON.parse(e));
    return entries.reduce((acc, e) => acc + e.amount, 0);
  },

  async getDailyUsage(userId, dateStr) {
    if (shouldUsePostgres(userId)) {
      const result = await query(
        `SELECT COALESCE(SUM(ABS(amount)), 0)::int AS usage
         FROM ledger
         WHERE user_id = $1
           AND amount < 0
           AND type IN ('CONSUMPTION', $2)
           AND created_at >= $3::date
           AND created_at < ($3::date + interval '1 day')`,
        [userId, LEDGER_TYPES.TOKEN_CONSUMPTION, dateStr],
      );
      return result.rows[0]?.usage ?? 0;
    }

    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    const entries = entriesStr.map((e) => JSON.parse(e));
    const startOfDay = new Date(dateStr).getTime();
    const endOfDay = startOfDay + 86400000;

    return entries
      .filter(
        (e) =>
          (e.type === "CONSUMPTION" ||
            e.type === LEDGER_TYPES.TOKEN_CONSUMPTION) &&
          e.createdAt >= startOfDay &&
          e.createdAt < endOfDay,
      )
      .reduce((acc, e) => acc + Math.abs(e.amount), 0);
  },

  async getTotalConsumption(userId) {
    if (shouldUsePostgres(userId)) {
      const result = await query(
        `SELECT COALESCE(SUM(ABS(amount)), 0)::int AS usage
         FROM ledger
         WHERE user_id = $1
           AND amount < 0
           AND type IN ('CONSUMPTION', $2)`,
        [userId, LEDGER_TYPES.TOKEN_CONSUMPTION],
      );
      return result.rows[0]?.usage ?? 0;
    }

    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    const entries = entriesStr.map((e) => JSON.parse(e));

    return entries
      .filter(
        (e) =>
          e.type === "CONSUMPTION" || e.type === LEDGER_TYPES.TOKEN_CONSUMPTION,
      )
      .reduce((acc, e) => acc + Math.abs(e.amount), 0);
  },

  async getStatement(userId) {
    if (shouldUsePostgres(userId)) {
      const result = await query(
        `SELECT id, user_id, amount, type, reference, created_at
         FROM ledger
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 200`,
        [userId],
      );
      return result.rows.map(mapPostgresEntry);
    }

    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    return entriesStr
      .map((e) => JSON.parse(e))
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  /**
   * Verifica se o usuário possui uma entrada de assinatura PRO confirmada no ledger.
   * Não depende de planKey — verifica evidência real de pagamento.
   */
  async hasActiveSubscription(userId) {
    if (shouldUsePostgres(userId)) {
      const result = await query(
        `SELECT COUNT(*)::int AS cnt FROM ledger
         WHERE user_id = $1 AND type = $2`,
        [userId, LEDGER_TYPES.PRO_SUBSCRIPTION],
      );
      return (result.rows[0]?.cnt ?? 0) > 0;
    }

    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    return entriesStr
      .map((e) => JSON.parse(e))
      .some((e) => e.type === LEDGER_TYPES.PRO_SUBSCRIPTION);
  },

  /**
   * Verifica se o usuário possui saldo positivo de tokens no ledger.
   * Saldo = soma de todas as entradas (créditos - débitos).
   */
  async hasLedgerBalance(userId) {
    const balance = await this.getBalance(userId);
    return { has: balance > 0, balance };
  },
};
