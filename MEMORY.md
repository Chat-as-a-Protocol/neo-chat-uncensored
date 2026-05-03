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

────────────────────────────────────────

## ⨷ Regras Práticas

- **Zero Emojis**: Usar glifos geométricos (`⟠`, `⨷`, `◬`) conforme `MARKDOWN_STYLE_GUIDE.md`.
- **Soberania de Dados**: Senha é opcional para magic-link; DB deve aceitar NULL.
- **Faturamento Preciso**: SSE deve ser bufferizado para não perder JSON delta.
- **Deploy**: Realizar `railway up` para sincronizar o estado local com a produção.
