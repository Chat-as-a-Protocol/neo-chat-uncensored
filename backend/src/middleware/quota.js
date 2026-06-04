import redis from "../lib/redis.js";
import logger from "../lib/logger.js";
import { getUserPlan, FALLBACK_GUEST_PLAN } from "../utils/plans.js";
import { parsePositiveInt } from "../utils/numbers.js";
import { ledgerService } from "../services/ledger.js";

export const checkQuota = async (req, res, next) => {
  try {
    const [redisTier, redisLimit] = await Promise.all([
      redis.get(`tier:${req.user.id}`).catch(() => null),
      redis.get(`limit:${req.user.id}`).catch(() => null),
    ]);

    const isGuest = Boolean(req.user.guest);
    const clientIp =
      req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

    // Proteção por IP para Guests (Prevenir Browser Grinding)
    if (isGuest) {
      const ipUsageKey = `usage:ip:${clientIp}`;
      const ipUsage = parseInt((await redis.get(ipUsageKey)) || "0");
      const GUEST_IP_TOKEN_LIMIT = 1500;

      if (ipUsage >= GUEST_IP_TOKEN_LIMIT) {
        logger.warn(`[Quota] IP Limit reached for ${clientIp}`);
        return res.status(403).json({
          error: "IP access limit reached",
          message:
            "Limite de degustação atingido para este local. Crie uma conta para continuar sem restrições.",
          upgradeUrl: "/signup",
        });
      }
    }

    const { accessTier, planKey, tierConfig } = getUserPlan({
      redisTier,
      jwtTier: req.user.tier,
      isGuest,
    });
    const defaultLimit = parsePositiveInt(
      tierConfig.initialBalance,
      FALLBACK_GUEST_PLAN.initialBalance,
    );
    const { messageLimit } = tierConfig;
    const limit = parsePositiveInt(redisLimit, defaultLimit);

    // Validação de Contagem de Mensagens (Apenas para Guests)
    if (isGuest && messageLimit !== null && messageLimit !== undefined) {
      const msgCountKey = `msg_count:${req.user.id}`;
      const newCount = await redis.incr(msgCountKey);
      if (newCount === 1) await redis.expire(msgCountKey, 2592000); // 30 dias

      if (newCount > messageLimit) {
        logger.warn(
          `[Quota] Message limit reached for user ${req.user.id}: ${newCount}/${messageLimit}`,
        );
        const errorMessage = isGuest
          ? "E aí tá curtindo? Dá uma moral aí, conclua o cadastro e te levo de volta para o chat."
          : "Limite de mensagens atingido para sua conta gratuita.";
        return res.status(403).json({
          error: "Message limit reached",
          message: errorMessage,
          upgradeUrl: isGuest ? "/signup" : "/upgrade",
        });
      }
    }

    // ── LEDGER-FIRST: Árvore de decisão de entitlement ──
    const [{ has: hasBalance, balance }, hasSubscription] = await Promise.all([
      ledgerService.hasLedgerBalance(req.user.id),
      ledgerService.hasActiveSubscription(req.user.id),
    ]);

    if (hasBalance) {
      logger.info(
        `[Quota] LEDGER mode — user ${req.user.id}, balance ${balance}`,
      );
      req.ledgerBalance = balance;
      req.availableCredits = balance;
      req.remainingQuota = balance;
      req.currentUsage = 0;
      req.dailyLimit = null;
      req.quotaMode = "ledger";
    } else if (hasSubscription) {
      logger.info(`[Quota] SUBSCRIPTION mode — user ${req.user.id}`);
      req.ledgerBalance = null;
      req.currentUsage = 0;
      req.dailyLimit = limit;
      req.remainingQuota = null;
      req.quotaMode = "subscription";
    } else if (isGuest || planKey === "guest" || planKey === "free") {
      const usage = await ledgerService.getTotalConsumption(req.user.id);
      if (usage >= limit) {
        logger.warn(
          `[Quota] Limit exceeded for user ${req.user.id}: ${usage}/${limit}`,
        );
        const isGuestQuota = isGuest || planKey === "guest";
        return res.status(403).json({
          error: "Quota exceeded",
          message: isGuestQuota
            ? "Créditos gratuitos encerrados. Crie sua conta para continuar."
            : "Limite de tokens atingido. Adquira mais créditos para continuar.",
          usage,
          limit,
          upgradeUrl: isGuestQuota
            ? "/signup?reason=limit_reached"
            : "/upgrade",
        });
      }
      req.currentUsage = usage;
      req.dailyLimit = limit;
      req.remainingQuota = Math.max(0, limit - usage);
      req.ledgerBalance = null;
      req.quotaMode = "quota";
    } else {
      logger.warn(
        `[Ledger] No balance, no active subscription for user ${req.user.id}`,
      );
      return res.status(402).json({
        error: "Insufficient balance",
        message: "Saldo insuficiente. Adquira mais créditos para continuar.",
        balance: balance ?? 0,
        upgradeUrl: "/upgrade",
      });
    }

    req.userTier = accessTier;
    req.planTier = planKey;
    req.maxOutputTokens = parsePositiveInt(
      tierConfig.maxOutputTokens,
      FALLBACK_GUEST_PLAN.maxOutputTokens,
    );
    next();
  } catch (err) {
    logger.error(
      `[Quota] Critical error in quota enforcement for user ${req.user?.id ?? "unknown"}:`,
      err,
    );
    res.status(503).json({
      error: "Service temporarily unavailable",
      details: "Quota check failed",
    });
  }
};
