# NØX.AI - User Journey (Current State)

**Version:** 3.1.0 (Hardened)
**Status:** Audit Only - No Changes Applied

## 🗺️ Mapa de Rotas (Public vs Private)

| Rota | Visibilidade | Propósito |
| :--- | :--- | :--- |
| `/` | **Restrita** | Interface de Chat AI (Core Product). |
| `/login` | Pública | Acesso de usuários cadastrados. |
| `/signup` | Pública | Registro de novos usuários. |
| `/upgrade` | **Restrita** | Venda de pacotes de tokens e assinatura Pro. |
| `/success` | **Restrita** | Landing page pós-pagamento FlowPay. |
| `/health` | Pública | API de monitoramento de infraestrutura. |
| `/privacy-policy` | Pública | Documentação jurídica. |
| `/terms-and-conditions` | Pública | Regras de serviço. |

---

## 🛤️ Fluxo da Jornada "Hoje" (As-Is)

### 1. Entrada e Gate de Segurança

O ponto de entrada é a raiz `/`. O sistema executa uma verificação SSR (Server-Side Rendering):

- **Condição:** Se `ENABLE_AUTH_PAGES=true` e o cookie `neo_token` estiver ausente.
- **Ação:** Redirecionamento 302 para `/login`.
- **Observação:** O usuário que deseja apenas "espiar" o produto é forçado a logar antes de ver qualquer interface.

### 2. Autenticação e Onboarding

- O usuário alterna entre `/login` e `/signup`.
- Após o sucesso na autenticação, o backend (Express) emite um token JWT que o frontend armazena no Cookie e no LocalStorage.
- O usuário é então redirecionado de volta para `/`.

### 3. Uso do Produto (Chat Loop)

- No `/`, o usuário consome tokens diários.
- A cada mensagem, o backend valida o saldo no Redis/PostgreSQL.
- Se o saldo acaba, o usuário recebe um alerta visual e é incentivado a clicar em "Upgrade".

### 4. Ciclo de Monetização

- O usuário clica em link para `/upgrade`.
- Escolhe um pacote e é enviado para o checkout externo da FlowPay.
- Após o pagamento, retorna para `/success` e depois volta manualmente para `/`.

---

## 🚩 Pontos Identificados (O "Lugar Errado")

De acordo com a análise preliminar, estes são os pontos onde a jornada parece "quebrada" ou sub-otimizada hoje:

1. **Gate Agressivo**: O redirecionamento imediato para `/login` impede o "Guest Mode", o que pode aumentar a taxa de rejeição de novos usuários.
2. **Navegação de Rodapé**: Links como "Login" e "Sign Up" aparecem no rodapé da página de Chat (`/`), o que é redundante se o usuário já está logado para ver aquela página.
3. **Pós-Pagamento**: O redirecionamento após `/success` é manual, o que quebra a fluidez do "reabastecimento" de tokens.
4. **Falta de Landing Page**: Não existe uma `/landing` ou uma home pública que apresente o valor do produto antes de exigir o cadastro.

---

## 🧪 Próximos Passos (Estratégia)

Este documento servirá de base para o estudo da **Nova Estratégia de Soberania**, onde transformaremos esse fluxo funcional em um funil de conversão de alta performance.
