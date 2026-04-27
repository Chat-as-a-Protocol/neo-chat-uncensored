<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · PAYMENTS
========================================
Provider : FlowPay (ecossistema NEO)
Hub      : Nexus (nexus.neoprotocol.space)
========================================
```

> Este projeto segue o **Payment Ingress Canonical Pattern** do ecossistema NEO Protocol.
> Nunca cadastre webhooks de providers externos diretamente neste repo.

## ⟠ Padrão Canônico

```text
FlowPay (api.flowpay.cash)
  → valida pagamento externo (PIX / crypto)
    → emite FLOWPAY:PAYMENT_RECEIVED
      → Nexus (nexus.neoprotocol.space/api/events)
        → entrega POST /webhooks/flowpay com X-Nexus-Signature
          → backend valida HMAC e atualiza tier no Redis
```

## ⧉ API FlowPay

```text
BASE_URL : https://api.flowpay.cash
ENV_VARS : FLOWPAY_API_URL, FLOWPAY_API_KEY

POST /api/create-charge   → cria cobrança, retorna URL de checkout
GET  /api/charge/:id      → consulta status
POST /api/checkout        → inicia sessão de checkout
```

## ⧇ Registro no ecosystem.json

Para receber eventos de pagamento, este nó deve estar declarado em:

```text
NEO-PROTOCOL/neobot-orchestrator/config/ecosystem.json
```

```json
{
  "id": "neo-chat-uncensored",
  "org": "Chat-as-a-Protocol",
  "nexusEvents": {
    "subscriptions": [
      {
        "event": "FLOWPAY:PAYMENT_RECEIVED",
        "target": { "kind": "webhook", "path": "/webhooks/flowpay" },
        "secretEnv": "NEO_CHAT_WEBHOOK_SECRET"
      }
    ]
  }
}
```

## ◬ Variáveis de Ambiente Necessárias

```env
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=<chave do painel FlowPay>
NEO_CHAT_WEBHOOK_SECRET=<secret dedicado — nunca compartilhar>
```

## ⍟ Regras Obrigatórias (Payment Ingress Canonical)

1. Nunca registrar webhook Woovi/OpenPix/provider diretamente aqui.
2. Todo consumer entra por `nexusEvents.subscriptions[]`.
3. Validar `X-Nexus-Signature` em `/webhooks/flowpay`.
4. Processamento idempotente — checar `event_id` antes de atualizar tier.
5. Secret dedicado por nó — `NEO_CHAT_WEBHOOK_SECRET` não deve ser reusado.

## ◉ Token ERC-20 FlowPay (pagamento crypto — Fase 4)

```text
Name    : FlowPay
Symbol  : NEOPAY
Network : Base (chainId: 8453)
Address : 0xD49d3Fb2C2CBBA78a1E710660a628919eE78D82A
```
