<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# User Journey

```text
========================================
         NØX.AI · USER JOURNEY
========================================
Status: OPERATIONAL
Version: v4.0.0
========================================
```

> **Version:** v4.0.0 (Guest-First)  
> **Status:** active  
> **Context:** Sovereign Funnel Logic

## ⧉ Mapa de Rotas

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ ROTA          VISIBILIDADE    PROPÓSITO
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
┃ /             Pública (Lim 3) Interface de Chat AI - Guest Mode
┃ /login        Pública         Acesso para usuários identificados
┃ /signup       Pública         Registro para quebra de barreira
┃ /upgrade      Restrita        Vitrine († NEØ †, VOID.ᴇxᴇ, EL CHAPO 亗)
┃ /success      Restrita        Confirmação de recarga FlowPay
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

────────────────────────────────────────

## ⟠ Fluxo da Jornada (Sovereign Funnel)

### 1. O Despertar (Guest Mode)

O usuário acessa a raiz `/` e obtém acesso imediato.
Não há exigência de credenciais para a interação inicial.

- **Experiência Gênio**: Permissão de até 3 mensagens.
- **Validação**: Controle via Redis e DeviceId no backend.
- **Interface**: Identidade pura NØX, sem seletores complexos.

### 2. O Gate de Conversão (Marketing Barrier)

Interrupção obrigatória após o esgotamento do 3º desejo.
A interface bloqueia o input e exige decisão soberana.

- **Ações**: Cadastro via `/signup` ou Login via `/login`.
- **Hardened**: Bloqueio enforçado na camada de API.
- **UX**: Botões diretos para conversão sem timers agressivos.

### 3. Escalada de Poder (Upgrade)

Usuários identificados podem expandir limites em `/upgrade`.
Aumento de cota e acesso a privilégios de rede.

- **† NEØ † / × VOID.ᴇxᴇ ×**: Recarga de tokens e fim da trava de mensagens.
- **EL CHAPO 亗**: 10.000 tokens e acesso total sobre a inteligência.
- **Negociação**: Suporte direto com o Arquiteto para o tier EL CHAPO.

────────────────────────────────────────

## ⍟ Segurança e Resiliência

```text
▓▓▓ OPERATIONAL CONSTRAINTS
────────────────────────────────────────
└─ Histórico: Truncagem automática (últimas 30 msgs)
└─ Quota: Auditada em tempo real via Redis
└─ Acessibilidade: Gestão de foco e navegação Escape (A11y)
└─ Persistência: LocalStorage + Sessão Identificada
```

────────────────────────────────────────

## ◬ Próximos Passos

1. Automatizar retorno de `/success` para o loop principal.
2. Preparar injeção de protocolos customizados para EL CHAPO.
3. Hardening contínuo de rate-limiting por Device Fingerprint.

────────────────────────────────────────

```text
▓▓▓ NΞØ MELLØ
────────────────────────────────────────
Core Architect · NΞØ Protocol
neo@neoprotocol.space

"Code is law. Expand until
chaos becomes protocol."

Security by design.
Exploits find no refuge here.
────────────────────────────────────────
```
