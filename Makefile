#      NΞØ · PROJECT CONTROL PLANE
# ========================================
# Project: neo-chat-uncensored
# Version: 3.0.0 (Hardened Production)
# ========================================

.PHONY: help init install dev dev-fe dev-be stop check verify audit test lint build push clean logs astro-clean astro-rebuild

# --- CONFIGURATION ---
PNPM = pnpm

# Load environment variables
ifneq (,$(wildcard ./.env))
    include .env
    export
endif

# --- HELP ---
help:
	@echo "NØX · neo-chat-uncensored"
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
	@echo "  astro-clean   Remove apenas cache/output do Astro (.astro + dist)"
	@echo "  astro-rebuild Limpa cache do Astro e executa build"
	@echo ""
	@echo "4. BUILD & PRODUCTION"
	@echo "  build         Build de produção (Astro static/hybrid)"
	@echo "  push          Secure Gate: check + build + git status"
	@echo "────────────────────────────────────────"

# --- 1. INITIALIZATION ---
init:
	@if [ ! -f .env ]; then \
		echo "[ENV] Creating .env from example..."; \
		cp .env.example .env; \
	fi
	$(MAKE) install

install:
	@echo "[SYNC] Installing workspace dependencies..."
	$(PNPM) install

# --- 2. DEVELOPMENT ---
dev:
	@echo "[START] Starting NΞØ Ecosystem..."
	@($(PNPM) dev) & (cd backend && $(PNPM) dev) & wait

stop:
	@echo "[STOP] Killing processes on ports 3001 and 4321..."
	@lsof -ti:3001 | xargs kill -9 2>/dev/null || true
	@lsof -ti:4321 | xargs kill -9 2>/dev/null || true
	@echo "[OK] Ports cleared."

dev-be:
	@echo "[BE] Starting Backend..."
	cd backend && $(PNPM) dev

dev-fe:
	@echo "[FE] Starting Frontend..."
	$(PNPM) dev

logs:
	@echo "[LOGS] Streaming Backend Logs..."
	tail -f backend/app.log

# --- 3. QUALITY & CHECK ---
check: verify audit test lint
	@echo "[OK] All checks passed successfully."

verify:
	@echo "[VERIFY] Verifying Project Integrity..."
	@if [ ! -f .env ]; then echo "[ERROR] Error: .env file missing!"; exit 1; fi
	@if [ ! -f shared/runtime-prompt.md ]; then \
		echo "[WARN] Warning: shared/runtime-prompt.md missing (Backend will use default prompt)."; \
	else \
		echo "  - Runtime Prompt: OK"; \
	fi
	@echo "  - Environment: OK"
	@echo "  - Node Version: `node -v`"
	@echo "[OK] Integrity verified."

audit:
	@echo "[SEC] Running Security Audit..."
	$(PNPM) audit

test:
	@echo "[TEST] Running Backend Tests..."
	@cd backend && node --test src/**/*.test.js

lint:
	@echo "[LINT] Linting (via Astro check)..."
	@if [ -d node_modules/@astrojs/check ]; then \
		$(PNPM) astro check; \
	else \
		echo "[WARN] Astro check ignorado (dependências pendentes)."; \
	fi

clean:
	@echo "[CLEAN] Cleaning artifacts..."
	@$(MAKE) astro-clean
	find . -name "node_modules" -type d -prune -exec rm -rf '{}' +
	@echo "[OK] Clean complete."

astro-clean:
	@echo "[PURGE] Cleaning Astro cache/output..."
	rm -rf dist .astro
	@echo "[OK] Astro cache clean complete."

astro-rebuild: astro-clean
	@echo "[BUILD] Rebuilding Astro after clean..."
	$(PNPM) run build

# --- 4. BUILD & PRODUCTION ---
build:
	@echo "[BUILD] Building production assets..."
	@echo "[SYNC] Ensuring dependencies are synced..."
	$(PNPM) install
	@echo "[CLEAN] Resetting Astro build cache..."
	rm -rf dist .astro
	$(PNPM) run build

push:
	@echo "[START] Starting Secure Push NØX..."
	@$(MAKE) check
	@$(MAKE) build
	@echo "[OK] Full quality gate passed. Ready to commit."
	@git status

# --- 5. GIT AUTOMATION ---
# Uso: make save MSG="feat: minha mensagem"
save:
	@echo "[START] Iniciando Protocolo de Sincronização Soberana..."
	@$(MAKE) check
	@$(MAKE) build
	@echo "[COMMIT] Staging changes..."
	@git add .
	@if [ -z "$(MSG)" ]; then \
		echo "[WARN] Aviso: Nenhuma mensagem (MSG) fornecida. Usando padrão."; \
		git commit -m "chore: NØX AI automated synchronization"; \
	else \
		git commit -m "$(MSG)"; \
	fi
	@echo "[START] Enviando para o Nexus (GitHub)..."
	@git push origin main
	@echo "[OK] Sincronização concluída com sucesso."

# --- 6. UTILS ---
seed:
	@echo "[SEED] Gerando usuário de teste..."
	@node scripts/seed-test-user.js

db-init:
	@echo "[DB] Inicializando tabelas no PostgreSQL..."
	@psql $(DATABASE_URL) -f backend/schema.sql
