# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in NØX, please **DO NOT** open a public GitHub issue.

### Reporting Process

1. **Email:** security@noxai.chat
2. **Subject:** `[SECURITY] Vulnerability Report - [Brief Description]`
3. **Include:**
   - Detailed description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Response Timeline

- **Acknowledgment:** Within 24 hours
- **Assessment:** Within 48 hours
- **Fix/Patch:** Within 7-14 days (depending on severity)
- **Public Disclosure:** After fix is deployed

---

## Supported Versions

| Version | Status | Security Updates |
|---------|--------|------------------|
| 4.2.x   | Active | ✅ Yes            |
| 4.1.x   | Legacy | ⚠️ Critical only  |
| < 4.0   | EOL    | ❌ No             |

---

## Security Best Practices

### For Developers

1. **Environment Variables**
   - Never commit `.env` files
   - Use `.env.example` as template
   - Rotate secrets on team member departure

2. **Dependencies**
   - Run `make audit` before commits
   - Keep Node.js >= 22.12.0
   - Review `CHANGELOG.md` for security updates

3. **Authentication**
   - JWT tokens are identity-only (no sensitive data)
   - Always verify token signature
   - Implement token revocation for logout

4. **Database**
   - Use parameterized queries ($1, $2, etc.)
   - Never interpolate user input
   - Implement row-level security (RLS) for multi-tenant data

### For Operations

1. **Deployment**
   - Enable HTTPS everywhere
   - Use Railway's secret management
   - Implement rate limiting at WAF level

2. **Monitoring**
   - Alert on failed authentication attempts
   - Monitor webhook signature failures
   - Track rate limit violations

3. **Incidents**
   - Use docs/INCIDENT_PLAYBOOK.md
   - Notify affected users within 24 hours
   - Post-mortem within 7 days

---

## Third-Party Dependencies

All dependencies are scanned for vulnerabilities using:
- `pnpm audit` (on every commit via Makefile)
- GitHub Advanced Security (continuous)
- Snyk (scheduled)

---

## Compliance

- **GDPR:** User data deletion via `/api/unsubscribe`
- **PCI DSS:** Payment data NOT stored in NØX (delegated to FlowPay)
- **OWASP Top 10:** See `docs/SECURITY_AUDIT_2026.md`

---

## Contact

- **Security:** security@noxai.chat
- **General:** hello@noxai.chat
- **Twitter:** @noxaioficial
