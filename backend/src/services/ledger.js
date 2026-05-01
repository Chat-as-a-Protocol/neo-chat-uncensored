import { randomUUID } from "node:crypto";
import redis from "../lib/redis.js";
import { query } from "../utils/db.js";

// Tipos de transação canônicos do NØX Ledger
export const LEDGER_TYPES = {
  TOKEN_CONSUMPTION: "TOKEN_CONSUMPTION",
  PRO_SUBSCRIPTION: "PRO_SUBSCRIPTION",
  TOKEN_PURCHASE: "TOKEN_PURCHASE",
};

const shouldUsePostgres = (userId) =>
  Boolean(process.env.DATABASE_URL) &&
  !String(userId).startsWith("guest_") &&
  typeof redis._flush !== "function";

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
  return entry;
};

export const ledgerService = {
  async addEntry(userId, amount, type, reference) {
    if (shouldUsePostgres(userId)) {
      const result = await query(
        `INSERT INTO ledger (user_id, amount, type, reference)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (reference) DO NOTHING
         RETURNING id, user_id, amount, type, reference, created_at`,
        [userId, amount, type, reference || null],
      );

      if (result.rows.length === 0) {
        return null;
      }

      return mapPostgresEntry(result.rows[0]);
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

    const usage = entries
      .filter(
        (e) =>
          (e.type === "CONSUMPTION" || e.type === LEDGER_TYPES.TOKEN_CONSUMPTION) &&
          e.createdAt >= startOfDay &&
          e.createdAt < endOfDay,
      )
      .reduce((acc, e) => acc + Math.abs(e.amount), 0);

    return usage;
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
    return entriesStr.map((e) => JSON.parse(e)).sort((a, b) => b.createdAt - a.createdAt);
  },
};
