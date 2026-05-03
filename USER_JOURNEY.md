<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# User Journey

```text
========================================
          NØX · USER JOURNEY
========================================
Status: release candidate
Version: v4.1.0
========================================
```

## ⧉ Mapa de Rotas

```text
┏━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ROTA               ┃ VISIBILIDADE ┃ PROPÓSITO
┣━━━━━━━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━╋━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ /                  ┃ Autenticada  ┃ Terminal principal NØX
┃ /login             ┃ Pública      ┃ Login e magic link
┃ /signup            ┃ Pública      ┃ Criação de conta identificada
┃ /auth/magic-link   ┃ Pública      ┃ Consumo do token de e-mail
┃ /precos            ┃ Pública      ┃ Vitrine de preços
┃ /upgrade           ┃ Restrita     ┃ Pacotes pagos e P.R.O
┃ /conta             ┃ Restrita     ┃ Conta, uso e saldo
┃ /success           ┃ Restrita     ┃ Retorno pós-FlowPay
┃ /privacy-policy    ┃ Pública      ┃ Obrigação legal
┃ /terms-and-conditions ┃ Pública   ┃ Obrigação legal
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

Depois disso,
o usuário pode comprar pacote de tokens ou produto P.R.O.

Base operacional:
Postgres é a fonte canônica para usuários identificados.
Redis permanece para quota, cache, ledger fallback e compatibilidade.
O runtime prompt público é responsável, defensivo e auditável.

────────────────────────────────────────

## ⧖ Upgrade

`/precos` é público e mostra valores antes do cadastro.

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
- e-mail de confirmação enviado via Resend

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
└─ Resend isolado no backend
└─ Modelo Venice definido por `VENICE_MODEL` no backend
```

────────────────────────────────────────

## ◬ Próximos Passos

1. Conferir variáveis backend no Railway antes do deploy.
2. Fazer smoke test pós-deploy: signup, login, guest chat, `/api/usage`, magic link e `/conta`.
3. Validar compra real ponta a ponta em produção.
4. Confirmar webhook FlowPay via Nexus.
5. Refinar UX do statement de ledger em `/conta`.

```text
▓▓▓ NØX
────────────────────────────────────────
Guest controlado.
Upgrade pago.
Ledger auditável.
────────────────────────────────────────
```
