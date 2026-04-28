import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

let redis;

if (process.env.NODE_ENV === "production" || process.env.REDIS_URL?.includes("railway")) {
  if (!process.env.REDIS_URL) {
    console.error("FATAL: REDIS_URL is required in production.");
    process.exit(1);
  }
  redis = new Redis(process.env.REDIS_URL, {
    // FIX: sem retry strategy, a app travava indefinidamente ao perder conexão com Redis
    retryStrategy: (times) => {
      if (times > 5) return null; // Para de tentar após 5 falhas — não trava o processo
      return Math.min(times * 200, 2000); // Backoff exponencial: 200ms, 400ms, 800ms...
    },
    lazyConnect: true,
    maxRetriesPerRequest: 3,
  });

  redis.on("error", (err) => console.error("[Redis] Connection error:", err.message));
  redis.on("reconnecting", () => console.warn("[Redis] Reconnecting..."));
} else {
  // ===== IN-MEMORY STORE PARA DEV/TESTE =====
  const store = new Map();

  // FIX: sem suporte a TTL nativo — setex e expire não expiravam entradas consistentemente
  // Agora controlado via Map de expiração unificado
  const expiry = new Map();

  const isExpired = (k) => {
    const exp = expiry.get(k);
    if (!exp) return false;
    if (Date.now() > exp) {
      store.delete(k);
      expiry.delete(k);
      return true;
    }
    return false;
  };

  const getIfAlive = (k) => {
    if (isExpired(k)) return null;
    return store.get(k) ?? null;
  };

  redis = {
    get: async (k) => getIfAlive(k),

    set: async (k, v, ...args) => {
      store.set(k, v);
      // Suporte a: set(k, v, "EX", seconds) — compatível com ioredis
      if (args[0] === "EX" && args[1]) {
        expiry.set(k, Date.now() + args[1] * 1000);
      } else {
        expiry.delete(k); // Remove TTL anterior se existir
      }
      return "OK";
    },

    setex: async (k, sec, v) => {
      store.set(k, v);
      expiry.set(k, Date.now() + sec * 1000);
      return "OK";
    },

    incr: async (k) => {
      const v = (parseInt(getIfAlive(k)) || 0) + 1;
      store.set(k, v.toString());
      return v;
    },

    incrby: async (k, a) => {
      const v = (parseInt(getIfAlive(k)) || 0) + a;
      store.set(k, v.toString());
      return v;
    },

    decr: async (k) => {
      const v = (parseInt(getIfAlive(k)) || 0) - 1;
      store.set(k, v.toString());
      return v;
    },

    expire: async (k, sec) => {
      if (!store.has(k)) return 0;
      expiry.set(k, Date.now() + sec * 1000);
      return 1;
    },

    del: async (k) => {
      const existed = store.has(k);
      store.delete(k);
      expiry.delete(k);
      return existed ? 1 : 0;
    },

    // FIX: multi().exec() não era atômico no mock — agora executa sequencialmente
    // e retorna erros por operação no formato [err, result] compatível com ioredis
    multi: () => {
      const ops = [];
      const chain = {
        incr(k) { ops.push({ op: "incr", k }); return chain; },
        set(k, v) { ops.push({ op: "set", k, v }); return chain; },
        pexpire(k, ms) { ops.push({ op: "pexpire", k, ms }); return chain; },
        exec: async () => {
          const results = [];
          for (const { op, k, ms, v } of ops) {
            try {
              if (op === "incr") {
                const val = (parseInt(getIfAlive(k)) || 0) + 1;
                store.set(k, val.toString());
                results.push([null, val]);
              } else if (op === "set") {
                store.set(k, v);
                results.push([null, "OK"]);
              } else if (op === "pexpire") {
                if (store.has(k)) expiry.set(k, Date.now() + ms);
                results.push([null, 1]);
              }
            } catch (err) {
              results.push([err, null]);
            }
          }
          return results;
        },
      };
      return chain;
    },

    ltrim: async (k, start, end) => {
      const arr = getIfAlive(k) || [];
      store.set(k, arr.slice(start, end + 1));
      return "OK";
    },

    lpush: async (k, v) => {
      const arr = getIfAlive(k) || [];
      arr.unshift(v);
      store.set(k, arr);
      return arr.length;
    },

    lrange: async (k, start, end) => {
      const arr = getIfAlive(k) || [];
      const e = end === -1 ? arr.length : end + 1;
      return arr.slice(start, e);
    },

    // Utilitário para testes
    _flush: () => { store.clear(); expiry.clear(); },
  };
}

export default redis;
