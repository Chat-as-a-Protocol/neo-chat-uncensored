import logger from "../lib/logger.js";

/**
 * Paths commonly probed by scanners and bots looking for exposed config files,
 * admin panels, or known vulnerable endpoints.
 */
const SUSPICIOUS_PATH_RE =
  /^\/(?:\.env(?:[^/]*)|\\.git(?:\/.*)?|\.aws(?:\/.*)?|\.ssh(?:\/.*)?|wp-admin(?:\/.*)?|wp-login(?:\.php)?|admin(?:\/.*)?|config\.php|\.htaccess|\.htpasswd|phpinfo\.php|shell\.php|eval-stdin\.php|xmlrpc\.php|\.DS_Store|web\.config|server-status|actuator(?:\/.*)?)/i;

/**
 * User-Agent substrings associated with automated scanners, scrapers, and
 * vulnerability probes. Legitimate browsers never send these.
 */
const SUSPICIOUS_UA_RE =
  /(?:aiohttp|python-requests|python-urllib|go-http-client|curl\/|wget\/|scrapy|masscan|zgrab|nikto|sqlmap|nmap|dirbuster|gobuster|wfuzz|nuclei|httpx|libwww-perl|java\/|ruby\/|php\/|perl\/|bot|crawler|spider|scanner|scraper)/i;

/**
 * blockSuspiciousRequests — security middleware that must be registered BEFORE
 * all application routes.
 *
 * Rejects requests that match known scanner/bot patterns:
 *   1. Requests targeting suspicious paths (config files, admin panels, etc.)
 *   2. Requests from suspicious User-Agents (automated tools, scrapers, etc.)
 *
 * Returns 403 Forbidden for all matched requests and logs the attempt.
 */
export const blockSuspiciousRequests = (req, res, next) => {
  const path = req.path || "";
  const ua = req.headers["user-agent"] || "";
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (SUSPICIOUS_PATH_RE.test(path)) {
    logger.warn(
      `[Security] Blocked suspicious path — ip=${ip} method=${req.method} path=${path} ua="${ua}"`,
    );
    return res.status(403).json({ error: "Forbidden" });
  }

  if (ua && SUSPICIOUS_UA_RE.test(ua)) {
    logger.warn(
      `[Security] Blocked suspicious User-Agent — ip=${ip} method=${req.method} path=${path} ua="${ua}"`,
    );
    return res.status(403).json({ error: "Forbidden" });
  }

  next();
};
