import { randomUUID } from "node:crypto";
import redis from "../lib/redis.js";

// FIX: sem limite de entradas por usuário — um único usuário poderia acumular
// infinitas entradas no Redis, causando leak de memória e lentidão em lrange
const MAX_LEDGER_ENTRIES = 1000;

// FIX: JSON.parse sem try/catch — uma entrada corrompida derrubava toda a chamada
const safeParseEntry = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
};

export const ledgerService = {
  /**
   * Adiciona uma entrada no ledger do usuário.
   * @param {string} userId
   * @param {number} amount - positivo = crédito, negativo = débito
   * @param {'PURCHASE'|'CONSUMPTION'|'REFUND'|'TOPUP'} type
   * @param {string} reference
   */
  async addEntry(userId, amount, type, reference) {
    if (!userId || typeof amount !== "number" || !type || !reference) {
      throw new Error("[Ledger] Invalid entry parameters.");
    }

    const entry = {
      id: randomUUID(),
      userId,
      amount,
      type,
      reference,
      createdAt: Date.now(),
    };

    const key = `ledger:${userId}`;
    await redis.lpush(key, JSON.stringify(entry));

    // FIX: sem ltrim — ledger crescia infinitamente
    // Mantém apenas as N entradas mais recentes para evitar memory leak
    await redis.ltrim(key, 0, MAX_LEDGER_ENTRIES - 1);

    return entry;
  },

  async getBalance(userId) {
    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    return entriesStr
      .map(safeParseEntry)
      .filter(Boolean)
      .reduce((acc, e) => acc + (e.amount || 0), 0);
  },

  async getDailyUsage(userId, dateStr) {
    // FIX: new Date(dateStr) com string tipo "2026-04-28" é interpretado como UTC
    // mas Date.now() é local. Ambos agora normalizados em UTC explicitamente.
    const startOfDay = Date.UTC(
      ...dateStr.split("-").map((n, i) => i === 1 ? parseInt(n) - 1 : parseInt(n))
    );
    const endOfDay = startOfDay + 86_400_000;

    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);

    return entriesStr
      .map(safeParseEntry)
      .filter(Boolean)
      .filter((e) => e.type === "CONSUMPTION" && e.createdAt >= startOfDay && e.createdAt < endOfDay)
      .reduce((acc, e) => acc + Math.abs(e.amount || 0), 0);
  },

  async getStatement(userId) {
    const entriesStr = await redis.lrange(`ledger:${userId}`, 0, -1);
    return entriesStr
      .map(safeParseEntry)
      .filter(Boolean)
      .sort((a, b) => b.createdAt - a.createdAt);
  },
};
