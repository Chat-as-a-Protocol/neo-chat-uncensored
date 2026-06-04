<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# User Journey

```text
========================================
          NØX · USER JOURNEY
========================================
Status: release candidate
Version: v4.2.0
========================================
```

## ⧉ Mapa de Rotas

Contrato canônico:
`docs/ROUTE_CONTRACT.md`.

```text
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ROTA               ┃ VISIBILIDADE ┃ PROPÓSITO
┣━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ /                  ┃ Autenticada  ┃ Terminal principal NØX
┃ /login             ┃ Pública      ┃ Login e magic link
┃ /signup            ┃ Pública      ┃ Criação de conta identificada
┃ /auth/magic-link   ┃ Pública      ┃ Consumo do token de e-mail
┃ /pricing           ┃ Pública      ┃ Vitrine de preços
┃ /upgrade           ┃ Restrita     ┃ Pacotes pagos e P.R.O
┃ /account           ┃ Restrita     ┃ Conta, uso, nome e e-mail
┃ /success           ┃ Restrita     ┃ Retorno pós-FlowPay
┃ /privacy           ┃ Pública      ┃ Obrigação legal
┃ /terms             ┃ Pública      ┃ Obrigação legal
┗━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## ⟠ Guest Mode

Guest Mode continua existindo como degustação controlada.

Contrato:

- até 3 mensagens
- limite diário de 500 tokens
- resposta compacta
- sem exposição como plano gratuito em `/upgrade`

Uso recomendado:
divulgação seletiva para poucas pessoas,
sem transformar o free em oferta pública principal.

────────────────────────────────────────

## ⨷ Conversão

Ao atingir a barreira de guest,
o usuário deve virar usuário identificado.

Fluxos:

- login com e-mail e senha
- cadastro em `/signup`
- magic link via Resend
- token persistido como `nox_token`
- cookie guest antigo não deve vencer token identificado válido

Depois disso,
o usuário pode comprar pacote de tokens ou produto P.R.O.

Base operacional:
Postgres é a fonte canônica para usuários identificados.
Redis permanece para quota, cache, ledger fallback e compatibilidade.
O runtime prompt público é responsável, defensivo e auditável.

────────────────────────────────────────

## ⧖ Upgrade

`/pricing` é público e mostra valores antes do cadastro.

`/upgrade` não exibe o conteúdo do Guest Mode.
`/upgrade` é a superfície de ativação para usuário identificado.

Fonte de verdade dos planos:

```text
shared/plans.json
```

Pacotes:

- `† NEØ †`: 1.000 NØX, tier `paid_basic`
- `× VOID.ᴇxᴇ ×`: 5.000 NØX, tier `paid_basic`
- `EL CHAPO 亗`: 10.000 NØX, tier `paid_pro`

Produto:

- `P.R.O Analyst`: acesso ao NØX Analyst e tier P.R.O

────────────────────────────────────────

## ⧗ Pagamento

O frontend chama a API NØX:

```text
https://api.noxai.chat/api/tokens/purchase
https://api.noxai.chat/api/products/purchase
```

O backend chama FlowPay:

```text
https://api.flowpay.cash/api/create-charge
```

Depois do pagamento,
FlowPay emite evento para Nexus,
e o backend processa o webhook assinado.

Resultado esperado:

- pagamento persistido em `payments`
- crédito registrado no ledger
- tier atualizado quando aplicável
- e-mail de confirmação enviado via Resend API

Resend é provedor externo.

Ele não exige serviço Railway próprio chamado `Resend Mail`
para que o fluxo de usuário funcione.

────────────────────────────────────────

## ◬ Chat Runtime

Hoje,
o chat é entregue pelo backend NØX.

Fluxo atual:

```text
Frontend NØX
  └─ POST /api/chat
     └─ Backend NØX
        ├─ auth
        ├─ quota
        ├─ Venice
        └─ ledger debit
```

Fluxo futuro provável:

```text
Frontend NØX
  └─ Backend NØX
     ├─ auth
     ├─ entitlement
     └─ Chat Runtime Node
```

Essa saída deve preservar ledger e billing no backend soberano.

O novo nó de chat não deve receber autoridade financeira
nem depender de arquivos compartilhados do NØX.

────────────────────────────────────────

## ⍟ Resiliência

```text
▓▓▓ OPERATIONAL CONSTRAINTS
────────────────────────────────────────
└─ Quota calculada via ledger
└─ Idempotência por referência de pagamento
└─ Redis para quota, cache, ledger fallback e compatibilidade
└─ Postgres para usuários identificados, pagamentos e magic links
└─ FlowPay service rejeita HTML e self-call
└─ Resend API isolada no backend
└─ Modelo Venice definido por `VENICE_MODEL` no backend
```

────────────────────────────────────────

## ◬ Próximos Passos

1. Conferir variáveis backend no Railway antes do deploy.
2. Fazer smoke test pós-deploy: signup, login, guest chat, `/api/usage`, magic link e `/account`.
3. Validar compra real ponta a ponta em produção.
4. Confirmar webhook FlowPay via Nexus.
5. Refinar UX do statement de ledger em `/account`.

```text
▓▓▓ NØX
────────────────────────────────────────
Guest controlado.
Upgrade pago.
Ledger auditável.
────────────────────────────────────────
```
