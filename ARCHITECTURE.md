# Architecture Documentation - NΞØ

Plataforma de Chat IA Sem censura e responsabilidade do user  baseada no ecossistema Venice.ai, focada em privacidade absoluta e liberdade de informação.

## System Overview

O sistema opera em um modelo de soberania multi-repo:

- **Frontend**: Astro (Islands Architecture) para performance extrema.
- **Backend**: Node.js Express para orquestração de APIs e Quotas.
- **AI Engine**: Venice AI (Uncensored Models).
- **Payments**: Stripe (Fiat & Crypto).

## Data Flow

Usuário -> Frontend (Astro) -> API Backend (Express/JWT) -> Redis (Quotas) -> Venice API.

## Decision Records (ADR)

*Nenhuma decisão crítica registrada ainda.*

## Module Responsibilities

- **Frontend**: Astro + React para componentes interativos.
- **Backend API**: Express.js com autenticação JWT.
- **Cache/State**: Redis para controle de tier e rate limit.

## Running Locally

```bash
make init
make start
```
