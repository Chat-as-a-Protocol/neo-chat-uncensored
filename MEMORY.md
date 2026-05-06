<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Memory

```text
========================================
          NØX · TECHNICAL MEMORY
========================================
Status: active
Updated: 2026-05-06
========================================
```

## ⟠ Decisões

- Marca: `NØX` (Soberania Digital e Autonomia Implacável).
- Repositório Canônico: Gitea (`gitea.com/noxia/changeman`).
- Domínios: `noxai.chat` (App), `api.noxai.chat` (API).
- Persona P.R.Ø: Protocolo de Risco Otimizado (Foco em ROI e Exploração de Sistemas).
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

────────────────────────────────────────

## ⨷ Regras Práticas

- **Zero Emojis**: Usar glifos geométricos (`⟠`, `⨷`, `◬`) conforme `MARKDOWN_STYLE_GUIDE.md`.
- **Soberania de Dados**: Senha é opcional para magic-link; DB deve aceitar NULL.
- **Faturamento Preciso**: SSE deve ser bufferizado para não perder JSON delta.
- **LEDGER-FIRST**: Ledger é a única fonte de verdade de saldo. Venice é executor, não autoridade financeira.
- **HTTP 402**: Saldo insuficiente de crédito comprado retorna 402, não 403.
- **Deploy**: Realizar `git push origin main` + `railway up` para sincronizar produção.
