import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

let redis;

if (
  process.env.NODE_ENV === "production" ||
  process.env.REDIS_URL?.includes("railway")
) {
  redis = new Redis(process.env.REDIS_URL);
} else {
  const store = new Map();
  redis = {
    get: async (k) => store.get(k) ?? null,
    set: async (k, v) => {
      store.set(k, v);
      return "OK";
    },
    setex: async (k, sec, v) => {
      store.set(k, v);
      setTimeout(() => store.delete(k), sec * 1000);
      return "OK";
    },
    incr: async (k) => {
      const v = (parseInt(store.get(k)) || 0) + 1;
      store.set(k, v.toString());
      return v;
    },
    incrby: async (k, a) => {
      const v = (parseInt(store.get(k)) || 0) + a;
      store.set(k, v.toString());
      return v;
    },
    decr: async (k) => {
      const v = (parseInt(store.get(k)) || 0) - 1;
      store.set(k, v.toString());
      return v;
    },
    expire: async () => {},
    del: async (k) => {
      store.delete(k);
      return 1;
    },
    multi: () => {
      const ops = [];
      const chain = {
        incr: function (k) {
          ops.push({ op: "incr", k });
          return chain;
        },
        pexpire: function (k, ms) {
          ops.push({ op: "pexpire", k, ms });
          return chain;
        },
        exec: async function () {
          const results = [];
          for (const { op, k, ms } of ops) {
            if (op === "incr") {
              const v = (parseInt(store.get(k)) || 0) + 1;
              store.set(k, v.toString());
              results.push([null, v]);
            } else if (op === "pexpire") {
              setTimeout(() => store.delete(k), ms);
              results.push([null, 1]);
            }
          }
          return results;
        },
      };
      return chain;
    },
    lpush: async (k, v) => {
      const arr = store.get(k) || [];
      arr.unshift(v);
      store.set(k, arr);
      return arr.length;
    },
    lrange: async (k, start, end) => {
      const arr = store.get(k) || [];
      const e = end === -1 ? arr.length : end + 1;
      return arr.slice(start, e);
    },
    // For testing purposes
    _flush: () => store.clear(),
  };
}

export default redis;
