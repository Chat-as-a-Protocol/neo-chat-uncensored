# NØX Marketing Email Guide

```text
========================================
        NØX · MARKETING EMAILS
========================================
Status: ACTIVE
Owner: Marketing + Tech Ops
Runtime: Backend NØX -> Resend API
========================================
```

## Objetivo

Este documento orienta a equipe de marketing sobre os e-mails do NØX:

- quais mensagens existem hoje
- quais conteúdos podem ser alterados com segurança
- como solicitar ou testar uma campanha
- quais cuidados evitam disparos acidentais

Marketing não precisa acessar banco, Railway, `.env` ou secrets.
O envio real é operado pelo backend NØX via Resend.

## Mapa Atual

| Tipo | Finalidade | Origem | Pode editar copy? |
| --- | --- | --- | --- |
| Boas-vindas | Cadastro confirmado | Backend | Sim, com revisão técnica |
| Magic link | Login por e-mail | Backend | Parcialmente |
| Reset de senha | Recuperação de senha | Backend | Parcialmente |
| Compra confirmada | Pagamento aprovado | Backend + FlowPay | Parcialmente |
| Upgrade de nível | Tier atualizado | Backend + ledger | Parcialmente |
| Feature announcement | Campanha manual | Script de campanha | Sim |
| Telegram announcement | Convite comunidade | Script de campanha | Sim |

## Campanhas Manuais

Os scripts operacionais ficam em:

```text
backend/src/scripts/send-campaign.js
backend/src/scripts/send-campaign-telegram.js
```

Eles usam o serviço central:

```text
backend/src/services/email/
```

O import público continua:

```text
backend/src/services/email.js
```

## O Que Marketing Pode Alterar

Em campanhas manuais, marketing pode propor:

- `CAMPAIGN_TITLE`
- `CAMPAIGN_CONTENT`
- `ACTION_LABEL`
- `ACTION_URL`
- público-alvo desejado
- data/hora desejada de envio

O conteúdo aceita texto simples com markdown mínimo:

```text
**texto em negrito**
quebra de linha normal
```

Não usar HTML cru em campanha.
O backend escapa HTML por segurança.

## Exemplo de Brief

```text
Campanha: convite Telegram
Assunto desejado: COMUNIDADE NØX NO TELEGRAM
CTA: ENTRAR NO CANAL DO TELEGRAM
URL: https://t.me/noxaioficial
Público: usuários cadastrados com e-mail confirmado
Janela: enviar primeiro teste hoje; produção após aprovação visual
Observação: tom direto, dark, sem parecer newsletter genérica
```

## Segurança de Disparo

Os scripts devem permanecer em modo teste por padrão.

Modo teste envia apenas para:

```text
NOX_TEST_EMAIL
```

Se `NOX_TEST_EMAIL` não existir, o fallback operacional é:

```text
nox@noxai.chat
```

Produção só deve ser ativada por Tech Ops,
descomentando a query real de usuários no script.

## Unsubscribe (List-Unsubscribe / RFC 8058)

Toda campanha de marketing (`sendFeatureAnnouncement`) agora é **self-managed e conforme**:

- Cada e-mail leva os headers `List-Unsubscribe` (URL + mailto) e
  `List-Unsubscribe-Post: List-Unsubscribe=One-Click` — o "Cancelar inscrição"
  nativo do Gmail/Yahoo funciona em um clique.
- O link aponta para `GET/POST https://api.noxai.chat/api/unsubscribe?u=<id>&t=<token>`
  (token HMAC por usuário, sem expiração). GET mostra página de confirmação;
  POST é o one-click silencioso.
- O opt-out grava `users.marketing_opt_out = TRUE` no Postgres.
- O rodapé do e-mail usa o mesmo link (não mais o `mailto` genérico).

**Pré-requisito antes da primeira campanha em produção:** aplicar a migração do
schema (adiciona `marketing_opt_out`):

```bash
psql "$DATABASE_URL" -f backend/schema.sql   # idempotente (ALTER ... IF NOT EXISTS)
```

A query de produção dos scripts **deve** filtrar `AND marketing_opt_out = FALSE`
(já incluída no `GET_USERS_QUERY` comentado). E-mails transacionais
(boas-vindas, magic link, reset, compra) são isentos e não levam unsubscribe.

## Checklist Antes de Enviar

1. Copy revisada por marketing.
2. CTA e URL conferidos.
3. Assunto sem erro de digitação.
4. Teste enviado para `nox@noxai.chat`.
5. Visual aprovado no cliente de e-mail.
6. Público-alvo confirmado.
7. Janela de cancelamento definida se usar agendamento Resend.
8. Migração do schema aplicada (`marketing_opt_out` existe no Postgres).
9. Produção liberada explicitamente.

## Checklist Pós-Envio

1. Confirmar contagem de sucesso/falha no terminal.
2. Conferir atividade no Resend.
3. Monitorar respostas em `nox@noxai.chat`.
4. Registrar aprendizados de copy e CTA.

## Limites Atuais

O envio ainda é síncrono e direto pelo backend.

Ainda não há:

- fila dedicada
- retry automático
- idempotência por campanha
- painel visual para marketing
- segmentação self-service

Esses pontos pertencem à evolução futura para uma camada de eventos.

## Regra de Ouro

Marketing decide mensagem, público e timing.

Backend decide segurança, autenticação, rate limit, opt-out,
template seguro e execução final.
