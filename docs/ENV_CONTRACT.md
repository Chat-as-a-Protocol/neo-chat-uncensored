<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
```text
========================================
          NØX · ENV CONTRACT
========================================
Status: canonical
Scope: frontend Astro -> backend Express
Secrets: names only, never values
========================================
```

## ⟠ Regra

Este contrato valida nomes e responsabilidades.

Não registrar valores reais.
Não expor secrets em logs, commits ou exemplos.

Variáveis públicas podem ter valor canônico documentado.
Variáveis privadas devem aparecer apenas pelo nome.

────────────────────────────────────────

## ⧉ Frontend

```text
▓▓▓ PUBLIC ENV
────────────────────────────────────────

┏ PUBLIC_API_URL
├─ Valor canônico
│  https://api.noxai.chat
├─ Responsabilidade
│  Definir a API pública NØX chamada pelo browser.
├─ Consumidores
│  src/components/AstroChatInterface.astro
│  src/pages/account.astro
│  src/pages/login.astro
│  src/pages/signup.astro
│  src/pages/success.astro
│  src/pages/upgrade.astro
│  src/pages/auth/magic-link.astro
│  src/pages/auth/reset-password.astro
└─ Regra
   Nunca apontar para FlowPay.
```

────────────────────────────────────────

## ⨷ Backend

```text
▓▓▓ REQUIRED PRODUCTION ENV
────────────────────────────────────────

┏ FRONTEND_URL
├─ Valor canônico público
│  https://noxai.chat
├─ Responsabilidade
│  CORS, magic links, password reset e callback pós-pagamento.
└─ Regra
   Se houver múltiplos domínios, o primeiro é callback canônico.

┏ FLOWPAY_API_URL
├─ Valor canônico público
│  https://api.flowpay.cash
├─ Responsabilidade
│  Endpoint do provedor FlowPay chamado pelo backend NØX.
└─ Regra
   Nunca apontar para https://api.noxai.chat.

┏ DATABASE_URL
├─ Responsabilidade
│  Postgres de usuários, pagamentos, magic links e ledger.
└─ Regra
   Secret. Nome obrigatório; valor nunca documentado.

┏ REDIS_URL
├─ Responsabilidade
│  Quota, cache, locks, magic links, password reset e fallback.
└─ Regra
   Secret. Nome obrigatório; valor nunca documentado.

┏ JWT_SECRET
├─ Responsabilidade
│  Assinar sessões JWT do NØX.
└─ Regra
   Secret. Rotação invalida sessões existentes.

┏ VENICE_API_KEY
├─ Responsabilidade
│  Autenticar chamadas do backend para Venice.
└─ Regra
   Secret. Frontend nunca chama Venice.

┏ VENICE_MODEL
├─ Responsabilidade
│  Definir modelo Venice usado pelo proxy de chat.
└─ Regra
   Não é secret, mas controla runtime de IA.

┏ FLOWPAY_API_KEY
├─ Responsabilidade
│  Autenticar chamadas do backend NØX para FlowPay.
└─ Regra
   Deve corresponder ao segredo interno aceito pelo FlowPay.

┏ FLOWPAY_WEBHOOK_SECRET
├─ Responsabilidade
│  Validar assinatura HMAC dos webhooks FlowPay/Nexus.
└─ Regra
   Obrigatório para produção segura.

┏ RESEND_API_KEY
├─ Responsabilidade
│  Enviar magic links, reset de senha e e-mails transacionais.
└─ Regra
   Secret. Enquanto Resend estiver síncrono no NØX,
   o backend precisa desta variável.
```

────────────────────────────────────────

## ⧖ Opcionais

```text
▓▓▓ OPTIONAL / FLAGS
────────────────────────────────────────

┏ VENICE_API_BASE
└─ Override do endpoint Venice.

┏ RESEND_FROM_EMAIL
└─ Remetente de e-mail. Padrão operacional:
   NØX <send@noxai.chat>

┏ RESEND_API_URL
└─ Override do endpoint Resend.

┏ MAGIC_LINK_EXPIRATION_MINUTES
└─ TTL de magic link. Padrão runtime: 10.

┏ ENABLE_AUTH_PAGES
└─ Habilita/desabilita telas de auth no frontend.

┏ ENABLE_PRO_ENGINE_CHECKOUT
└─ Habilita endpoint legado /api/flowpay/create-charge.

┏ ENABLE_FLOWPAY_DIAGNOSTICS
└─ Habilita endpoints backend de diagnóstico FlowPay.

┏ PUBLIC_ENABLE_FLOWPAY_DIAGNOSTICS
└─ Exibe painel frontend de diagnóstico FlowPay.

┏ ALLOW_NEGATIVE_BALANCE
└─ Flag econômica do ledger.

┏ CODE_LOCK
└─ Flag operacional de bloqueio de escrita.

┏ PORT
└─ Porta do servidor.

┏ HOST
└─ Host do Astro SSR.

┏ NODE_ENV
└─ Define modo runtime.
```

────────────────────────────────────────

## ⍟ Validação

```text
▓▓▓ RESULTADO DA AUDITORIA
────────────────────────────────────────
└─ PUBLIC_API_URL existe no frontend.
└─ FRONTEND_URL existe no backend.
└─ FLOWPAY_API_URL existe no backend e possui guard contra self-call.
└─ DATABASE_URL existe no backend.
└─ REDIS_URL existe no backend.
└─ JWT_SECRET existe no backend.
└─ VENICE_API_KEY existe no backend.
└─ VENICE_MODEL existe no backend.
└─ FLOWPAY_API_KEY existe no backend.
└─ FLOWPAY_WEBHOOK_SECRET existe no backend.
└─ RESEND_API_KEY existe no backend.
```

Risco residual:
o startup validation atual do backend exige apenas parte das variáveis
de produção.

Para fail-fast total em deploy,
validar também:

```text
DATABASE_URL
REDIS_URL
FLOWPAY_API_URL
FLOWPAY_WEBHOOK_SECRET
RESEND_API_KEY
```

────────────────────────────────────────

## ◬ Fechamento

```text
▓▓▓ NØX ENV CONTRACT
────────────────────────────────────────
Frontend recebe apenas variável pública.
Backend detém secrets e autoridade.
Valores reais vivem fora do Git.
────────────────────────────────────────
```
