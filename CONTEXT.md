<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Context

```text
========================================
          NØX · PROJECT CONTEXT
========================================
Status: active
Updated: 2026-06-04 (Route Contract + NØX Core)
========================================
```

## ⟠ Produto

NØX é um agent em um espaço seguro, sem censura e livre de amarras
governamentais ou corporativas.

Usuários têm privacidade, ledger de uso atômico e acesso a uma LLM
exclusiva dentro de um ambiente controlado pelo próprio protocolo.

O produto combina:

- chat Astro SSR
- backend Express soberano
- ledger de créditos
- pacotes pagos em tokens
- integração PIX via FlowPay
- webhooks auditáveis via Nexus

Manifesto ativo: `src/content/manifests/nox.md`.
P.R.Ø é camada comercial/entitlement em `shared/plans.json`.
Não assumir manifesto separado sem arquivo real em
`src/content/manifests/`.

### Resolução: Restauração NØX (2026-05-11)

Restaurado o comportamento "Uncensored" nativo do NØX
através de duas ações críticas executadas:

1. Reativação de `include_venice_system_prompt: true`
   em `backend/src/server.js`.
2. Remoção de cláusulas de escape e recusas disfarçadas
   em `shared/runtime-prompt.md` e `src/content/manifests/nox.md`.

────────────────────────────────────────

## ⧉ Stack

```text
Repo      Gitea (https://gitea.com/noxia/changeman.git)
Frontend  Astro 6 SSR + @astrojs/node
Backend   Express + Redis + Postgres
LLM       Venice (Uncensored)
Payment   FlowPay via api.flowpay.cash
Events    Nexus webhook (HMAC-SHA256)
Email     Resend
Deploy    Railway + Cloudflare
```

Auth por senha/magic-link usa Postgres.
Contas via Magic Link nascem sem senha (`password_hash` NULL).

JWT segue o padrão de **Identidade Pura**:
contém apenas o `userId`.

O backend resolve o tier dinamicamente via Postgres
em cada request.

O cookie `nox_token` sincroniza SSR e cliente.
Token guest não deve sobrepor token identificado válido
em `localStorage`.

`/api/usage` é a fonte de verdade para conta,
saldo, entitlement, `name` e `email`.

Redis:
cache operacional, quota de guests
e contagem de mensagens race-safe.

Ledger (Postgres + Redis fallback): fonte de verdade de saldo
para usuários identificados.

**LEDGER-FIRST.**

Todos os novos usuários identificados ganham
um `welcome_bonus` de 1000 tokens no ato do registro.

### Regra LEDGER-FIRST

```text
Fluxo:
User -> API -> Ledger.getBalance()
     -> Venice -> Ledger.addEntry(CONSUMPTION)

paid_basic / paid_pro -> autorização via saldo do ledger
saldo <= 0            -> HTTP 402
guest / free          -> quota por consumo
Venice falhar         -> não debita
Webhook duplicado     -> ON CONFLICT(reference)
```

────────────────────────────────────────

## ⨷ Fronteiras

```text
noxai.chat                  -> app NØX
api.noxai.chat              -> backend NØX
api.flowpay.cash            -> FlowPay (serviço próprio, Cloudflare Worker)
nexus.neoprotocol.space     -> Nexus (hub de eventos, Railway)
gitea.com/noxia             -> repositório dex
```

`FLOWPAY_API_URL` nunca aponta para `api.noxai.chat`.

`FLOWPAY_API_KEY` no Railway (backend NØX)
deve ser idêntica a `FLOWPAY_INTERNAL_API_KEY`
do Cloudflare Worker `flowpay-api`.

O FlowPay valida:

```text
x-api-key === FLOWPAY_INTERNAL_API_KEY
```

Qualquer divergência retorna `401`,
propagada pelo NØX como `502`.

────────────────────────────────────────

## ⧉ Ecossistema Chat-as-a-Protocol

O NØX (`neo-chat-uncensored`) é o core de produção ativo do
Chat-as-a-Protocol.

O root do workspace atua como control plane leve.
O PNPM workspace ativo foi reduzido ao NØX:

```text
neo-chat-uncensored
neo-chat-uncensored/backend
```

Os demais nós permanecem como topologia/submodules,
fora do caminho quente de install, check, build e deploy.

Os módulos irmãos operam com **Soberania Modular**
e **Zero-Trust**:

- **`neo-flow-system`**:
  núcleo do protocolo, teaBASE e persistência SQL direta.
- **`neo-flow-worker`**:
  executor descentralizado para filas e background jobs.
- **`neo-flow-ingest`**:
  gateway e funil de ingestão para mensagens externas.
- **`neo-flow-chat-ui` / `neo-flow-admin`**:
  interfaces auxiliares e de gestão da plataforma.
- **`neo-flow-infra`**:
  infraestrutura Docker/Postgres e banco `chat_protocol`.

**A Regra:** os nós compartilham contratos,
não compartilham arquivos nem dependências no caminho de release.

NØX opera como produto front-facing independente,
consumindo fundações do ecossistema de forma desacoplada.

────────────────────────────────────────

## ⧉ Convergência Arquitetural: NØX ⟷ Neo Growth System

O envio de e-mails transacionais,
como Magic Links e recibos P.R.Ø,
é atualmente orquestrado de forma síncrona dentro do NØX
via `email.js` + Resend.

Isso representa uma dívida técnica aceitável para MVP,
mas um gargalo para escala do ecossistema.

A visão arquitetural canônica delega mensageria
e ciclo de vida do usuário para o workspace vizinho:
**`neo-growth-system`**.

Essa transição move a infraestrutura para arquitetura
orientada a eventos.

### 1. Inversão de Controle e Desacoplamento (Event Ingestion)

O backend do NØX deixa de ser disparador de e-mails.
Ele passa a atuar como emissor de telemetria,
enviando sinais de intenção para o `neo-event-ingestor`.

Exemplos:

```text
AUTH_MAGIC_LINK_REQUESTED
LEDGER_PURCHASE_SUCCESS
```

O Chat não bloqueia o fluxo esperando resposta
de provedor externo de e-mail.

### 2. Tolerância a Falhas e Filas (Queue Workers)

Se Resend ou outro provedor sofrer instabilidade,
a requisição síncrona no Chat pode gerar perda de conversão.

Ao transferir carga para `neo-queue-worker`,
mensagens não entregues entram em retry com exponential backoff,
sem corromper o estado do chat.

### 3. Abstração de Provedor e Orquestração

Templates HTML, copywriting e gestão de `RESEND_API_KEY`
saem do Chat e entram em `neo-provider-resend`.

`neo-message-orchestrator` coordena envio e permite
troca futura de provedor sem tocar no código-fonte do NØX.

### 4. Shadow CRM e Réguas de Retenção

Ao centralizar eventos transacionais no `neo-growth-system`,
o `neo-crm-core` constrói um Shadow Profile do usuário.

Isso habilita réguas ativas de retenção e conversão,
sem transformar o backend NØX em CRM.

**O Contrato:**
o Chat gera o evento.
Growth System assegura entrega,
audita conversão e gerencia inteligência do cliente.

────────────────────────────────────────

## ⧖ Rotas

Contrato canônico frontend/backend:
`docs/ROUTE_CONTRACT.md`.

- `/`: terminal principal (NØX Core / P.R.Ø).
- `/login`: login e magic link.
- `/signup`: criação de conta.
- `/auth/magic-link`: consumo do token de e-mail.
- `/auth/reset-password`: consumo do token de reset de senha.
- `/pricing`: vitrine pública de preços.
- `/upgrade`: pacotes pagos e produto P.R.Ø.
- `/account`: conta, uso, nome e e-mail.
- `/success`: retorno pós-pagamento (Privilégios Elevados).
- `/privacy`: política de privacidade.
- `/terms`: termos.
- `/health`: health check SSR do frontend.

────────────────────────────────────────

## ⍟ Planos

Fonte de verdade: `shared/plans.json`.

Tiers atuais:
- `guest`: Ghost Access (limites estritos).
- `free`: Citizen (usuário identificado, 1k tokens welcome bonus).
- `paid_basic`: Operator (acesso prioritário, créditos NEØ / VOID).
- `paid_pro`: P.R.Ø 40k (acesso total e limite máximo de saída).

Pacotes atuais:
- `1k`: 1.000 tokens, tier `paid_basic`.
- `5k`: 5.000 tokens, tier `paid_basic`.
- `10k`: 10.000 tokens, tier `paid_basic`.
- `40k`: 40.000 tokens, tier `paid_pro`.

Usuários identificados (`free`, `paid_basic`, `paid_pro`)
são autorizados via saldo real no `ledgerService.getBalance()`.

Sessões `guest` usam quota acumulada
(consumo vs. limite do plano),
persistida em Redis por IP.
