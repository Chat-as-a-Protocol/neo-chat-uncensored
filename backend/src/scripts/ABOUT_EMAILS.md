<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->

# Documentação de Scripts de Campanha de E-mail

```text
========================================
         NØX · EMAIL CAMPAIGNS
========================================
Status: ACTIVE
Version: v1.0.0
========================================
```

## ⟠ Objetivo

Descrever o funcionamento, a segurança e a execução dos scripts de disparo
manual de e-mails em massa localizados no diretório `backend/src/scripts/`.

Para briefing, aprovação de copy e operação pela equipe de marketing,
use também:

```text
docs/MARKETING_EMAILS.md
```

────────────────────────────────────────

## ⨷ Scripts Disponíveis

Atualmente, existem dois scripts operacionais:

1. **`send-campaign.js`**
   - Foco: Anúncio de novas features (Uncensored, Mobile fix, etc.).
   - Assunto: "FEATURE +++++++++--------"

2. **`send-campaign-telegram.js`**
   - Foco: Convite e engajamento para a comunidade oficial do Telegram.
   - Assunto: "COMUNIDADE NØX NO TELEGRAM".

Os dois scripts usam `emailService.sendFeatureAnnouncement`.
O conteúdo da campanha deve ser texto simples com markdown mínimo,
não HTML cru.

────────────────────────────────────────

## ⍟ Segurança e Trava de Disparo

Para evitar disparos acidentais para toda a base de usuários, ambos os
scripts vêm configurados com uma trava de segurança ativada por padrão.

### Comportamento Padrão (Modo Seguro)

O array de usuários vem mockado apontando apenas para o e-mail do
administrador ou para `NOX_TEST_EMAIL`:

```javascript
const users = [
  {
    id: "test-id",
    name: "test-user",
    email: process.env.NOX_TEST_EMAIL || "nox@noxai.chat",
    tier: "admin",
  },
];
```

### Como Ativar o Envio em Massa

Para enviar para todos os usuários cadastrados no banco de dados:
1. Abra o script desejado.
2. Comente a linha do mock acima.
3. Descomente a linha que executa a query no banco:

```javascript
const { rows: users } = await query(GET_USERS_QUERY);
```

────────────────────────────────────────

## ◬ Agendamento e Cancelamento (Safety Window)

Os scripts suportam a funcionalidade de agendamento do Resend. Isso permite
enviar o e-mail com um delay, dando tempo de cancelar no dashboard caso
haja algum erro.

Para ativar, descomente a linha no loop de envio:

```javascript
scheduledAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 min
```

────────────────────────────────────────

## ⦿ Execução

Para rodar os scripts, execute a partir da raiz do projeto:

```bash
node backend/src/scripts/send-campaign.js
# ou
node backend/src/scripts/send-campaign-telegram.js
```

Assegure-se de que a variável `RESEND_API_KEY` está configurada no seu `.env`.

────────────────────────────────────────

## ⍟ Fechamento

```text
▓▓▓ NØX AI
────────────────────────────────────────
"Code is law. Expand until
chaos becomes protocol."

Security by design.
────────────────────────────────────────
```
