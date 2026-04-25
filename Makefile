# ========================================
#      NΞØ · PROJECT CONTROL PLANE
# ========================================
# Project: neo-chat-uncensored
# Version: 1.1.0 (Local PNPM Mode)
# ========================================

.PHONY: help dev dev-be dev-fe install verify audit clean

# --- CONFIGURATION ---
PNPM = pnpm

# --- HELP ---
help:
	@echo "NΞØ Protocol · Makefile (Local PNPM)"
	@echo "────────────────────────────────────────"
	@echo "Usage: make [target]"
	@echo ""
	@echo "OPERATIONAL:"
	@echo "  dev           Start both Frontend and Backend"
	@echo "  dev-be        Start only Backend (Express)"
	@echo "  dev-fe        Start only Frontend (Astro)"
	@echo ""
	@echo "CONTEXT & AUDIT:"
	@echo "  verify        Execute context engineering verification"
	@echo "  audit         Run security audit on all modules"
	@echo ""
	@echo "DEVELOPMENT:"
	@echo "  install       Install all dependencies (pnpm workspace)"
	@echo "  clean         Remove build artifacts and node_modules"
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
