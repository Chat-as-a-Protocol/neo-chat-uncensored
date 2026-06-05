# NØX Product Contract

```text
========================================
          NØX · PRODUCT CONTRACT
========================================
Status: draft
Purpose: define what the user buys, accesses, loses, recovers, and sees
Authority: subordinate to NØX Runtime Constitution
========================================
```

## 1. Core Question

This document answers one question:

**What does the user buy, access, lose, recover, and see inside NØX?**

The Product Contract exists to prevent commercial confusion.

NØX is not only a chat interface.
NØX is an access system governed by economic state.

Every user-facing permission, limitation, upgrade path, credit balance, subscription state, and recovery flow must be explainable through a verifiable backend condition.

## 2. Central Rule

Every access state in NØX derives from a verifiable economic state:

1. ledger balance;
2. active subscription;
3. free or guest quota.

The user must always understand:

- why they have access;
- why they were blocked;
- what they currently own;
- what they currently lack;
- how to recover or extend access.

NØX must never make access feel arbitrary.

## 3. Authority Boundary

The Product Contract does not define runtime authority.
Runtime authority is defined by the NØX Runtime Constitution.

However, this document defines the commercial promise that runtime must enforce.

The interface may explain access.
The backend must decide access.
The ledger must record economic state.
The entitlement layer must translate economic state into permissions.

The agent must never invent access, promise upgrades, assume payment confirmation, or override entitlement state.

## 4. Access Modes

NØX must clearly distinguish between the following access modes.

### 4.1 Guest Mode

Guest Mode represents a temporary, low-trust session.

A Guest user may access a limited experience, but does not own a stable account identity until registration, login, or another verified identity mechanism is completed.

Guest Mode may include:

- limited daily quota;
- limited history;
- restricted recovery;
- conversion prompts;
- no durable entitlement beyond the current guest state.

Guest Mode must never override a valid identified user session.

### 4.2 Free User

A Free user has an identified account but no paid entitlement.

A Free user may access a defined free quota or limited product layer.

Free access must be treated as quota-based, not ledger-owned credit.

Free users must be able to understand:

- how much free usage remains;
- when the quota resets, if applicable;
- which features require credits or subscription;
- how to upgrade.

### 4.3 User with Credits

A user with credits has purchased or received ledger-backed usage.

Credits must be represented by ledger state, not by frontend memory, local UI assumptions, or agent interpretation.

When credits are consumed, the backend must debit the ledger only after a valid model response or valid billable event, according to runtime billing rules.

The remaining balance shown to the user should reflect the post-debit ledger state whenever possible.

### 4.4 User with Active Subscription

A user with an active subscription has access derived from subscription entitlement, even if they do not currently hold standalone token credits.

Subscription access must be resolved by entitlement logic, not by plan labels alone.

A subscription user must not be incorrectly blocked with HTTP 402 merely because token balance is zero, if the subscription grants access.

### 4.5 P.R.Ø Access

P.R.Ø represents an elevated product layer, not a separate uncontrolled persona.

P.R.Ø may unlock higher capability, deeper analysis, stronger tooling, priority access, or business-grade features, but it must remain governed by the same runtime authority model.

P.R.Ø must not imply:

- lawless behavior;
- unsafe execution;
- bypassing backend authorization;
- ignoring ledger state;
- replacing the NØX Runtime Constitution;
- operating under a separate manifesto unless explicitly loaded by runtime.

P.R.Ø is an entitlement layer, not a sovereignty exception.

## 5. Credit and Payment Concepts

### 5.1 FlowPay Credits

FlowPay credits represent paid value entering the NØX economy through the FlowPay payment system.

A FlowPay payment is not considered usable access until the backend receives, verifies, and records the corresponding ledger credit.

### 5.2 Token Packages

Token packages are commercial containers for usage credits.

A token package must resolve to a clear ledger amount or entitlement effect.

Invalid, incomplete, or unknown payment metadata must not silently become a valid subscription or credit package.

Unknown payment metadata must fail closed.

### 5.3 Ledger Balance

Ledger balance is the source of truth for purchased credit.

The frontend may display balance.
The agent may explain balance.
Only the backend and ledger may determine balance.

### 5.4 Subscription State

Subscription state must be independently verifiable.

A plan name alone is not enough.
The system must confirm that subscription entitlement exists and is active.

## 6. Blocking and HTTP 402

HTTP 402 is the canonical response for insufficient paid credit or missing economic entitlement when payment is required.

HTTP 402 must not be treated as a generic permission failure.

It means:

**The request is structurally valid, but the user does not currently have enough economic access to execute it.**

When a user receives HTTP 402, the interface should explain:

- what access is missing;
- whether the issue is insufficient credits, missing subscription, or expired entitlement;
- how to upgrade or recover access;
- whether a payment may still be pending confirmation.

## 7. Upgrade Flow

The upgrade flow must be clear, recoverable, and auditable.

A user who attempts to upgrade should be able to see:

1. what they are buying;
2. how much it costs;
3. what access it unlocks;
4. payment status;
5. confirmation state;
6. recovery path if confirmation is delayed.

NØX must not rely exclusively on invisible backend events to preserve user trust.

## 8. Post-Payment Recovery

No payment flow may depend only on an invisible webhook to produce trust in the interface.

If a user pays and the webhook is delayed, missing, rejected, or not yet reconciled, the system must provide a visible recovery state.

Acceptable recovery mechanisms include:

- polling the payment status;
- manual reconciliation endpoint;
- user-visible “confirming your credits” state;
- support/retry path;
- backend job that reconciles paid charges with missing ledger entries;
- clear logs linking payment, webhook, entitlement, and ledger outcome.

A confirmed payment must be reconcilable even if the webhook fails.

## 9. Delayed Webhook Rule

A delayed webhook must not create permanent user confusion.

If payment status is confirmed upstream but ledger credit is missing, the system should treat the situation as a reconciliation problem, not as a user failure.

The interface should avoid language that blames the user when payment confirmation is pending.

## 10. Expiration and Loss of Access

If credits, subscription, quota, or entitlement expire, the user must be shown a clear explanation.

Loss of access must be mapped to a specific state:

- free quota exhausted;
- ledger balance insufficient;
- subscription inactive;
- payment pending;
- entitlement unknown;
- session not identified;
- guest session replaced by real login;
- system error requiring retry.

The system must avoid ambiguous denial states.

## 11. History and Account Continuity

History is part of the user experience promise.

Guest history may be limited or temporary.
Identified user history may be persistent, depending on the product layer.
Paid users may receive stronger continuity, depending on entitlement.

The system must clearly distinguish between temporary guest state and durable account state.

A guest token must never override a valid identified user token.

## 12. Tier Benefits

Each product tier must define what changes for the user.

At minimum, each tier should specify:

- access limits;
- credit behavior;
- history behavior;
- model/tooling behavior;
- support/recovery behavior;
- upgrade path;
- expiration behavior;
- entitlement source.

A tier is not only a pricing label.
A tier is a contract between economic state and runtime permission.

## 13. Agent Behavior Under Product Contract

The agent may explain the current product state if that state is provided by runtime.

The agent must not:

- claim that payment was confirmed without backend confirmation;
- invent credit balance;
- promise manual upgrades;
- override HTTP 402;
- treat UI state as authority;
- confuse plan labels with entitlement;
- describe P.R.Ø as lawless or unrestricted;
- imply that access can be granted outside backend and ledger rules.

When uncertain, the agent must defer to runtime state and visible backend-confirmed status.

## 14. Runtime Loading Contract · backend/src/server.js (/api/chat)

No Product Contract rule is considered active until it is loaded by the real runtime prompt assembly path.

The runtime prompt assembly path (`backend/src/server.js`, `/api/chat` handler) must load and inject this document before any user-facing persona or operational prompt is sent to the model.

Expected governance loading order:

1. `NØX Runtime Constitution`
2. `NØX Product Contract`
3. `NØX Incident Playbook`
4. `shared/runtime-prompt.md`
5. `src/content/manifests/nox.md`

The Product Contract must be loaded before the manifesto because commercial promises and entitlement rules must constrain persona behavior.

Documentation is not authority until the real runtime prompt assembly path reads it.

## 15. Acceptance Criteria

The Product Contract is considered implemented only when:

- the document exists in the repository;
- `backend/src/server.js` (`/api/chat` finalSystemPrompt assembly path) loads it;
- the loading order is deterministic;
- missing governance documents fail visibly in development;
- product state is derived from backend, ledger, auth, and entitlement;
- the agent cannot override payment, credit, subscription, or quota state;
- HTTP 402 produces a clear user-facing recovery path;
- confirmed payments are reconcilable even when webhooks fail;
- the user can understand why access was granted, denied, delayed, or recovered.

## 16. Permanent Rule

NØX must never make the user guess what they bought, what they own, why they were blocked, or how to recover access.

Access must be explainable.
Payment must be reconcilable.
Entitlement must be verifiable.
Runtime must enforce the promise.
