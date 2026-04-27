# ========================================
#      NΞØ · PROJECT CONTROL PLANE
# ========================================
# Project: neo-chat-uncensored
# Version: 1.1.0 (Local PNPM Mode)
# ========================================

.PHONY: help init install dev dev-fe dev-be stop verify audit build push clean

# --- CONFIGURATION ---
PNPM = pnpm

# --- HELP ---
help:
	@echo "NΞØ Protocol · neo-chat-uncensored"
	@echo "────────────────────────────────────────"
	@echo "Usage: make [target]"
	@echo ""
	@echo "SETUP (primeira vez ou reset):"
	@echo "  init          Cria .env a partir de .env.example + instala deps"
	@echo "  install       Instala dependências do workspace (pnpm)"
	@echo ""
	@echo "DESENVOLVIMENTO:"
	@echo "  dev           Inicia Frontend + Backend simultaneamente"
	@echo "  dev-fe        Inicia apenas o Frontend (Astro :4321)"
	@echo "  dev-be        Inicia apenas o Backend (Express :3001)"
	@echo "  stop          Para todos os processos nas portas 3001 e 4321"
	@echo ""
	@echo "QUALIDADE:"
	@echo "  verify        Verifica integridade do contexto (neo-ai)"
	@echo "  audit         Auditoria de segurança de dependências (pnpm)"
	@echo ""
	@echo "BUILD E DEPLOY:"
	@echo "  build         Build de produção (limpa cache + pnpm build)"
	@echo "  push          Gate pré-push: audit + build + git status"
	@echo ""
	@echo "MANUTENÇÃO:"
	@echo "  clean         Remove dist/, .astro/ e node_modules/"
	@echo "────────────────────────────────────────"

# --- OPERATIONAL ---
dev:
	@echo "🚀 Starting NΞØ Ecosystem (Local)..."
	@($(PNPM) dev) & (cd backend && $(PNPM) dev) & wait

start: dev

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

# --- CONTEXT & AUDIT ---
verify:
	@echo "🔍 Verifying Context Integrity..."
	@bash ./neo-ai/verify-context.sh

audit:
	@echo "🛡️  Running Security Audit..."
	$(PNPM) audit

# --- DEVELOPMENT ---
install:
	@echo "📦 Installing workspace dependencies..."
	$(PNPM) install

clean:
	@echo "🧹 Cleaning artifacts..."
	rm -rf dist
	rm -rf .astro
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	@echo "✨ Clean complete."

# --- BUILD & DEPLOY ---
build:
	@echo "🏗️  Building production assets..."
	@echo "📦 Ensuring dependencies are installed..."
	$(PNPM) install --frozen-lockfile
	@echo "🧹 Resetting Astro build cache..."
	rm -rf dist .astro
	$(PNPM) run build

push:
	@echo "🚀 Starting Secure Push Protocol..."
	@$(MAKE) audit
	@$(MAKE) build
	@echo "✅ Checks passed. Ready to commit."
	@git status

# --- INITIALIZATION ---
init:
	@if [ ! -f .env ]; then \
		echo "📝 Creating .env from example..."; \
		cp .env.example .env; \
	fi
	$(MAKE) install
