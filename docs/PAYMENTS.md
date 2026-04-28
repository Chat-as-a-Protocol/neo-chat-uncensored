<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · PAYMENTS
========================================
Provider : FlowPay (ecossistema NEO)
Hub      : Nexus (nexus.neoprotocol.space)
Version  : v2.1.0
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
          → backend valida HMAC-SHA256 (timingSafeEqual)
            → pipeline Redis: tier:{userId} = "pro"
              → ledger: +100.000 tokens PURCHASE
```

## ⧉ API FlowPay

```text
BASE_URL : https://api.flowpay.cash
ENV_VARS : FLOWPAY_API_URL, FLOWPAY_API_KEY

POST /api/create-charge   → cria cobrança, retorna checkoutUrl
GET  /api/charge/:id      → consulta status
POST /api/checkout        → inicia sessão de checkout
```

## ⧇ Webhook — Validação de Assinatura

O endpoint `/webhooks/flowpay` valida a assinatura **antes de processar qualquer dado**:

```js
// Pseudocódigo
const expected = HMAC_SHA256(FLOWPAY_WEBHOOK_SECRET, rawBody);
const isValid  = timingSafeEqual(receivedSignature, expected);
if (!isValid) return 401;
```

**Sem `FLOWPAY_WEBHOOK_SECRET` em produção = rejeição automática.**  
Em desenvolvimento, a validação é ignorada com aviso no log.

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
        "secretEnv": "FLOWPAY_WEBHOOK_SECRET"
      }
    ]
  }
}
```

## ◬ Variáveis de Ambiente

```env
FLOWPAY_API_URL=https://api.flowpay.cash
FLOWPAY_API_KEY=<chave do painel FlowPay>
FLOWPAY_WEBHOOK_SECRET=<secret dedicado — nunca compartilhar>
FLOWPAY_PLAN_AMOUNT=49              # Valor BRL (padrão: 49)
FLOWPAY_CREDITS_ON_PURCHASE=100000  # Tokens por compra (padrão: 100000)
```

## ⍟ Regras Obrigatórias (Payment Ingress Canonical)

1. Nunca registrar webhook de provider (Woovi/OpenPix) diretamente aqui.
2. Todo consumer entra por `nexusEvents.subscriptions[]` no Nexus.
3. Validar `X-Nexus-Signature` em `/webhooks/flowpay` com `timingSafeEqual`.
4. Processamento idempotente — checar duplicatas via `reference` no ledger.
5. Secret dedicado por nó — `FLOWPAY_WEBHOOK_SECRET` não deve ser reusado.
6. Operações Redis via pipeline para garantir atomicidade (tier + ledger).

## ◉ Token ERC-20 FlowPay (pagamento crypto — Fase 4)

```text
Name    : FlowPay
Symbol  : NEOPAY
Network : Base (chainId: 8453)
Address : 0xD49d3Fb2C2CBBA78a1E710660a628919eE78D82A
```
