# 🔐 Security Audit Report — NØX v4.2.0

**Date:** July 2, 2026  
**Scope:** Full-stack audit (Frontend + Backend)  
**Status:** Production-Ready with Recommendations  

---

## Executive Summary

The NØX platform demonstrates **strong foundational security practices** with:
- ✅ Robust authentication (JWT + Magic Links)
- ✅ Rate limiting & CORS protection
- ✅ Helmet.js security headers
- ✅ HMAC-SHA256 webhook signature verification
- ✅ Input validation (Zod schemas)
- ✅ Deterministic billing with Ledger resilience

**Critical Issues:** 0  
**High Priority:** 3  
**Medium Priority:** 5  
**Low Priority:** 4  

---

## 🔴 HIGH PRIORITY FINDINGS

### 1. JWT Secret Rotation & Management
**Severity:** HIGH  
**Location:** `backend/src/server.js:56-69`

**Issue:**  
JWT_SECRET is ephemeral in development. While correct, production rotation strategy is undocumented.

**Risk:**  
- Token invalidation on secret compromise requires immediate restart
- No token revocation mechanism (blacklist/denylist)
- Session continuity breaks across deployments

**Recommendation:**
```javascript
// Add token revocation via Redis
const tokenRevocationKey = `revoked_jwt:${jti}`;
await redis.setex(tokenRevocationKey, tokenExp - now, '1');

// Check during verification
const isRevoked = await redis.get(`revoked_jwt:${decoded.jti}`);
if (isRevoked) return res.status(403).json({ error: 'TOKEN_REVOKED' });
```

---

### 2. Magic Link Token Cleanup & Expiration
**Severity:** HIGH  
**Location:** `backend/src/server.js:1756-1877`

**Issue:**  
Magic link tokens stored in both PostgreSQL AND Redis. Expired tokens in DB are never purged.

**Risk:**  
- Database bloat over time
- Potential timing attacks on expired tokens
- No automatic cleanup job visible

**Recommendation:**
```javascript
// Add scheduled cleanup job
if (process.env.POSTGRES_URL) {
  setInterval(async () => {
    try {
      const result = await query(
        `DELETE FROM magic_link_tokens 
         WHERE expires_at < NOW() AND used_at IS NOT NULL
         RETURNING id`
      );
      logger.info(`[Cleanup] Purged ${result.rowCount} expired magic links`);
    } catch (err) {
      logger.error('[Cleanup] Magic link purge failed:', err);
    }
  }, 24 * 60 * 60 * 1000); // Daily
}
```

---

### 3. Missing HTTPS Redirect in Production
**Severity:** HIGH  
**Location:** `backend/src/server.js:90-130` (CORS setup)

**Issue:**  
No explicit HTTPS enforcement or hsts middleware configuration. Relies on Railway/Nginx WAF.

**Risk:**  
- Man-in-the-middle attacks on first request
- Session hijacking via plaintext JWT transmission
- Cookie interception (if added later)

**Recommendation:**
```javascript
// Add before CORS setup
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });
}
```

---

## 🟠 MEDIUM PRIORITY FINDINGS

### 4. Payment Webhook Replay Protection - Time Window
**Severity:** MEDIUM  
**Location:** `backend/src/server.js:2109-2141`

**Issue:**  
5-minute replay window may be too large for high-volume payment scenarios.

**Current Code:**
```javascript
if (isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
```

**Recommendation:**  
Reduce to 60 seconds for production, make configurable:
```javascript
const WEBHOOK_TIMESTAMP_TOLERANCE = 
  parseInt(process.env.WEBHOOK_TIMESTAMP_TOLERANCE_MS || '60000', 10);

if (Math.abs(now - ts) > WEBHOOK_TIMESTAMP_TOLERANCE) {
```

---

### 5. Rate Limit Key Collision (User ID)
**Severity:** MEDIUM  
**Location:** `backend/src/server.js:1000-1035`

**Issue:**  
Rate limiter uses `req.user.id` as key. If user.id is predictable or collides with bot patterns, attackers could target multiple accounts.

**Recommendation:**
```javascript
const createUserRateLimit = () =>
  rateLimit({
    keyGenerator: (req) => {
      // Combine user ID + IP for better isolation
      const clientIp = req.ip || 'unknown';
      return `${req.user.id}:${clientIp}`;
    },
    // ... rest of config
  });
```

---

### 6. Ledger Balance Negative Check Logic
**Severity:** MEDIUM  
**Location:** `backend/src/server.js:1386-1394`

**Issue:**  
Insufficient credits check relies on `remainingQuota` which could be stale if Redis cache is out of sync with database.

**Risk:**  
- Users may be over-billed if balance check misses actual debit
- No transactional guarantee on quota check + debit

**Recommendation:**  
Use PostgreSQL advisory locks with ledger_reservations table (already implemented in /chat/authorize but not in /api/chat):
```javascript
if (req.quotaMode === 'ledger') {
  // Force re-check from DB, don't rely on middleware cache
  const freshBalance = await ledgerService.getBalance(req.user.id);
  if (freshBalance <= 0) {
    return res.status(402).json({ error: 'INSUFFICIENT_CREDITS' });
  }
}
```

---

### 7. Missing Content-Type Validation on Uploads
**Severity:** MEDIUM  
**Location:** Backend structure

**Issue:**  
No explicit file upload validation mechanism visible. If implemented later, must validate MIME types + file size.

**Recommendation (Prevention):**
```javascript
const validateUpload = (req, res, next) => {
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  
  if (!ALLOWED_TYPES.includes(req.headers['content-type'])) {
    return res.status(415).json({ error: 'Unsupported media type' });
  }
  if (Number(req.headers['content-length']) > MAX_SIZE) {
    return res.status(413).json({ error: 'Payload too large' });
  }
  next();
};
```

---

### 8. SQL Injection via Dynamic Query Building
**Severity:** MEDIUM  
**Location:** `backend/src/utils/db.js` (not shown but inferred)

**Issue:**  
If parameterized queries are not consistently used, SQL injection is possible.

**Current Safe Pattern (✅):**
```javascript
await query("SELECT id FROM users WHERE email = $1", [email]);
```

**Unsafe Pattern (❌):**
```javascript
await query(`SELECT id FROM users WHERE email = '${email}'`); // NEVER DO THIS
```

**Recommendation:**  
Audit all `query()` calls. Consider using TypeScript + type-safe query builders (e.g., Kysely, Knex) for future work.

---

## 🟡 LOW PRIORITY FINDINGS

### 9. Error Messages Leaking Stack Traces
**Severity:** LOW  
**Location:** `backend/src/server.js:2751-2755`

**Issue:**  
Global error handler logs full stack traces. In production, these could leak to clients if not filtered.

**Current Code:**
```javascript
app.use((err, _req, res, _next) => {
  logger.error("Global Express Error:", err.stack || err);
  res.status(500).json({ error: "Something went wrong!" });
});
```

**Recommendation:**
```javascript
app.use((err, _req, res, _next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  logger.error("Global Express Error:", isDev ? (err.stack || err) : err.message);
  res.status(500).json({ 
    error: "Internal server error",
    ...(isDev && { debug: err.message })
  });
});
```

---

### 10. Missing X-Frame-Options Header
**Severity:** LOW  
**Location:** `backend/src/server.js:225-256` (Helmet config)

**Issue:**  
While Helmet.js is configured, X-Frame-Options is not explicitly mentioned.

**Recommendation:**
```javascript
app.use(
  helmet({
    // ... existing config
    frameguard: { action: 'deny' }, // Prevent clickjacking
    xssFilter: true, // Re-enable older browser XSS filters
  }),
);
```

---

### 11. No Rate Limit on /health Endpoints
**Severity:** LOW  
**Location:** `backend/src/server.js:2026-2028`

**Issue:**  
Health check endpoints have no rate limit. Could be used for enumeration attacks.

**Recommendation:**
```javascript
const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100, // Allow some burst for monitoring
  skip: (req) => req.user?.id === process.env.MONITORING_BOT_ID, // Exempt bots
});

app.get("/health", healthLimiter, (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});
```

---

### 12. Unsubscribe Page HTML Injection Risk
**Severity:** LOW  
**Location:** `backend/src/server.js:2041-2095`

**Issue:**  
The `unsubPage` function constructs HTML directly. Template injection is unlikely but improper escaping could be risky.

**Recommendation:**
```javascript
const unsubPage = (heading, message) => {
  // Escape HTML entities
  const escapeHtml = (str) => 
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  
  return `
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(message)}</p>
  `;
};
```

---

## ✅ STRENGTHS OBSERVED

1. **Zod Schema Validation** - All endpoints validate input rigorously
2. **Helmet.js Security Headers** - CSP, XSS protection, HSTS setup
3. **Rate Limiting** - Tier-aware rate limits on /api/chat
4. **HMAC Webhook Verification** - FlowPay webhooks use timings-safe comparison
5. **JWT Pure Identity** - No sensitive data in tokens
6. **Ledger Resilience** - try/finally ensures billing even on connection errors
7. **Provider Invisibility** - Active scrubbing of API key/endpoint references
8. **Environment Secrets** - .env.example never contains real secrets

---

## 🚀 RECOMMENDATIONS FOR NEXT PHASE

1. **Implement RBAC (Role-Based Access Control)** for admin operations
2. **Add OAuth2/OIDC** for federated authentication
3. **Implement API key management** for service-to-service auth
4. **Add request signing** for sensitive operations (e.g., tier upgrades)
5. **Deploy OWASP WAF rules** via Nginx/Cloudflare
6. **Set up continuous security scanning** (GitHub Advanced Security, Snyk)
7. **Document incident response playbook** (already referenced in INCIDENT_PLAYBOOK.md)
8. **Implement audit logging** for all sensitive operations

---

## Compliance Notes

- **GDPR:** Magic link opt-out implemented via `/api/unsubscribe` ✅
- **PCI DSS:** Payment data not stored in NØX (delegated to FlowPay) ✅
- **OWASP Top 10 2021:** Mitigations documented above ✅

---

## Next Steps

1. Review findings with backend team
2. Prioritize HIGH items for next sprint
3. Create GitHub issues for each recommendation
4. Add security tests to CI/CD pipeline
5. Schedule follow-up audit after 3 months

---

**Audit Completed By:** GitHub Copilot Security Scanner  
**Report Version:** 1.0  
**Confidence Level:** High (static analysis + code review)
