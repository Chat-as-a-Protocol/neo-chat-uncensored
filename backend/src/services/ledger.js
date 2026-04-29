import { randomUUID } from "node:crypto";
import redis from "../lib/redis.js";

export const ledgerService = {
  async addEntry(userId, amount, type, reference) {
    // Verificação de Idempotência: Se a referência já existir, ignora
    if (reference) {
      const exists = await redis.sadd(`processed_refs:${userId}`, reference);
      if (exists === 0) {
        return null; // Já processado
      }
    }

    const entry = {
      id: randomUUID(),
      userId,
      amount, // positivo = crédito, negativo = débito
      type, // 'PURCHASE' | 'CONSUMPTION' | 'REFUND' | 'TOPUP'
      reference,
      createdAt: Date.now(),
    };
    await redis.lpush(`ledger:${userId}`, JSON.stringify(entry));
    return entry;
  },

  async getBalance(userId) {
    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    const entries = entriesStr.map((e) => JSON.parse(e));
    return entries.reduce((acc, e) => acc + e.amount, 0);
  },

  async getDailyUsage(userId, dateStr) {
    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    const entries = entriesStr.map((e) => JSON.parse(e));
    const startOfDay = new Date(dateStr).getTime();
    const endOfDay = startOfDay + 86400000;

    const usage = entries
      .filter(
        (e) =>
          e.type === "CONSUMPTION" &&
          e.createdAt >= startOfDay &&
          e.createdAt < endOfDay,
      )
      .reduce((acc, e) => acc + Math.abs(e.amount), 0);

    return usage;
  },

  async getStatement(userId) {
    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    return entriesStr.map((e) => JSON.parse(e)).sort((a, b) => b.createdAt - a.createdAt);
  },
};
