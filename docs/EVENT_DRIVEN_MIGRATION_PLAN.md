<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# Plano de Migração: Event-Driven Architecture (NØX ⟷ Growth System)

```text
========================================
       NØX · GROWTH SYSTEM MIGRATION
========================================
Status: planned
Target: neo-growth-system
========================================
```

## ⟠ Objetivo

Migrar o sistema de mensageria síncrona atual (envio direto via Resend pelo `email.js`) para uma Arquitetura Orientada a Eventos. O NØX passará a atuar como um "Ingestor de Eventos", delegando a responsabilidade de entrega, retry, templates e CRM para o ecossistema `neo-growth-system`, que já encontra-se em operação no Railway.

────────────────────────────────────────

## ⨷ Benefícios Arquiteturais

1. **Zero Latency em Mensageria**: O usuário não aguarda a resposta da API do Resend; o NØX apenas despacha o evento assíncrono.
2. **Resiliência por Design (Queue Workers)**: Tolerância a quedas do provedor de e-mail através das políticas de retry automático do BullMQ/Redis do Growth System.
3. **Isolamento de Credenciais**: O `neo-chat-uncensored` perde a necessidade de conhecer a `RESEND_API_KEY`. O secret de entrega é isolado no `neo-provider-resend`.
4. **Shadow CRM & Nudges**: Habilitação automática de "Drip Campaigns" (ex: nudges em T+24h, T+72h) orquestradas pelo `neo-crm-core`.

────────────────────────────────────────

## ◬ Padronização de Banco de Dados (PostgreSQL Central)

O projeto `neo-growth-system` abandonará o uso do Turso (libSQL) para aderir ao padrão **teaBASE** (PostgreSQL) estabelecido no monorepo `Chat-as-a-Protocol`.

Isso altera e otimiza a topologia de integração:
- **Fonte Única de Verdade**: O Growth System terá acesso direto ao mesmo banco PostgreSQL central (via schema/permissões apropriadas) onde a tabela `users` do NØX reside.
- **Payloads Enxutos (Sem PII duplicada)**: Como o Growth System lê do PostgreSQL, o NØX não precisa injetar o `email` ou o `name` no payload do evento HTTP. O NØX envia apenas o `user_id` e a intenção, e o orquestrador de CRM faz a query no Postgres para buscar os dados de contato em tempo real antes do disparo.
- **Tabelas do CRM**: As tabelas analíticas de growth (como `journey_state`, `suppression_list` e `frequency_log`) serão criadas no próprio PostgreSQL central (ou em um schema isolado `crm_schema`), centralizando backups e integrações.

────────────────────────────────────────

## ⍟ Requisitos de Identidade Visual e Anti-Spam

Qualquer serviço de mensageria que assuma o envio pelo NØX (como o `neo-provider-resend` no Growth System) deve obrigatoriamente manter o padrão de design e conformidade estabelecido no patch de 2026-05-12:
- **Estética Dark Mode**: O fundo deve ser `#050505` e o container `#0a0a0c`, com texto em tons de cinza claro (`#e0e0e0`) e branco.
- **Logotipo Topográfico**: Manter o bloco `NØX` centralizado com bordas discretas e sem depender de imagens externas (evitando bloqueios de provedores).
- **Rodapé de Descadastramento**: Deve possuir obrigatoriamente o opt-out acessível via `mailto:send@noxai.chat?subject=Unsubscribe` e link para as configurações de conta do usuário no NØX.

────────────────────────────────────────

## ⧉ Etapas de Execução

### Fase 1: Setup no `neo-growth-system`

1. **Registrar Domínio**:
   - Adicionar o `domain_id: nox-ai` na lista de domínios permitidos no CRM Core.
   - Configurar o remetente canônico como `NØX <send@noxai.chat>`.
2. **Templates de E-mail**:
   - Desenvolver o template de *Magic Link* e *Privilégios Elevados (Recibo P.R.Ø)* diretamente dentro do `neo-provider-resend` mapeados para o evento do `nox-ai`.

### Fase 2: Refatoração no `neo-chat-uncensored`

1. **Nova Abstração de Eventos**:
   - Criar `backend/src/services/events.js` para substituir as lógicas atuais do `email.js`.
   - Implementar método disparador `emitGrowthEvent(eventType, payload)`.
2. **Substituição de Lógicas**:
   - No Controller de Auth: Trocar a chamada síncrona do Resend pelo envio do evento `MAGIC_LINK_REQUESTED`.
   - No Controller de Pagamentos (Webhook FlowPay): Disparar o evento `PURCHASE_COMPLETED` em caso de sucesso para interromper as réguas de Nudge e enviar o recibo P.R.Ø.
3. **Payload Canônico**:
   Garantir que a comunicação siga o contrato enxuto (sem trafegar e-mails diretamente):

   ```json
   {
     "event_id": "uuid-v4",
     "event_type": "MAGIC_LINK_REQUESTED",
     "domain_id": "nox-ai",
     "user_id": "user-uuid",
     "timestamp": "ISO-8601",
     "payload": {
       "magic_link_url": "https://noxai.chat/auth/..."
     }
   }
   ```

4. **Hardening de Assinatura**:
   - Garantir que todas as requisições que saem do NØX para o Growth System Ingestor utilizem o header `X-Nexus-Signature` com o `NEXUS_SECRET` validado.

### Fase 3: Limpeza e Deploy

1. Remover todo o código HTML hardcoded do backend do NØX.
2. Desinstalar o SDK do Resend do `package.json` do NØX (se existir).
3. Remover as variáveis de ambiente referentes a e-mails (ex: `RESEND_API_KEY`) das configurações do projeto NØX no Railway, concentrando as variáveis apenas nos projetos do Growth System.

────────────────────────────────────────

```text
▓▓▓ NØX AI
────────────────────────────────────────
Security by design.
────────────────────────────────────────
```
