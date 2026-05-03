<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Memory

```text
========================================
          NØX · TECHNICAL MEMORY
========================================
Status: active
Updated: 2026-05-03
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
- Backend: Implementado **CORS Manual (Brute Force)** via middleware customizado no topo do Express. O pacote `cors` foi removido por ser inconsistente em preflights complexos com subdomínios. Agora os cabeçalhos são injetados manualmente para qualquer origem contendo `noxai.chat`.
- Frontend: Resolução de `apiUrl` simplificada e adição de **Logs de Depuração** no `catch` da cota e da sessão para visibilidade total de falhas de rede.
- PWA: Service Worker v4 resiliente (loop `try/catch` individual para assets) e correção de caminhos de ícones.

### Alinhamento com Protocolo Nexus

Sintoma: Webhooks fora do padrão de segurança do ecossistema.
Causa: Necessidade de padronização com o Ingress do Nexus.
Correção: Endpoint de webhook movido para `/api/webhooks/flowpay`. Adicionado suporte ao header legado `X-FlowPay-Signature` junto ao `X-Nexus-Signature`. Implementada idempotência antecipada no Redis (check antes do processamento).

────────────────────────────────────────

## ⨷ Regras Práticas

- **Zero Emojis**: Usar glifos geométricos (`⟠`, `⨷`, `◬`) conforme `MARKDOWN_STYLE_GUIDE.md`.
- **Soberania de Dados**: Senha é opcional para magic-link; DB deve aceitar NULL.
- **Faturamento Preciso**: SSE deve ser bufferizado para não perder JSON delta.
- **Deploy**: Realizar `railway up` para sincronizar o estado local com a produção.
