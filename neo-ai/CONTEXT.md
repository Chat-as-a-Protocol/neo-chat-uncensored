<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NΞØ · PROJECT CONTEXT

```text
========================================
     PROJECT · NEO-CHAT-UNCENSORED
========================================
Status: ACTIVE — PRÉ-MVP
Version: v1.0.0
Org: Chat-as-a-Protocol
========================================
```

> **Phase:** alpha  
> **Arch Owner:** NΞØ MELLØ  
> **Domain:** AI / Uncensored LLM Interface

## ⟠ Objetivo

Prover uma interface de chat de IA soberana e sem censura.
Focada em privacidade, liberdade de expressão e
customização extrema de personagens e modelos.

────────────────────────────────────────

## ⨷ Proposta de Valor

A plataforma resolve o problema da censura arbitrária imposta
por grandes corporações de tecnologia (Big Tech).

Oferece um ambiente onde o usuário detém o controle total sobre
os parâmetros do modelo e a privacidade das conversas.

Diferenciais estratégicos:

- Interface premium e performática (Astro Islands + Vanilla JS).
- Integração nativa com Venice AI (Privacy-first, Uncensored models).
- Arquitetura de multi-tenant para white-labeling.
- Pagamentos via FlowPay (ecossistema nativo — sem dependência de terceiros).
- Memória de longo prazo via RAG (planejado: Turso/PostgreSQL + Vectors).

────────────────────────────────────────

## ⧉ Technical Stack

```text
┏━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ LAYER            ┃ TECHNOLOGY          ┃ RATIONALE
┣━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ Package Manager  ┃ pnpm (workspace)    ┃ Workspace NEO Protocol
┃ Runtime          ┃ Node.js >=20.x      ┃ LTS for stability & Edge
┃ Frontend         ┃ Astro 6.x (static) ┃ Islands Architecture & SEO
┃ Styling          ┃ Tailwind CSS        ┃ Utility-first & Performance
┃ API Layer        ┃ Express 4.x         ┃ Control over routing & Auth
┃ Auth             ┃ JWT + bcrypt (12)   ┃ Seguro, sem DB externo no MVP
┃ Cache / State    ┃ Redis (mock dev)    ┃ Rate limits, tier & quota
┃ LLM Provider     ┃ Venice AI           ┃ Privacy & Uncensored models
┃ Payments         ┃ FlowPay (Nexus)     ┃ Ecossistema NEO — nativo
┃ Deploy           ┃ Railway + Vercel    ┃ API no Railway, UI estática
┗━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## ⧇ Posicionamento no Ecossistema NEO Protocol

Este projeto pertence à organização **Chat-as-a-Protocol**, que opera
como um sub-ecossistema dentro do ecossistema maior **NEO Protocol**.

```text
~/neomello/
  NEO-PROTOCOL/          ← hub raiz do ecossistema
    neobot-orchestrator/ ← orquestrador soberano
    neo-nexus/           ← event hub canônico
    flowpay-system       ← gateway financeiro interno
  Chat-as-a-Protocol/    ← sub-ecossistema de produto de chat
    neo-chat-uncensored/ ← este projeto (nó consumer)
```

### Regras de ecossistema que se aplicam aqui

- **Pagamentos**: usar FlowPay como provider canônico — não cadastrar
  webhooks Stripe/outros diretamente. Seguir padrão `PAYMENT_INGRESS_CANONICAL`.
- **Eventos**: receber pagamentos via Nexus (não diretamente da FlowPay).
- **pnpm**: obrigatório como package manager — `package-lock.json` proibido.
- **Secrets**: nunca em código ou docs.

────────────────────────────────────────

## ◉ FlowPay — Gateway de Pagamentos do Ecossistema

FlowPay é a infraestrutura de liquidação interna do ecossistema NEO.
Novos projetos do ecossistema **devem preferir FlowPay** em vez de
criar integrações diretas com Stripe, PagSeguro, etc.

### Endpoints da API FlowPay

```text
BASE_URL: https://api.flowpay.cash
ENV_VARS: FLOWPAY_API_URL, FLOWPAY_API_KEY

POST /api/create-charge   → cria cobrança (retorna URL de checkout)
GET  /api/charge/:id      → consulta status de cobrança
POST /api/checkout        → inicia sessão de checkout
```

### Contrato de Token ERC-20 (Base Mainnet)

```text
Name    : FlowPay
Symbol  : NEOPAY
Network : Base (chainId: 8453)
Address : 0xD49d3Fb2C2CBBA78a1E710660a628919eE78D82A
```

### Padrão Canônico de Integração de Pagamento

```text
FlowPay (api.flowpay.cash)
  → valida PIX / provider externo
    → emite FLOWPAY:PAYMENT_RECEIVED para Nexus
      → Nexus (nexus.neoprotocol.space/api/events)
        → fan-out para consumers via nexusEvents.subscriptions[]
          → neo-chat-uncensored recebe em POST /webhooks/flowpay
            → valida X-Nexus-Signature (HMAC-SHA256)
              → atualiza tier do usuário no Redis
```

**Regras obrigatórias ao integrar:**

1. Nunca cadastrar webhook do provider externo (Woovi, PIX) diretamente neste repo.
2. Declarar subscription no `ecosystem.json` do neobot-orchestrator.
3. Validar `X-Nexus-Signature` em todo endpoint consumer.
4. Processar pagamentos de forma idempotente (event_id único).
5. Configurar `secretEnv` dedicado por nó (não compartilhar secret).

### Registro como Nó Consumer no ecosystem.json

O nó `neo-chat-uncensored` deve ser declarado em:

```text
/Users/nettomello/neomello/NEO-PROTOCOL/neobot-orchestrator/config/ecosystem.json
```

Template de declaração:

```json
{
  "id": "neo-chat-uncensored",
  "org": "Chat-as-a-Protocol",
  "name": "NEO Chat Uncensored",
  "description": "Interface de chat IA sem censura. Consumer de pagamento via FlowPay/Nexus.",
  "localPath": "../../Chat-as-a-Protocol/neo-chat-uncensored",
  "repository": "https://github.com/Chat-as-a-Protocol/neo-chat-uncensored.git",
  "role": "Product Node / Chat Interface",
  "nexusEvents": {
    "subscriptions": [
      {
        "event": "FLOWPAY:PAYMENT_RECEIVED",
        "target": {
          "kind": "webhook",
          "path": "/webhooks/flowpay"
        },
        "secretEnv": "NEO_CHAT_WEBHOOK_SECRET"
      }
    ]
  },
  "hosting": {
    "platform": "Railway (API) + Vercel/Railway (Frontend)",
    "adminEmail": "neo@neoprotocol.space",
    "healthcheck": "/health"
  }
}
```

────────────────────────────────────────

## ◉ Nexus — Event Hub Canônico

```text
URL produção : https://nexus.neoprotocol.space/api/events
URL interna  : http://neo-nexus.railway.internal/api/events
URL local    : http://localhost:3000/api/events
```

Nexus distribui eventos para todos os nós via HTTP webhook com
autenticação HMAC. Este projeto não fala com Nexus diretamente —
ele *recebe* eventos do Nexus no endpoint `/webhooks/flowpay`.

Eventos relevantes para este projeto:

| Evento | Direção | Ação |
|--------|---------|------|
| `FLOWPAY:PAYMENT_RECEIVED` | ← recebe | Atualizar tier do usuário para premium |

────────────────────────────────────────

## ꙮ Glossário do Domínio

**Uncensored**
Modelos sem filtros de recusa (refusal filters)
baseados em políticas morais externas.

**Sovereignty**
Capacidade do usuário de possuir seus dados,
identidade e infraestrutura de processamento.

**FlowPay**
Gateway financeiro interno do ecossistema NEO Protocol.
Ponto único de ingresso de pagamentos — substitui Stripe para projetos do ecossistema.

**Nexus**
Event hub central do ecossistema NEO Protocol.
Distribui eventos entre nós via HTTP + HMAC. URL: `nexus.neoprotocol.space`.

**PAYMENT_INGRESS_CANONICAL**
Padrão arquitetural que define FlowPay como único ingresso externo
e Nexus como único barramento de fan-out para consumers.

**RAG**
Retrieval-Augmented Generation. Uso de contexto
externo para estender a memória da IA. (planejado)

**White-label**
Capacidade de rebrand e redistribuição da
plataforma para terceiros. (planejado)

────────────────────────────────────────

## ⧉ Estrutura do Workspace Local

```text
neo-chat-uncensored/
  backend/         ← API Node/Express (pnpm workspace)
    src/server.js  ← único arquivo de servidor
  src/
    components/    ← AstroChatInterface, SceneBackground, ui/
    layouts/       ← Layout.astro (design tokens globais)
    pages/         ← index, login, signup, upgrade, success, legal
  neo-ai/          ← contexto e docs para agentes IA
  docs/            ← assets estáticos (banner, etc.)
  public/          ← favicon, logo
```

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
```
