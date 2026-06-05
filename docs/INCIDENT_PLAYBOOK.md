# NØX Incident Playbook

```text
========================================
          NØX · INCIDENT PLAYBOOK
========================================
Status: draft
Language: English
Purpose: operational doctrine
========================================
```

## Core Question

This document answers one question:

**When NØX breaks, where do we look first, how do we confirm the cause, and what rule prevents the same failure from returning?**

The Incident Playbook exists to turn production trauma into operational memory.

NØX must not rely on vague debugging, personality guesses, interface assumptions, or improvised fixes.

Every recurring failure must become doctrine.

---

## Authority

The Incident Playbook does not replace the Runtime Constitution or the Product Contract.

It operates below them.

The hierarchy is:

```text
Runtime Constitution
↓
Product Contract
↓
Incident Playbook
↓
Runtime Prompt
↓
NØX Manifesto
↓
User-facing interaction
```

The Constitution defines authority.

The Product Contract defines the promise.

The Incident Playbook defines survival when reality breaks the promise.

---

## Operating Principle

Every incident entry must follow the same structure:

```md
## Incident Name

### Symptom
What appears to the user, developer, dashboard, API, browser, or logs.

### Likely Cause
The most probable technical or operational cause.

### Where to Look
The services, files, routes, logs, environment variables, queues, database tables, or external systems to inspect.

### How to Confirm
Commands, logs, status checks, expected payloads, headers, response codes, or traces that prove the cause.

### Correction
The patch, config change, rollback, migration, operational action, or reconciliation step.

### Permanent Rule
The doctrine created by the incident.
```

No incident is complete until it produces a permanent rule.

---

# Incident Patterns

## 1. PIX Paid, but Credits Do Not Appear

### Symptom

The user pays through PIX, but the NØX account still shows no credits, no upgraded access, or the user continues receiving HTTP 402.

### Likely Cause

- FlowPay charge was paid but webhook did not reach the Chat backend.
- Nexus route does not match the Chat webhook route.
- Signature header is missing or mismatched.
- Redis idempotency key was written before processing completed.
- Ledger credit entry was not created.
- Upgrade UI depends only on an invisible webhook and has no reconciliation or polling.

### Where to Look

- FlowPay charge status.
- Nexus webhook logs.
- Chat backend logs.
- `ecosystem.json` route configuration.
- `/webhooks/flowpay` versus `/api/webhooks/flowpay`.
- Headers: `X-Nexus-Signature`, `X-FlowPay-Signature`.
- Redis idempotency keys.
- Ledger entries for the user and payment reference.
- Upgrade page client logic.

### How to Confirm

- Confirm the FlowPay charge status is paid or completed.
- Confirm Nexus received the FlowPay event.
- Confirm Nexus forwarded the event to the Chat backend.
- Confirm the Chat backend returned a success response.
- Confirm the signature header exists and matches the expected secret.
- Confirm the ledger contains a credit entry using the payment reference.
- Confirm `/api/usage` returns the updated balance.

### Correction

- Align the canonical webhook route between Nexus and Chat.
- Accept only the expected signed route and supported legacy signature headers when explicitly required.
- Ensure webhook processing is idempotent but does not mark an event as complete before durable processing.
- Add reconciliation or polling to the upgrade flow.
- Add a visible “confirming your credits” state when payment confirmation is pending.

### Permanent Rule

A paid transaction must be recoverable even when the webhook fails.

No payment flow may depend only on an invisible webhook to produce user trust.

---

## 2. HTTP 402 for a User Who Should Have Access

### Symptom

A user with purchased credits or an active subscription receives HTTP 402.

### Likely Cause

- `checkQuota` is using plan quota instead of ledger balance.
- Subscription access is being treated as token balance access.
- `planKey` is trusted without verifying a real subscription entry.
- Entitlement resolution is stale or incomplete.
- `/api/usage` and `/api/chat` disagree about user access state.

### Where to Look

- `checkQuota` logic.
- `ledgerService.getBalance()`.
- `ledgerService.hasLedgerBalance()`.
- `ledgerService.hasActiveSubscription()`.
- `/api/usage` response.
- Ledger entries for token purchases and subscriptions.
- User auth/session state.

### How to Confirm

- Confirm the user has a positive ledger balance or active subscription entry.
- Confirm `/api/usage` returns the expected entitlement.
- Confirm `/api/chat` receives the same authenticated user identity.
- Confirm the denial path returns HTTP 402 only when there is no valid balance, subscription, or quota.

### Correction

- Enforce the entitlement tree:
  1. ledger balance;
  2. active subscription;
  3. free or guest quota;
  4. otherwise HTTP 402.
- Separate semantic credit availability from daily quota limits.
- Do not infer subscription access from display plan labels alone.

### Permanent Rule

Access must derive from verifiable economic state, not from UI hints, stale plan labels, or persona interpretation.

---

## 3. Credits Are Debited Incorrectly After Chat Completion

### Symptom

The user sees a wrong remaining balance after a response, especially during parallel requests or streaming mode.

### Likely Cause

- Remaining balance is estimated locally using stale request data.
- `addEntry` does not return the real post-debit balance.
- Streaming token accounting runs before the full response is accumulated.
- Failed model responses still trigger debit.

### Where to Look

- `ledgerService.addEntry()`.
- Chat completion debit logic.
- Streaming response accumulator.
- Tiktoken counting path.
- `/api/chat` response payload.

### How to Confirm

- Run two parallel chat requests for the same user.
- Compare returned `quota.remaining` values with actual ledger balance.
- Confirm failed Venice responses do not create debit entries.
- Confirm `balanceAfter` is returned after the ledger write.

### Correction

- Use `balanceAfter` from the ledger write result.
- Do not use `req.ledgerBalance - tokens` as final truth.
- Debit only after a valid assistant response exists.
- In streaming mode, debit after the full stream is accumulated and counted.

### Permanent Rule

The ledger is the source of truth for post-debit balance.

Estimated balance is never authority.

---

## 4. CORS Preflight Blocks Production Requests

### Symptom

Browser requests from `noxai.chat` to `api.noxai.chat` fail with CORS errors, missing `Access-Control-Allow-Origin`, or `TypeError: Failed to fetch`.

### Likely Cause

- `OPTIONS` preflight responds without validating allowed origins.
- Allowed origin list does not include the exact frontend origin.
- `Vary: Origin` is missing, causing cache contamination.
- Helmet or cross-origin policies interfere with expected headers.
- Frontend API URL resolution points to the wrong domain.

### Where to Look

- Backend CORS middleware.
- `allowedOrigins` configuration.
- `server.js` or API server entry point.
- Helmet configuration.
- Frontend API URL resolver.
- Browser Network tab.
- Railway logs.

### How to Confirm

- Send an `OPTIONS` request with the production origin.
- Confirm response status is `204` for allowed origins.
- Confirm `Access-Control-Allow-Origin` matches the requesting origin.
- Confirm `Vary: Origin` is present.
- Confirm disallowed origins do not receive permissive CORS headers.

### Correction

- Use strict origin matching.
- Return preflight success only when origin is allowed.
- Add `Vary: Origin` to allowed cross-origin responses.
- Disable conflicting cross-origin resource policies when necessary.
- Keep production CORS strict and explicit.

### Permanent Rule

CORS must be strict, deterministic, observable, and cache-safe.

Do not solve production CORS with permissive wildcard logic.

---

## 5. Railway Returns 502 During Token Purchase

### Symptom

`POST /api/tokens/purchase` returns `502 Bad Gateway`, often without expected CORS headers.

### Likely Cause

- Backend service cannot reach FlowPay.
- `FLOWPAY_API_KEY` is missing or invalid.
- `FLOWPAY_API_URL` is missing or wrong.
- Fetch request hangs until Railway proxy times out.
- The API key does not match the internal FlowPay Worker key.

### Where to Look

- Railway service environment variables.
- `FLOWPAY_API_KEY`.
- `FLOWPAY_API_URL`.
- FlowPay Worker configuration.
- Backend `flowpay.js` service.
- Railway deploy logs and runtime logs.

### How to Confirm

- Confirm the backend has the correct FlowPay API key.
- Confirm the key matches the internal key configured in the FlowPay Worker.
- Confirm `FLOWPAY_API_URL` points to the correct FlowPay API.
- Confirm outbound request returns a charge payload with `chargeId`, `brCode`, `qrCode`, and active status.
- Confirm fetch timeout is enforced.

### Correction

- Configure the correct `FLOWPAY_API_KEY` in Railway.
- Configure `FLOWPAY_API_URL` explicitly.
- Add `AbortController` timeout to FlowPay charge creation.
- Log upstream failure clearly before Railway proxy timeout.

### Permanent Rule

Payment creation must fail loudly and quickly when upstream configuration is missing.

Railway proxy timeout must never be the first observable error.

---

## 6. Auth Shows Guest Mode After Login

### Symptom

The user logs in or registers, but `/account` still shows Guest Mode, generic user state, or missing email/name.

### Likely Cause

- Old guest cookie coexists with real token in localStorage.
- Client prioritizes `nox_token` cookie without checking whether it is a guest token.
- SSR and browser JavaScript disagree about the authenticated identity.
- Real token is not promoted back to cookie.

### Where to Look

- `account.astro`.
- Chat interface component.
- Upgrade page component.
- Cookie read/write logic.
- localStorage token handling.
- `/api/usage` response.

### How to Confirm

- Inspect browser cookies and localStorage.
- Confirm guest and real tokens are both present.
- Confirm which token is sent to `/api/usage`.
- Confirm `/api/usage` returns sanitized `name` and `email` for identified users.

### Correction

- Prefer a valid non-guest token when both guest and real tokens exist.
- Promote the real token back to cookie.
- Keep SSR and client JavaScript aligned on the same identity source.
- Render identified user information only from backend response.

### Permanent Rule

A guest token must never override a valid identified session.

---

## 7. PWA Shell Moves or Breaks When Mobile Keyboard Opens

### Symptom

In PWA mode, the virtual keyboard resizes the viewport, pushes the chat shell, or leaves the interface misaligned after closing.

### Likely Cause

- Global app height tracks `visualViewport.height` directly.
- Keyboard opening changes the viewport height and collapses shell layout.
- Composer positioning does not separate keyboard inset from app viewport height.

### Where to Look

- PWA viewport handling script.
- CSS custom properties for app height and keyboard inset.
- Chat composer layout.
- Mobile Safari and Chrome PWA behavior.

### How to Confirm

- Open the app in PWA mode on mobile.
- Focus the composer input.
- Observe whether shell height changes or only composer position changes.
- Confirm `--app-viewport-height` remains stable.
- Confirm `--keyboard-inset` changes when the keyboard opens.

### Correction

- Keep the app shell height stable.
- Use keyboard inset only to move the composer/input region.
- Avoid binding the full app layout to shrinking visual viewport height.

### Permanent Rule

The keyboard may move the input.

The keyboard must not redefine the app shell.

---

## 8. Service Worker Exposes Sensitive Route Structure

### Symptom

Public `sw.js` reveals internal or sensitive application routes in explicit cache exclusion lists.

### Likely Cause

- Service worker uses a blacklist such as `NEVER_CACHE_PATHS` with system routes.
- Route names are exposed to anyone inspecting public assets.
- Cache policy is designed around what not to cache instead of what is safe to cache.

### Where to Look

- `public/sw.js`.
- Cache strategy.
- Static asset matching.
- Public build output.

### How to Confirm

- Open production `sw.js`.
- Search for internal routes like ledger, tokens, account, or billing paths.
- Confirm the cache strategy exposes route structure.

### Correction

- Replace route blacklist with static asset whitelist.
- Cache only known-safe extensions such as `.js`, `.css`, images, fonts, and static assets.
- Do not list protected application routes in public files.

### Permanent Rule

Public service workers should reveal as little route structure as possible.

Cache what is safe, not what is dangerous.

---

## 9. Venice Fails but User Is Charged

### Symptom

The model provider fails, returns an empty response, errors mid-stream, or times out, but the user is still charged credits.

### Likely Cause

- Debit occurs before response validation.
- Streaming debit occurs before full stream completion.
- Empty assistant response is treated as billable.
- Provider failure path does not short-circuit ledger debit.

### Where to Look

- Venice API integration.
- Non-streaming chat path.
- Streaming accumulator.
- Debit execution path.
- Error handling branch.
- Ledger entries around failed request timestamp.

### How to Confirm

- Simulate Venice failure or timeout.
- Confirm no debit entry is created.
- Simulate empty assistant response.
- Confirm empty response does not create debit.
- Confirm successful response creates exactly one debit.

### Correction

- Debit only after a valid assistant response exists.
- In streaming mode, accumulate full response before token count and debit.
- Treat provider failure as non-billable.
- Log provider failure separately from billing failure.

### Permanent Rule

Venice is an execution provider, not financial authority.

A failed execution cannot create a valid debit.

---

## 10. Webhook Metadata Resolves to the Wrong Product

### Symptom

A payment event with missing or invalid metadata grants subscription access, credits, or product entitlement incorrectly.

### Likely Cause

- Metadata type fallback defaults to subscription.
- Invalid token purchase metadata is accepted.
- Unknown product types are interpreted as valid.
- Webhook processing fails open instead of fail closed.

### Where to Look

- `payments.js`.
- `resolveFlowPayEntitlement()`.
- Webhook entitlement resolver.
- Token purchase metadata.
- Subscription metadata.
- Webhook tests.

### How to Confirm

- Send webhook payload with missing `metadata.type`.
- Confirm resolver returns `kind: "unknown"`.
- Send token purchase with `tokens <= 0`.
- Confirm resolver rejects it as unknown.
- Confirm unknown entitlement does not create ledger credit or subscription.

### Correction

- Remove entitlement fallbacks.
- Treat missing or invalid metadata as `kind: "unknown"`.
- Reject unknown entitlement before ledger mutation.
- Add tests for missing metadata and invalid tokens.

### Permanent Rule

Payment metadata must fail closed.

Unknown entitlement must never become paid access.

---

## 11. PNPM Install Fails on Railway With Lockfile Config Mismatch

### Symptom

Railway deployment fails during `pnpm install --prod --frozen-lockfile` with lockfile configuration mismatch.

### Likely Cause

- Runtime Docker stage copies `package.json` and `pnpm-lock.yaml` but not `pnpm-workspace.yaml`.
- PNPM overrides are defined in workspace config but missing during install.
- Lockfile was generated with different active override config.

### Where to Look

- `Dockerfile`.
- `pnpm-workspace.yaml`.
- `pnpm-lock.yaml`.
- Root `package.json`.
- Railway build logs.

### How to Confirm

- Confirm overrides exist in `pnpm-workspace.yaml`.
- Confirm Docker runtime stage copies `pnpm-workspace.yaml` before install.
- Confirm lockfile resolution matches expected package versions.

### Correction

- Keep overrides in `pnpm-workspace.yaml`.
- Copy `pnpm-workspace.yaml` before `pnpm install --frozen-lockfile`.
- Regenerate lockfile only when dependency config intentionally changes.

### Permanent Rule

Any Docker stage that runs frozen PNPM install must receive the same workspace configuration that produced the lockfile.

---

## 12. Manifest or Persona Overrides Governance

### Symptom

The agent behaves as if persona, manifesto, or tone can override entitlement, billing, safety boundaries, runtime rules, or backend authority.

### Likely Cause

- Governance documents are written but not loaded by the runtime.
- Manifest is injected before governance contracts.
- The real runtime prompt assembly path (`backend/src/server.js`, `/api/chat`) only loads persona/manifesto and ignores Constitution, Product Contract, and Incident Playbook.
- Agent interprets “autonomy” as lawlessness or adolescent rebellion.

### Where to Look

- `backend/src/server.js` (`/api/chat` handler).
- Runtime prompt assembly function (`finalSystemPrompt`).
- Governance document loader.
- `shared/runtime-prompt.md`.
- `src/content/manifests/nox.md`.
- Any prompt concatenation order.

### How to Confirm

- Inspect the final system prompt assembled by `backend/src/server.js` (`finalSystemPrompt`) in development.
- Confirm the Runtime Constitution appears before the Product Contract.
- Confirm the Product Contract appears before the Incident Playbook.
- Confirm all governance documents appear before runtime prompt and manifesto.
- Confirm missing governance files cause visible failure in development.

### Correction

- Add explicit governance document loading to the runtime prompt assembly path.
- Enforce deterministic loading order.
- Fail visibly in development if required governance files are missing.
- Do not allow manifesto-only operation.

### Permanent Rule

Documentation is not authority until runtime reads it.

Runtime beats persona.

Ledger beats narrative.

Backend beats interface.

---

# Runtime Loading Contract · backend/src/server.js (/api/chat)

No Incident Playbook rule is considered active until it is loaded by the real runtime prompt assembly path.

The real runtime prompt assembly path (`backend/src/server.js`, `/api/chat` handler) must load and inject this document before any user-facing persona or operational prompt is sent to the model.

Expected governance loading order:

1. `NØX Runtime Constitution`
2. `NØX Product Contract`
3. `NØX Incident Playbook`
4. `shared/runtime-prompt.md`
5. `src/content/manifests/nox.md`

The Incident Playbook must be loaded before the runtime prompt and manifesto because operational doctrine must constrain persona behavior during failure states.

Documentation is not authority until runtime reads it.

---

# Acceptance Criteria

The Incident Playbook is integrated only when all of the following are true:

- `backend/src/server.js` has an explicit governance loading path (`finalSystemPrompt`).
- The loading order is deterministic.
- This document is loaded after the Runtime Constitution and Product Contract.
- This document is loaded before runtime prompt and NØX manifesto.
- Missing governance documents fail visibly in development.
- The final assembled system prompt can be inspected in development.
- The agent cannot claim operational rules that are not backed by backend, ledger, auth, entitlement, logs, or loaded governance.

---

# Final Doctrine

Manifesto gives voice.

Runtime Constitution gives authority.

Product Contract gives promise.

Incident Playbook gives survival.

No production incident is wasted if it becomes doctrine.
