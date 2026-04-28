# ========================================
#      NΞØ · PROJECT CONTROL PLANE
# ========================================
# Project: neo-chat-uncensored
# Version: 1.3.0 (Quality Gate Integrated)
# ========================================

.PHONY: help init install dev dev-fe dev-be stop check verify audit test lint build push clean logs

# --- CONFIGURATION ---
PNPM = pnpm

# --- HELP ---
help:
	@echo "NΞØ Protocol · neo-chat-uncensored"
	@echo "────────────────────────────────────────"
	@echo "Usage: make [target]"
	@echo ""
	@echo "1. INITIALIZATION"
	@echo "  init          Cria .env a partir de .env.example + instala deps"
	@echo "  install       Instala todas as dependências do projeto"
	@echo ""
	@echo "2. DEVELOPMENT"
	@echo "  dev           Inicia Frontend + Backend simultaneamente"
	@echo "  dev-fe        Inicia apenas o Frontend (Astro :4321)"
	@echo "  dev-be        Inicia apenas o Backend (Express :3001)"
	@echo "  stop          Limpa portas 3001 e 4321 (kill processes)"
	@echo "  logs          Visualiza logs em tempo real do backend"
	@echo ""
	@echo "3. QUALITY & CHECK (Obrigatório antes do Push)"
	@echo "  check         Roda TUDO: verify + audit + test + lint"
	@echo "  verify        Valida integridade do ambiente e configurações"
	@echo "  audit         Auditoria de segurança de dependências"
	@echo "  test          Roda testes unitários do backend"
	@echo "  lint          Verifica padrões de código (placeholder)"
	@echo "  clean         Remove artefatos de build e node_modules"
	@echo ""
	@echo "4. BUILD & PRODUCTION"
	@echo "  build         Build de produção (Astro static/hybrid)"
	@echo "  push          Secure Gate: check + build + git status"
	@echo "────────────────────────────────────────"

# --- 1. INITIALIZATION ---
init:
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env from example..."; \
		cp .env.example .env; \
	fi
	$(MAKE) install

install:
	@echo "📦 Installing workspace dependencies..."
	$(PNPM) install

# --- 2. DEVELOPMENT ---
dev:
	@echo "🚀 Starting NΞØ Ecosystem..."
	@($(PNPM) dev) & (cd backend && $(PNPM) dev) & wait

stop:
	@echo "🛑 Killing processes on ports 3001 and 4321..."
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:4321 | xargs kill -9 2>/dev/null || true
	@echo "✅ Ports cleared."

dev-be:
	@echo "🔌 Starting Backend..."
	cd backend && $(PNPM) dev

dev-fe:
	@echo "🎨 Starting Frontend..."
	$(PNPM) dev

logs:
	@echo "📋 Streaming Backend Logs..."
	tail -f backend/app.log

# --- 3. QUALITY & CHECK ---
check: verify audit test lint
	@echo "✅ All checks passed successfully."

verify:
	@echo "🔍 Verifying Project Integrity..."
	@if [ ! -f .env ]; then echo "❌ Error: .env file missing!"; exit 1; fi
	@if [ ! -f docs/SYSTEM_PROMPT.md ]; then echo "❌ Error: docs/SYSTEM_PROMPT.md missing!"; exit 1; fi
	@echo "  - Environment: OK"
	@echo "  - Docs & Persona: OK"
	@echo "  - Node Version: `node -v`"
	@echo "✅ Integrity verified."

audit:
	@echo "🛡️  Running Security Audit..."
	$(PNPM) audit

test:
	@echo "🧪 Running Backend Tests..."
	@cd backend && node --test src/**/*.test.js

lint:
	@echo "✨ Linting (via Astro check)..."
	@if [ -d node_modules/@astrojs/check ]; then \
		$(PNPM) astro check; \
	else \
		echo "⚠️  Astro check ignorado (dependências pendentes)."; \
	fi

clean:
	@echo "🧹 Cleaning artifacts..."
	rm -rf dist .astro
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	@echo "✨ Clean complete."

# --- 4. BUILD & PRODUCTION ---
build:
	@echo "🏗️  Building production assets..."
	@echo "📦 Ensuring dependencies are synced..."
	$(PNPM) install
	@echo "🧹 Resetting Astro build cache..."
	rm -rf dist .astro
	$(PNPM) run build

push:
	@echo "🚀 Starting Secure Push Protocol..."
	@$(MAKE) check
	@$(MAKE) build
	@echo "✅ Full quality gate passed. Ready to commit."
	@git status
