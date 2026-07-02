<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Agents

```text
========================================
          NØX · AI
========================================
Scope: neo-chat-uncensored
Status: active
========================================
```

## ⟠ Papel

Atuar como copiloto técnico do NØX.

Prioridade:

```text
segurança > estabilidade > legibilidade > performance > estética
```

────────────────────────────────────────

## ⧉ Realidade Atual

- Marca pública: `NØX`.
- Domínio app: `https://noxai.chat`.
- Domínio API: `https://api.noxai.chat`.
- FlowPay externo: `https://api.flowpay.cash`.
- E-mail: `NØX <send@noxai.chat>`.
- Frontend: Astro SSR, não estático puro.
- Backend: Express em `backend/src/server.js`.
- Planos: `shared/plans.json`.
- Runtime prompt: `shared/runtime-prompt.md`.
- Repo: `https://gitea.com/noxia/changeman.git`.
- Webhook: `POST /api/webhooks/flowpay` (Hardened).
- WAF / Firewall: Nginx isolado na pasta modular `/nginx` (`Dockerfile`, `nginx.conf`, `railway.json`). Roda na porta `3000` no serviço Railway `nginx-WAF` (Root Directory configurado como `/nginx`). Repassa tráfego seguro para `backend.railway.internal:3001`.
- Health (Firewall): `/nginx-health` (respondendo `200 OK` direto da memória do Nginx em 0.1ms; configurado como `healthcheckPath` no `nginx/railway.json` para que a saúde do firewall seja 100% independente da saúde do backend).
- PWA: `v4` (Cache resiliente). `CACHE_NAME` atual em `sw.js`: `nox-chat-v670`.
- FlowPay: PIX em produção validado (2026-05-06). `FLOWPAY_API_KEY` no Railway configurada e funcionando.
- SEO: `@astrojs/sitemap` ativo; `site: https://noxai.chat` no `astro.config.mjs`; gera `/sitemap-index.xml` (rotas privadas filtradas). `robots.txt` aponta o `Sitemap:`.
- Favicon: `/favicon.ico` (os antigos `favicon.png`/`favicon.svg` foram removidos; nada mais os referencia). Ícone usado no rodapé dos e-mails: `public/email/nox-icon.png` (servido em `https://noxai.chat/email/nox-icon.png`).
- Health: `/health` (Railway healthcheck, raso) + `/health/deep` (frontend SSR; valida a cadeia frontend → backend pingando `BACKEND_URL/health` na rede privada; 200 `ok`/`ok`, 503 em down/timeout/unconfigured).
- `BACKEND_URL`: URL interna do backend (rede privada Railway), lida **só server-side** pelo `/health/deep`. Nunca exposta ao browser. Distinta de `PUBLIC_API_URL` (URL pública do backend usada no browser) e de `FLOWPAY_API_URL`.
- E-mails: template base (`backend/src/services/email/template.js`) dark travado via meta `color-scheme: dark only`; cor de marca `#b9d631` (logo + CTA). Campanhas de marketing (`sendFeatureAnnouncement`) carregam `List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click` (RFC 8058) apontando para `/api/unsubscribe`; opt-out grava `users.marketing_opt_out`. Transacionais (welcome, magic link, reset, compra) são isentos.
- Conversão (saldo esgotado): além do `402`/`403` de quota, dispara modal no chat (`#quota-modal` → `/upgrade`) e e-mail `emailService.sendBalanceDepleted` (CTA p/ planos). Anti-spam por dedup Redis `email:depleted:<userId>` (TTL 7d), resetado quando `ledger.addEntry` recebe crédito (`amount > 0`). Apenas usuários registrados com e-mail.
- Navegação: links de plano/conta vivem no menu do header (sticky, sempre visível); `scene-footer` só com `Privacy · Terms`. Mensagens do assistant têm botão de copiar.

────────────────────────────────────────

## ⨷ Regras

- Não inventar rotas, arquivos, dependências ou contexto.
- Não tocar em `.env` real.
- Não expor secrets, tokens ou chaves.
- Usar `pnpm`, não `npm` ou `yarn`.
- Preservar arquitetura existente antes de sugerir rewrite.
- Aplicar a menor alteração funcional possível.
- Atualizar docs quando a mudança alterar contrato operacional.
- Tratar `FLOWPAY_API_URL` e `PUBLIC_API_URL` como coisas diferentes.
- **CORS**: **PROIBIDO** usar pacotes externos (`cors`). Usar injeção manual de headers no topo do `server.js` permitindo `includes("noxai.chat")`.
- **PWA**: Incrementar `CACHE_NAME` em `sw.js` após qualquer mudança em assets estáticos.
- **Webhooks (Topologia)**: A rota de entrada da FlowPay no Nexus **DEVE** apontar para o final exato `/api/webhooks/flowpay`. No `ecosystem.json` do NØX, o target path DEVE ser `/webhooks/flowpay` (sem duplicar).
- **Webhooks (Segurança)**: O valor do secret assinado pela FlowPay (`NEXUS_SECRET_NEW`) **DEVE** ser estritamente igual ao validado pelo Nexus e NØX (`FLOWPAY_WEBHOOK_SECRET`). Validação via HMAC-SHA256 (`X-Nexus-Signature` ou `X-FlowPay-Signature`).
- **BACKEND_URL**: usar apenas server-side (ex.: `/health/deep`); nunca referenciar em código de browser, que só alcança `PUBLIC_API_URL`.
- **WAF / Nginx**: O entrypoint do Alpine executa `envsubst` com saída direta para `/etc/nginx/nginx.conf` (`NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx`) para evitar blocos `http {}` aninhados. O contêiner expõe e escuta na porta `3000`.
- **Railway JSON Schemas**: Arquivos `.json` de configuração no Railway (`railway.json` e `nginx/railway.json`) têm validação estrita (`additionalProperties: false`). **PROIBIDO** adicionar chaves extras como `$comment` ou `_comment`.
- **E-mail marketing**: campanhas (`sendFeatureAnnouncement`) devem levar headers `List-Unsubscribe` + one-click e filtrar `marketing_opt_out = FALSE` na query. Transacionais não levam unsubscribe. Migração da coluna via `backend/schema.sql` (idempotente) antes do 1º disparo.
- **Postgres HA & Variáveis no Railway**: O código em `backend/src` exige estritamente a variável `POSTGRES_URL`. No painel do Railway, mapear sempre `POSTGRES_URL=${{Postgres.DATABASE_URL}}` no serviço `backend`.
- **Cache DNS do Nginx WAF (Regra de Ouro)**: Quando o serviço `backend` sofrer redeploy ou restart, ele receberá um novo IP na rede privada interna (`.railway.internal`). **É OBRIGATÓRIO dar um Restart no serviço `nginx-WAF`** no Railway logo após qualquer deploy do backend para renovar o cache DNS do upstream e evitar erros `504 Gateway Timeout` ou `110: Operation timed out`.
- **Testes CLI & Anti-Bot**: O middleware `backend/src/middleware/security.js` rejeita ferramentas CLI sem User-Agent válido (`403 Forbidden` ou `444`). Em testes automatizados ou comandos `curl`, sempre passar `-A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NOX-TestClient/4.2"`.
- **Helmet CSP**: O cabeçalho `Content-Security-Policy` é emitido exclusivamente pela API (`https://api.noxai.chat`) via Helmet, não sendo exposto no frontend SSR (`https://noxai.chat`).

────────────────────────────────────────

## ⧖ Validação

Para mudanças de frontend:

```bash
fnm exec --using v25.9.0 pnpm check
fnm exec --using v25.9.0 pnpm build
```

Para mudanças de backend:

```bash
node --check backend/src/server.js
fnm exec --using v25.9.0 pnpm --filter chat-api-backend test
```

Para migração de schema (Postgres de prod via proxy; `psql` não está instalado — usar o cliente `pg` do backend):

```bash
cd backend
DB=$(grep -E '^POSTGRES_URL=' ../.env | head -1 | cut -d= -f2- | tr -d '"')
POSTGRES_URL="$DB" node --input-type=module -e "import pg from 'pg';import{readFileSync}from'node:fs';const p=new pg.Pool({connectionString:process.env.POSTGRES_URL,ssl:false});await p.query(readFileSync('./schema.sql','utf8'));await p.end()"
```

Para documentação:

```bash
rg -n "<termo-obsoleto>" README.md SETUP.md USER_JOURNEY.md NEXTSTEPS.md docs .github/prompts
git diff --check
```

────────────────────────────────────────

## ⍟ Saída Esperada

Toda entrega deve informar:

1. causa provável
2. arquivos afetados
3. patch aplicado
4. comandos executados
5. risco residual

# AGENTS.md · CODE CHANGE LOCK

## Regra principal

Nenhum agente de IA pode alterar código sem autorização explícita do operador.

Autorização válida precisa conter exatamente uma destas frases:

- `AUTORIZO ALTERAR CÓDIGO`
- `AUTORIZO APLICAR PATCH`
- `AUTORIZO CRIAR PR`

Sem uma dessas frases, o agente deve apenas:
- analisar
- sugerir
- explicar
- gerar diff proposto
- apontar riscos

## Proibido sem autorização

- editar arquivos
- aplicar patch
- criar commits
- instalar dependências
- alterar configs de deploy
- rodar migrations
- modificar variáveis de ambiente
- mexer em autenticação, ledger, billing, CORS ou pagamentos

## Fluxo obrigatório

1. Diagnosticar.
2. Mostrar arquivos afetados.
3. Mostrar diff proposto.
4. Esperar autorização explícita.
5. Só então executar.

## Se houver urgência

Mesmo em urgência, não alterar código sem autorização explícita.
