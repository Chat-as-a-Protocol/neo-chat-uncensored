<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

```text
========================================
   NEO-CHAT-UNCENSORED · KNOWLEDGE BASE
========================================
Sovereign Docs · Chat-as-a-Protocol
========================================
```

> Base de conhecimento soberana do projeto.
> Consulte antes de modificar arquitetura, fluxos ou integrações.

────────────────────────────────────────

## ⟠ Índice

| Doc | Conteúdo |
|-----|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Topologia, fluxo de dados, decisões técnicas |
| [API.md](./API.md) | Contratos de todos os endpoints do backend |
| [PAYMENTS.md](./PAYMENTS.md) | Integração FlowPay + Nexus (padrão canônico) |
| [DEPLOY.md](./DEPLOY.md) | Deploy Railway — variáveis, checklist, comandos |

────────────────────────────────────────

## ⧇ Fontes de Verdade

```text
contexto do projeto    → neo-ai/CONTEXT.md
próximos passos        → NEXTSTEPS.md
topologia do ecossistema → NEO-PROTOCOL/neobot-orchestrator/config/ecosystem.json
padrão de pagamento    → docs/PAYMENTS.md
```

────────────────────────────────────────

## ⍟ Regras Para Agentes e Colaboradores

- Leia `neo-ai/CONTEXT.md` antes de qualquer modificação de arquitetura.
- Leia `NEXTSTEPS.md` para entender o estado atual e o que está em andamento.
- Nunca criar integrações de pagamento fora do padrão FlowPay → Nexus.
- Nunca usar `package-lock.json` — workspace gerenciado por pnpm.
- Nunca hardcodar secrets ou chaves de API.

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ · Core Architect · NΞØ Protocol
"Code is law. Expand until chaos becomes protocol."
```
