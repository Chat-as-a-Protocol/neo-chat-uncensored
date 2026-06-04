<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
```text
========================================
        NØX · DEPLOY TOPOLOGY
========================================
Status: canonical
Scope: Railway production + external providers
Updated: 2026-06-04
========================================
```

## ⟠ Regra

Este documento define o desenho operacional atual do NØX.

Ele separa serviços deployados,
infra interna,
provedores externos
e nós candidatos a extração futura.

```text
Nós compartilham contratos.
Nós não compartilham arquivos.
```

────────────────────────────────────────

## ⧉ Railway Atual

```text
▓▓▓ SERVIÇOS QUE DEVEM PERMANECER
────────────────────────────────────────

┏ FRONTEND
├─ Tipo
│  Astro SSR
├─ Domínio
│  https://noxai.chat
├─ Health
│  GET /health
└─ Responsabilidade
   UI, SSR, sessão client e chamada à API NØX.

┏ backend
├─ Tipo
│  Express API
├─ Domínio
│  https://api.noxai.chat
├─ Health
│  GET /health
└─ Responsabilidade
   Auth, chat, ledger, billing, FlowPay, webhooks e e-mail.

┏ Postgres
├─ Tipo
│  Railway database
└─ Responsabilidade
   users, payments, ledger, magic links e tokens auditáveis.

┏ Redis
├─ Tipo
│  Railway cache
└─ Responsabilidade
   quota, cache, password reset, locks e idempotência.
```

────────────────────────────────────────

## ⨷ Diagrama

```text
▓▓▓ PRODUCTION FLOW
────────────────────────────────────────

Browser / App
  │
  │ https://noxai.chat
  ▼
FRONTEND
  │
  │ PUBLIC_API_URL=https://api.noxai.chat
  ▼
backend
  │
  ├── Postgres
  │     users
  │     payments
  │     ledger
  │     magic_link_tokens
  │
  ├── Redis
  │     quota
  │     cache
  │     pwd_reset:<token>
  │     webhook idempotency
  │
  ├── Venice API
  │     chat completions
  │
  ├── FlowPay API
  │     https://api.flowpay.cash
  │
  └── Resend API
        transactional e-mail
```

────────────────────────────────────────

## ⧖ Webhook

```text
▓▓▓ PAYMENT CONFIRMATION
────────────────────────────────────────

FlowPay
  │
  │ POST /api/webhooks/flowpay
  ▼
Nexus
  │
  │ ecosystem-subscriptions fan-out
  │ config/ecosystem.json
  │ nexusEvents.subscriptions[]
  ▼
backend
  │
  ├─ POST /api/webhooks/flowpay
  └─ POST /webhooks/flowpay
       │
       ├─ validar assinatura
       ├─ aplicar idempotência
       ├─ atualizar payment
       ├─ creditar ledger
       └─ enviar e-mail via Resend API
```

Target canônico para o NØX no Nexus:

```json
{
  "event": "FLOWPAY:PAYMENT_RECEIVED",
  "target": {
    "kind": "webhook",
    "url": "https://api.noxai.chat/api/webhooks/flowpay"
  },
  "secretEnv": "FLOWPAY_WEBHOOK_SECRET"
}
```

`/webhooks/flowpay` permanece como alias compatível,
mas o novo fan-out deve preferir o path canônico
`/api/webhooks/flowpay`.

`ALLOWED_ORIGINS` no Nexus não participa do webhook
server-to-server.

Adicionar `https://noxai.chat` ali apenas se o frontend NØX
chamar o Nexus pelo browser.

────────────────────────────────────────

## ⍟ Provedores Externos

```text
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ PROVEDOR           ┃ CONTRATO
┣━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Venice API         ┃ backend chama com VENICE_API_KEY
┃ FlowPay API        ┃ backend chama https://api.flowpay.cash
┃ Resend API         ┃ backend chama com RESEND_API_KEY
┃ Nexus              ┃ envia webhook assinado para backend
┗━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

`Resend Mail` não é serviço obrigatório no Railway.

Se existir apenas como starter ou placeholder,
deve sair do desenho de produção.

Se virar serviço real,
deve receber nome,
contrato,
health check
e responsabilidade própria.

────────────────────────────────────────

## ◬ Extrações Futuras

```text
▓▓▓ CANDIDATE NODES
────────────────────────────────────────

┏ Chat Runtime
├─ Estado atual
│  Ainda vive dentro do backend NØX.
├─ Saída provável
│  Nó próprio para terminal, agentes ou runtime de conversa.
└─ Regra
   NØX deve chamar por API, evento ou contrato.
   Não compartilhar arquivos.

┏ Mail Orchestrator
├─ Estado atual
│  backend NØX envia via Resend API.
├─ Saída provável
│  neo-growth-system / provider Resend / queue worker.
└─ Regra
   NØX emite evento.
   Sistema de growth entrega, audita e reprocessa.
```

────────────────────────────────────────

## ⧇ Forma Final Esperada

```text
NØX App
  ├─ frontend de produto
  ├─ conta
  ├─ upgrade
  └─ entitlement

NØX Backend
  ├─ auth
  ├─ billing
  ├─ ledger
  └─ contratos externos

Chat Runtime Node
  ├─ conversa
  ├─ agentes
  └─ execução especializada

Growth / Mail Node
  ├─ eventos
  ├─ filas
  └─ e-mail transacional
```

────────────────────────────────────────

## ◮ Fechamento

```text
▓▓▓ DEPLOY CONTRACT
────────────────────────────────────────
2 apps + 2 infra services no Railway.
Providers externos fora do grafo deployado.
Extrações futuras por contrato, não por arquivo.
────────────────────────────────────────
```
