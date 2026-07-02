# 🎯 Security Recommendations — Action Plan

## Priority Matrix

| ID | Finding | Severity | Effort | Impact | Q | Owner |
|----|---------|----------|--------|--------|---|-------|
| 1  | JWT Secret Rotation | HIGH | Medium | Critical | Q3 | Backend |
| 2  | Magic Link Cleanup | HIGH | Low | High | Q3 | Backend |
| 3  | HTTPS Redirect | HIGH | Low | Critical | Q3 | DevOps |
| 4  | Webhook Replay Window | MEDIUM | Low | Medium | Q3 | Payments |
| 5  | Rate Limit Key Collision | MEDIUM | Low | Medium | Q3 | Backend |
| 6  | Ledger Balance Check | MEDIUM | Medium | High | Q3 | Backend |
| 7  | Upload Validation | MEDIUM | Medium | High | Future | Backend |
| 8  | SQL Injection Audit | MEDIUM | High | Critical | Q3 | Backend |
| 9  | Error Stack Traces | LOW | Low | Low | Q3 | Backend |
| 10 | X-Frame-Options | LOW | Low | Low | Q3 | DevOps |
| 11 | /health Rate Limit | LOW | Low | Low | Q3 | Backend |
| 12 | HTML Escaping | LOW | Low | Low | Q3 | Backend |

---

## Detailed Action Items

### Q3 2026 Sprint — HIGH Priority

#### Task 1.1: JWT Secret Rotation Strategy
- [ ] Design token revocation mechanism (Redis blacklist)
- [ ] Add `jti` claim to all issued JWTs
- [ ] Implement token introspection endpoint
- [ ] Document secret rotation SOP
- **Effort:** 8h  
**Files:** `backend/src/server.js`, `backend/src/middleware/`

#### Task 2.1: Magic Link Cleanup Job
- [ ] Add daily purge query for expired tokens
- [ ] Implement distributed lock to prevent concurrent runs
- [ ] Add logging/alerting for cleanup success/failures
- [ ] Test cleanup with 100k+ expired records
- **Effort:** 4h  
**Files:** `backend/src/server.js` (garbage collection section)

#### Task 3.1: HTTPS Enforcement
- [ ] Add HTTPS redirect middleware (production-only)
- [ ] Set HSTS header (max-age=31536000)
- [ ] Verify Railway HTTPS setup
- [ ] Test mixed-content warnings
- **Effort:** 3h  
**Files:** `backend/src/server.js` (middleware stack)

#### Task 4.1: Webhook Replay Window
- [ ] Reduce default tolerance to 60 seconds
- [ ] Add WEBHOOK_TIMESTAMP_TOLERANCE_MS env var
- [ ] Update FlowPay integration tests
- **Effort:** 2h  
**Files:** `backend/src/server.js:2109-2141`

#### Task 5.1: Rate Limit Key Isolation
- [ ] Combine `user.id + IP` in rate limit key
- [ ] Add IP extraction helper function
- [ ] Test with multi-IP scenarios (proxies)
- **Effort:** 3h  
**Files:** `backend/src/server.js:1000-1035`

#### Task 6.1: Ledger Balance Transactional Check
- [ ] Refactor /api/chat to use ledger_reservations logic
- [ ] Add PostgreSQL advisory lock for balance check
- [ ] Implement fallback to live DB query (not cache)
- [ ] Add integration tests for concurrent requests
- **Effort:** 6h  
**Files:** `backend/src/server.js:1386-1394`, `backend/src/middleware/quota.js`

#### Task 8.1: SQL Injection Audit
- [ ] Scan codebase for unsafe query() calls
- [ ] Verify all parameters are parameterized ($1, $2, etc.)
- [ ] Add ESLint rule to catch dynamic queries
- [ ] Create security testing guide
- **Effort:** 10h  
**Files:** `backend/src/utils/db.js`, `backend/src/**/*.js`

---

### Q3 2026 Sprint — MEDIUM Priority

#### Task 7.1: File Upload Validation (Preventive)
- [ ] Design file upload validation middleware
- [ ] Add MIME type whitelist
- [ ] Implement file size limits
- [ ] Add virus scan integration (ClamAV)
- [ ] Create upload security documentation
- **Effort:** 12h  
**Files:** TBD (new module)

---

### Q3 2026 Sprint — LOW Priority

#### Task 9.1: Error Message Sanitization
- [ ] Update global error handler
- [ ] Add conditional stack trace logging
- [ ] Test error responses in production mode
- **Effort:** 2h  
**Files:** `backend/src/server.js:2751-2755`

#### Task 10.1: Add X-Frame-Options
- [ ] Update Helmet configuration
- [ ] Add frameguard + xssFilter
- [ ] Test with iframe embedding
- **Effort:** 1h  
**Files:** `backend/src/server.js:225-256`

#### Task 11.1: Health Endpoint Rate Limit
- [ ] Create healthLimiter with higher threshold
- [ ] Apply to both /health endpoints
- [ ] Add skip function for monitoring bots
- **Effort:** 2h  
**Files:** `backend/src/server.js:2026-2028`

#### Task 12.1: HTML Entity Escaping
- [ ] Create escapeHtml utility function
- [ ] Apply to unsubPage, email templates
- [ ] Add unit tests for XSS prevention
- **Effort:** 2h  
**Files:** `backend/src/server.js:2041-2095`

---

## Testing Checklist

- [ ] Unit tests for all crypto/auth functions
- [ ] Integration tests for rate limiting
- [ ] Penetration test on payment webhooks
- [ ] CORS policy verification
- [ ] JWT token expiration testing
- [ ] Ledger balance audit (reconciliation)
- [ ] Load testing with rate limit enforcement
- [ ] Security headers validation (OWASP ZAP)

---

## Monitoring & Alerting

### Key Metrics to Track

1. **Authentication Failures**
   - Invalid JWT attempts
   - Magic link verification failures
   - Rate limit hits per user

2. **Webhook Events**
   - Replay attacks detected (timestamp violations)
   - Signature verification failures
   - Payment reconciliation delays

3. **Ledger Anomalies**
   - Negative balance incidents
   - Reservation expiration rate
   - Over-debit events

### Alert Rules

```yaml
alert: HighAuthFailureRate
expr: |
  rate(auth_failures_total[5m]) > 10
for: 2m
labels:
  severity: warning

alert: WebhookSignatureFailures
expr: |
  rate(webhook_signature_errors_total[5m]) > 5
for: 1m
labels:
  severity: critical
```

---

## Documentation Updates

1. **Security Policy** (`SECURITY.md`)
   - Responsible disclosure
   - Incident reporting process
   - Security contact

2. **Architecture Docs**
   - Auth flow diagram
   - Payment flow with webhook verification
   - Ledger transaction model

3. **Developer Guide**
   - Secure coding practices
   - Query parameter validation checklist
   - Rate limiting best practices

---

## Timeline

```
Q3 2026 (Week 1-2): HIGH priority items
Q3 2026 (Week 3-4): MEDIUM priority items
Q3 2026 (Week 5+):  LOW priority + testing
Q4 2026:           Follow-up audit
```

---

## Sign-Off

- [ ] Security team review
- [ ] Backend team commitment
- [ ] DevOps team sign-off
- [ ] CTO approval
