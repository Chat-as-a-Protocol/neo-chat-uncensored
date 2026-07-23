<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Diagrama e Especificação do Fluxo de Pagamento (NØX · FlowPay / Nexus)

```text
========================================
    NØX · PAYMENT ENGINE SPECIFICATION
========================================
Status: active
Gateway: FlowPay (https://api.flowpay.cash)
Bus: Nexus Event Dispatcher
Endpoints: /api/webhooks/flowpay (Canônico)
           /webhooks/flowpay (Alias Nexus)
========================================
```

---

## 1. Visão Geral da Arquitetura Modular

No ecossistema NØX, o faturamento e a recarga de créditos operam de forma determinística entre quatro camadas:

1. **Frontend (`frontend/src/pages/upgrade.astro`):** O usuário seleciona um pacote de créditos (`shared/plans.json`) e inicia a cobrança PIX.
2. **Nginx WAF (`nginx/nginx.conf`):** O escudo de borda em `https://api.noxai.chat` recebe a requisição do webhook e repassa o tráfego para a rede interna em `http://backend.railway.internal:3001`.
3. **Barramento Nexus:** Recebe a notificação de pagamento da FlowPay (`FLOWPAY:PAYMENT_RECEIVED`) e executa o fan-out assinado via HMAC-SHA256 para a API NØX.
4. **Backend Express (`backend/src/server.js`):** Valida a assinatura de segurança, executa deduplicação no Redis, registra a transação no Postgres HA, atualiza o Ledger e dispara o e-mail de confirmação via Resend API.

---

## 2. Contrato de Entrada e Assinatura

### Paths Aceitos
- `POST /api/webhooks/flowpay` *(Handler Canônico)*
- `POST /webhooks/flowpay` *(Alias de compatibilidade para assinatura do Nexus)*

### Inscrição de Evento no Nexus (`config/ecosystem.json`)

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

### Validação HMAC-SHA256
- O middleware captura o corpo bruto (`express.raw()`).
- O cabeçalho `X-Nexus-Signature` ou `X-FlowPay-Signature` é comparado usando `crypto.timingSafeEqual` com a digest calculada a partir de `FLOWPAY_WEBHOOK_SECRET`.

---

## 3. Diagrama do Fluxo de Execução (Mermaid)

```mermaid
flowchart TD
    A0["FlowPay gera evento FLOWPAY:PAYMENT_RECEIVED"] --> A1["Nexus Event Dispatcher"]
    A1 --> A2{"Path de Entrada no WAF (api.noxai.chat)"}
    
    A2 -->|"Canônico"| A3["POST /api/webhooks/flowpay"]
    A2 -->|"Alias Legado"| A4["POST /webhooks/flowpay"]
    
    A3 --> B["Express Middleware: express.raw()"]
    A4 --> B
    
    B --> C{"Valida HMAC-SHA256\n(X-Nexus-Signature / X-FlowPay-Signature)"}
    C -->|Inválida| C_ERR["401 Unauthorized\nInvalid Signature"]
    C -->|Válida| D["Parse JSON: event & data"]
    
    D --> E{"event == 'FLOWPAY:PAYMENT_RECEIVED'?"}
    E -->|Não| E_IGN["200 OK\n{status: 'ignored'}"]
    E -->|Sim| F["paymentService.resolveCanonicalReference(data, plans)"]
    
    F -->|Referência nula| F_ERR["400 Bad Request\nMissing canonical FlowPay reference"]
    F -->|Ok| G{"Idempotência Redis\n('webhook_processed:reference')"}
    
    G -->|Já processado| G_DUP["200 OK\n{status: 'success', message: 'Already processed'}"]
    G -->|Novo evento| H["paymentService.deriveMetadataFromReference(...)"]
    
    H --> I["resolveFlowPayWebhookUserId({data, metadata})"]
    I -->|sem userId| I_ERR["500 Internal Error\nMissing userId in payload"]
    I -->|com userId| J["Normaliza valores: paidAmountCents vs expectedAmountCents"]
    
    J --> K{"paidAmountCents >= expectedAmountCents?"}
    K -->|Não| K_ERR["400 Bad Request\nValor pago insuficiente ou inválido"]
    K -->|Sim| L["paymentService.recordFlowPayPayment(...)"]
    
    L --> M["paymentService.resolveEntitlement(trustedMetadata, {}, plans)"]
    M --> N{"entitlement.kind == 'token_purchase'?"}
    
    N -->|Sim| O1["ledgerService.addEntry(+tokens, 'TOKEN_PURCHASE')"]
    O1 --> O2{"tem tierUpgrade?"}
    O2 -->|Sim| O3["persistUserPlan(userId, tierUpgrade)"]
    O2 -->|Não| P["Avança"]
    O3 --> P
    
    N -->|Não| Q1["persistUserPlan(userId, tierUpgrade)"]
    Q1 --> Q2["ledgerService.addEntry(0, 'PRO_SUBSCRIPTION')"]
    Q2 --> P
    
    P --> R{"Entrada no Ledger gravada?"}
    R -->|Não| R_DUP["200 OK\n{status: 'success', message: 'Already processed'}"]
    R -->|Sim| S["redis.set('webhook_processed:reference', '1', 'EX', 86400)"]
    
    S --> T["sendPaymentEmail({userId, data, metadata, entitlement})"]
    T --> U["200 OK\n{status: 'success', message: 'Tokens added' / 'Tier updated'}"]
```

---

## 4. Garantias de Produção & Resiliência

1. **Deduplicação de Camada Dupla:**
   - **Camada 1 (Redis):** Chave com TTL de 24 horas (`webhook_processed:<reference>`).
   - **Camada 2 (Ledger):** Restrição de unicidade na tabela de entradas do Ledger do Postgres HA.
2. **Integridade Financeira (Centavos):** Preços e valores recebidos são convertidos e validados estritamente em centavos inteiros (`normalizeFlowPayAmountToCents`), impedindo divergências de arredondamento em ponto flutuante.
3. **Isolamento do Gateway:** O provedor externo permanece invisível ao usuário final. Todo o saldo é creditado nativamente no **Ledger auditável NØX**.
