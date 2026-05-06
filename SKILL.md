# SKILL · LEDGER-FIRST CHAT SYSTEM

## PRINCIPLE

Pagamento ≠ Consumo  
Ledger = source of truth  
Venice = executor (não autoridade)

---

## CORE FLOW

FlowPay → ledger.credit → user.balance  
User → usage → ledger.reserve → Venice → ledger.settle/revert

---

## LEDGER MODEL

entry = {
  id,
  userId,
  amount (+/-),
  type: PURCHASE | CONSUMPTION | REFUND,
  reference,
  balanceAfter,
  createdAt
}

balance = Σ(amount)

---

## USAGE FLOW (CRÍTICO)

1. estimar custo
2. verificar saldo
3. reservar (opcional v2)
4. chamar Venice
5. confirmar ou reverter

---

## RULES

- nunca usar quota como verdade
- nunca depender da Venice para saldo
- nunca debitar sem controle interno
- nunca acoplar pagamento com consumo direto

---

## USER MODEL

Usuário compra:
→ créditos internos (tokens de uso)

Usuário vê:
→ saldo

Sistema controla:
→ valor real

---

## PAYMENT FLOW

FlowPay webhook:
→ cria entry PURCHASE
→ incrementa saldo

---

## ECONOMICS

user tokens ≠ venice tokens  
user tokens = direito de uso  

você controla:
→ preço
→ margem
→ consumo

---

## FAILURE CONTROL

Se Venice falhar:
→ não debitar
→ ou reverter

Se webhook duplicado:
→ idempotência por reference

---

## FUTURE EXTENSIONS

- provisioned vs settled
- withdrawal
- token NEOFLW
- auto-recharge Venice (infra only)

---

## FINAL TRUTH

ledger controla valor  
venice executa  
usuário consome
