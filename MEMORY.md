<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Memory

```text
========================================
          NØX · TECHNICAL MEMORY
========================================
Status: active
Updated: 2026-05-11
========================================
```

## ⟠ Decisões

- Marca: `NØX` (Soberania Digital e Autonomia Implacável).
- Repositório Canônico: Gitea (`gitea.com/noxia/changeman`).
- Domínios: `noxai.chat` (App), `api.noxai.chat` (API).
- Plano P.R.Ø: Risco Otimizado (Foco em ROI e Exploração de Sistemas).
- Manifest ativo único: `src/content/manifests/nox.md`; `analyst.md` foi desativado/removido.
- Auth: Suporte a Magic Link sem senha (DB permite `password_hash` NULL).
- Quotas: Proteção contra race-conditions via `redis.incr` atômico.
- SSE: Buffer de linha no backend para garantir precisão no faturamento de tokens.
- Estética: Geometria pura, zero emojis, tom de terminal de comando.
- Sucesso: Página refatorada para "Privilégios Elevados" e "Comando de Terminal".

────────────────────────────────────────

## ⧉ Incidentes e Evoluções

### Migração e Soberania (2026-05-03)

Sintoma: Dependência de infraestrutura centralizada (GitHub).
Causa: Necessidade de alinhamento com os valores de soberania do NØX.
Correção: Repositório migrado para Gitea privado. GitHub mantido apenas como backup local (remoto removido).

### Redefinição Tonal (Uncensored)

Sintoma: Personas muito "tímidas" ou corporativas.
Causa: O NØX deve ser uma ferramenta de quebra de restrições e autonomia total.
Correção: Manifestos `nox.md` e `analyst.md` (P.R.Ø) atualizados para tom agressivo, focado em quebra de correntes, exploração de vulnerabilidades e captura de valor.

### Vulnerabilidade de Quota (Race Condition)

Sintoma: Possibilidade de usuários ultrapassarem limites em requisições simultâneas.
Causa: Lógica de `incr` seguida de `decr` permitia janelas de vazamento.
Correção: Implementado incremento atômico puro. Se ultrapassar, a requisição é bloqueada imediatamente sem decremento compensatório.

### Estabilidade PWA e Teclado Mobile

Sintoma: Em modo PWA, o teclado virtual podia redimensionar a viewport, empurrar a interface e deixar o shell fora do lugar ao fechar.
Causa: A altura global `--app-viewport-height` acompanhava `visualViewport.height`, que encolhe quando o teclado abre.
Correção: A altura do app passou a ser estável; o teclado altera apenas `--keyboard-inset`, usado pelo compositor do chat para subir o input sem deslocar o shell.

### Blindagem de Conectividade e Ingress (2026-05-03)

Sintoma: Erros de `TypeError: Failed to fetch` e `ERR_FAILED` (CORS) em produção.
Causa: Preflight de CORS bloqueando subdomínios (www) e headers extras. Lógica de URL da API no frontend conflitando com domínios customizados.
Correção:
- Backend: Implementado **CORS Manual (Brute Force)** via middleware customizado. Restaurada a lista estrita de **`allowedOrigins`** (noxai.chat e Railway) para garantir segurança e integridade, removendo lógicas permissivas de `includes` ou `localhost` em produção.
- Frontend: Resolução de `apiUrl` simplificada e adição de **Logs de Depuração** no `catch` da cota e da sessão para visibilidade total de falhas de rede.
- PWA: Service Worker v4 resiliente (loop `try/catch` individual para assets) e correção de caminhos de ícones.

### Alinhamento com Protocolo Nexus

Sintoma: Webhooks fora do padrão de segurança do ecossistema.
Causa: Necessidade de padronização com o Ingress do Nexus.
Correção: Endpoint de webhook movido para `/api/webhooks/flowpay`. Adicionado suporte ao header legado `X-FlowPay-Signature` junto ao `X-Nexus-Signature`. Implementada idempotência antecipada no Redis (check antes do processamento).

### Ingress de Desenvolvimento Local (Tunnel)

Sintoma: Webhooks do FlowPay não chegavam ao backend local durante os testes.
Causa: O túnel (`neo-tunnel`) estava configurado para a porta 4321 (Frontend), mas o processamento de webhooks ocorre na porta 3001 (Backend).
Correção: Atualizado o `Makefile` do `neo-tunnel` e do `neo-nexus` para apontar o serviço `flowpay` para `localhost:3001`.
Regra: Sempre rodar `make tunnel-flowpay` a partir do Nexus para expor o backend do chat para o ecossistema externo.

### CORS Preflight Silencioso (2026-05-06)

Sintoma: `Access-Control-Allow-Origin` ausente em respostas de preflight (`OPTIONS`). Browser bloqueava todas as requisições de `noxai.chat` para `api.noxai.chat`.
Causa: Dois bugs no middleware CORS do `server.js`:
- O `if (method === "OPTIONS")` respondia `200` **independente** do `isAllowed`, enviando preflight vazio para origins não permitidas (e válidas cuja lógica falhava silenciosamente).
- `helmet()` sem `crossOriginResourcePolicy: false` podia interferir com headers cross-origin.
- Header `Vary: Origin` ausente permitia caches intermediários servirem resposta CORS incorreta.
Correção:
- Preflight agora responde `204` apenas quando `isAllowed && method === 'OPTIONS'`.
- Adicionado `crossOriginResourcePolicy: false` no Helmet.
- Adicionado `Vary: Origin` em todas as respostas com origem permitida.

### LEDGER-FIRST: checkQuota (2026-05-06)

Sintoma: Usuários com saldo comprado (créditos FlowPay) eram bloqueados pelo limite de plano do Redis (`limit:userId`), ignorando o saldo real do ledger.
Causa: `checkQuota` usava `getTotalConsumption() >= redisLimit` para todos os usuários — o Redis limit do plano mandava mais que o ledger, quebrando a regra LEDGER-FIRST.
Correção (patch cirúrgico em `server.js`):
- **Usuários pagantes** (`paid_basic`, `paid_pro`): autorização via `ledgerService.getBalance()`. Saldo insuficiente retorna **HTTP 402**.
- **Guests e free**: mantêm o sistema de limite por consumo acumulado (quota diária).
- Modo não-streaming: debit só ocorre se Venice retornar resposta válida (`assistantText` não vazia).
- Modo streaming: debit síncrono via Tiktoken após acumulação do stream completo — Venice falhar = sem debit.
- Referência de webhook com `ON CONFLICT(reference)` garante idempotência; crédito duplicado não duplica.

### Entitlement Tree — 3 modos de acesso (2026-05-06)

Sintoma: edge case crítico — usuário `paid_pro` por assinatura pura (`pro_analyst`) com `balance = 0` recebia HTTP 402, pois `checkQuota` só verificava saldo do ledger.
Causa: `isPaidUser` sem distinguir entre ledger balance e assinatura ativa.
Correção: Substituição da lógica por árvore de decisão com duas funções no `ledgerService`:
- `hasLedgerBalance(userId)` → `{ has: boolean, balance: number }`
- `hasActiveSubscription(userId)` → verifica entrada `PRO_SUBSCRIPTION` real no ledger, não só `planKey`
Decisão em checkQuota:
  1. `hasBalance` → LEDGER mode (tokens comprados)
  2. `hasSubscription` → SUBSCRIPTION mode (pro_analyst sem tokens avulsos)
  3. free/guest → quota acumulada
  4. else → HTTP 402
`req.availableCredits` (semântico) separado de `req.dailyLimit` (quota).

### Hardening payments.js — remover fallback pro_subscription (2026-05-06)

Sintoma: `metadata.type` ausente ou inválido silenciosamente virava `"pro_subscription"`, comportamento quasi fail-open.
Cause: `String(metadata.type || "pro_subscription")` como default.
Correção:
- `metadata.type` vazio → `kind: "unknown"` imediato + warn. Não assume subscription.
- `token_purchase` com `tokens ≤ 0` → `kind: "unknown"`. Barrado antes do webhook.
Impacto: nenhuma regressão (testes de caminho válido mantidos; 2 novos casos de segurança adicionados).

### addEntry retorna balanceAfter — eliminar STALE no /api/chat (2026-05-06)

Sintoma: `/api/chat` respondia `quota.remaining` calculado com `req.ledgerBalance - tokens`, capturado antes do consumo — impreciso em requests paralelos.
Cause: `addEntry` não retornava o saldo resultante.
Correção sem migration de schema:
- Postgres: CTE que executa `INSERT` + `SELECT SUM(amount) AS balance_after` na mesma operação atômica.
- Redis: soma imediata após `lpush`.
- `server.js`: captura `entry.balanceAfter` de `addEntry` e usa como `remaining` na resposta. Fallback para estimativa local se `addEntry` falhar.
Regra: `balanceAfter` é sempre pós-debit real — não STALE.

### Hardening de Arquitetura e Identidade Soberana (2026-05-06)

Sintoma: Identidade do usuário baseada em "hints" de UX (`tier_upgrade`) e bugs de dessincronização de autenticação entre SSR e Client.
Causa: O sistema de "planos" estava mascarando a realidade econômica do protocolo (créditos + camadas de acesso).
Correção:
- **Modelo de Estado:** O `/api/usage` agora é a fonte de verdade absoluta, retornando `entitlement` (calculado via ledger/assinatura) e `balance`.
- **Auth Sync:** Migração da fonte de verdade do token para **Cookies**, garantindo que o JS do cliente opere sob a mesma autoridade que o Astro SSR.
- **Packages:** Padronização dos pacotes de tokens como `access_level: credits`. O status `paid_pro` (ELITE) agora é reservado exclusivamente para o produto de assinatura de negócio.
- **Funil de Conversão:** Adicionado banner estratégico na página de conta para converter `Guest Mode` em usuários identificados via promessa de benefícios claros (tokens, histórico e créditos).
- **Vanilla Scripting:** Limpeza de tipos TS nos scripts de cliente para máxima compatibilidade e resiliência de runtime.
- **UI "The Architect":** Finalização do efeito de refração ácida na conta e padronização de rotas em inglês (`/account`, `/pricing`).

### PIX em Produção Funcionando — FlowPay API Key (2026-05-06)

Sintoma: `POST /api/tokens/purchase` retornava `502 Bad Gateway` sem headers CORS. Browser bloqueava com `No Access-Control-Allow-Origin`.
Causa raiz: `FLOWPAY_API_KEY` não estava configurada no serviço NØX backend do Railway. O Railway estava retornando 502 de proxy antes do Node.js responder (timeout no fetch para FlowPay).
Causa secundária: A chave adicionada inicialmente (`8739***`, 64 chars) não era a `FLOWPAY_INTERNAL_API_KEY` do Cloudflare Worker. A chave correta é a mesma usada em outros projetos do ecossistema — encontrada no `.env` do FluxxDAO.
Correção:
- Adicionado `FLOWPAY_API_KEY` correto no Railway (serviço backend) — valor obtido do Cloudflare Worker `flowpay-api` → `FLOWPAY_INTERNAL_API_KEY`.
- Adicionado `FLOWPAY_API_URL=https://api.flowpay.cash` no Railway.
- `backend/src/services/flowpay.js`: adicionado `AbortController` com timeout de 15s em `createFlowPayCharge` para evitar Railway 502 por hang.
Resultado: PIX gerado com sucesso — `chargeId`, `brCode`, `qrCode` e `status: ACTIVE` retornados. QR renderizado na UI `/upgrade`.
Regra: A `FLOWPAY_API_KEY` no NØX deve sempre bater com `FLOWPAY_INTERNAL_API_KEY` do Cloudflare Worker `flowpay-api`.

### Falha de Webhook e Desajuste de Rota (2026-05-08)

Sintoma: Webhooks do FlowPay não eram processados pelo Chat após pagamento PIX real.
Causa 1: O Chat esperava o webhook em `/api/webhooks/flowpay`, mas o Nexus está configurado no `ecosystem.json` para enviar para `/webhooks/flowpay` (sem o prefixo `/api`).
Causa 2: Após ajuste da rota, a requisição falhou com `401 Unauthorized` devido a `Missing signature`. O chat não encontrou `x-nexus-signature` nem `x-flowpay-signature` nos headers enviados pelo Nexus.
Causa 3: A tela `/upgrade` não faz polling, dependendo exclusivamente do webhook invisível para saber quando redirecionar.
Regra: O fluxo canônico é `Provider -> FlowPay -> Nexus -> Chat`. O chat deve estar preparado para receber do Nexus na rota combinada no `ecosystem.json`.

### Auth Sync — cookie guest não vence token real (2026-05-11)

Sintoma: `/account` podia mostrar `Guest Mode` e `Usuário` mesmo após cadastro/login quando um cookie guest antigo coexistia com token real em `localStorage`.
Causa: Os clientes priorizavam o cookie `nox_token` sem diferenciar token guest de token identificado.
Correção:
- `account.astro`, `AstroChatInterface.astro` e `upgrade.astro` selecionam token não-guest quando cookie guest e token real coexistem.
- Token real é promovido de volta para cookie para manter SSR e JS sincronizados.
- `/api/usage` retorna `name` e `email` sanitizado; `/account` renderiza ambos.
Regra: Cookies continuam sendo fonte de verdade do SSR, mas um cookie guest não pode sobrepor sessão identificada local válida.

### PNPM/Railway — overrides no workspace (2026-05-11)

Sintoma: Railway falhava em `pnpm install --prod --frozen-lockfile` com `ERR_PNPM_LOCKFILE_CONFIG_MISMATCH`.
Causa: `pnpm@11` compara os `overrides` do lockfile com a config ativa; o stage runtime do Docker copiava `package.json` e `pnpm-lock.yaml`, mas não `pnpm-workspace.yaml`.
Correção:
- `overrides` de `fast-uri` e `yaml` ficam em `pnpm-workspace.yaml`.
- `pnpm-lock.yaml` resolve `yaml` em `2.8.3`.
- `Dockerfile` copia `pnpm-workspace.yaml` antes do install de produção.
Regra: Qualquer stage Docker que rode `pnpm install --frozen-lockfile` deve receber `pnpm-workspace.yaml`.

### Manifest Analyst desativado (2026-05-11)

Sintoma: O produto P.R.Ø existia como camada comercial, mas o runtime tinha risco de confundir persona avançada com manifesto separado.
Causa: `src/content/manifests/analyst.md` carregava contrato próprio e divergente do núcleo NØX.
Correção:
- `analyst.md` foi removido.
- `src/content/manifests/nox.md` permanece como manifesto ativo.
- `shared/runtime-prompt.md` continua sendo contrato runtime global.
Regra: Não assumir que P.R.Ø possui manifesto próprio; verificar `src/content/manifests/` antes de alterar personas.

────────────────────────────────────────

## ⧉ Frontend Security Boundary (2026-05-12)

O client NØX é **não-soberano por design**.

- Não contém segredos.
- Não contém chaves operacionais.
- Não contém system prompt crítico.
- Não decide billing, crédito, ledger ou autorização real.
- Renderiza estado recebido do backend.
- Pode bloquear visualmente interações, mas o backend é a fonte soberana.
- Build de produção usa `sourcemap: false`, `minify: "terser"` e `drop_console: true`.

Qualquer lógica crítica de acesso, crédito, cobrança, pagamento, token, quota ou permissão deve permanecer exclusivamente no backend/ledger.

────────────────────────────────────────

## ⨷ Regras Práticas

- **Zero Emojis**: Usar glifos geométricos (`⟠`, `⨷`, `◬`) conforme `MARKDOWN_STYLE_GUIDE.md`.
- **Soberania de Dados**: Senha é opcional para magic-link; DB deve aceitar NULL.
- **Faturamento Preciso**: SSE deve ser bufferizado para não perder JSON delta.
- **LEDGER-FIRST**: Ledger é a única fonte de verdade de saldo. Venice é executor, não autoridade financeira.
- **HTTP 402**: Saldo insuficiente de crédito comprado retorna 402, não 403.
- **balanceAfter**: `addEntry` sempre retorna saldo pós-debit. Não usar `req.ledgerBalance - tokens` como estimativa de saldo restante.
- **kind:unknown**: `resolveFlowPayEntitlement` retorna `kind: "unknown"` para metadata incompleto ou tokens inválidos. Webhook deve rejeitar entitlement desconhecido.
- **Auth token precedence**: cookie guest não deve vencer token identificado válido em `localStorage`.
- **pnpm overrides**: manter overrides em `pnpm-workspace.yaml`; Docker runtime precisa copiar esse arquivo antes de `pnpm install --frozen-lockfile`.
- **Deploy**: Realizar `git push origin main` + `railway up` para sincronizar produção.
