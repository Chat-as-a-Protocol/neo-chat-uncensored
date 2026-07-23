# ==============================================================================
# NΞØ PROTOCOL · NØX BACKEND MODULE
# ==============================================================================

.PHONY: help dev check test test-verbose migrate logs clean

# Colors
CYAN    := \033[0;36m
MAGENTA := \033[0;35m
WHITE   := \033[1;37m
DIM     := \033[0;90m
GREEN   := \033[0;32m
YELLOW  := \033[0;33m
RED     := \033[0;31m
RESET   := \033[0m

help: ## Exibe os comandos do módulo Backend
	@printf "$(CYAN)╔══════════════════════════════════════════╗$(RESET)\n"
	@printf "$(CYAN)║$(MAGENTA)▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓$(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║                                          ║$(RESET)\n"
	@printf "$(CYAN)║$(RESET)     $(WHITE)NØX · BACKEND (EXPRESS API)$(RESET)       $(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║$(RESET)     $(MAGENTA)── backend.railway.internal:3001 ──$(RESET)   $(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║                                          ║$(RESET)\n"
	@printf "$(CYAN)║$(MAGENTA)▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓$(CYAN)║$(RESET)\n"
	@printf "$(CYAN)╚══════════════════════════════════════════╝$(RESET)\n"
	@printf "$(DIM) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░$(RESET)\n\n"
	@printf "$(DIM)  ·─── OPERAÇÕES ────────────────────────────$(RESET)\n"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "dev" "Inicia servidor Express em dev (:3001)"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "check" "Verifica sintaxe com node --check"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "test" "Executa suíte de testes automatizados"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "migrate" "Aplica schema.sql no banco Postgres HA"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "clean" "Limpa caches temporários"
	@printf "\n$(DIM) ─────────────────────────────────────────────$(RESET)\n"
	@printf "$(DIM) ⬡ NΞØ Protocol // Node // backend$(RESET)\n\n"

dev: ## Inicia o servidor backend Express
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)⚙️   DEV SERVER EXPRESS (:3001)$(RESET)           $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	node src/server.js

check: ## Roda validação de sintaxe
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🔍  NODE SYNTAX CHECK$(RESET)                    $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	node --check src/server.js

test: ## Executa a suíte de testes
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🧪  RUN BACKEND TESTS$(RESET)                   $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	npm test

migrate: ## Aplica schema idempotente no Postgres
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🗄️   APPLY POSTGRES SCHEMA$(RESET)               $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	node --input-type=module -e "import pg from 'pg';import{readFileSync}from'node:fs';const p=new pg.Pool({connectionString:process.env.DATABASE_URL,ssl:false});await p.query(readFileSync('./schema.sql','utf8'));await p.end()"

clean: ## Limpa temporários
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🧹  CLEAN BACKEND CACHE$(RESET)                $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	rm -rf coverage .turbo
