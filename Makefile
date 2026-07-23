# ==============================================================================
# NΞØ PROTOCOL · NØX WORKSPACE ORCHESTRATOR
# ==============================================================================

.PHONY: help init install dev dev-fe dev-be check build build-waf test clean

# Colors
CYAN    := \033[0;36m
MAGENTA := \033[0;35m
WHITE   := \033[1;37m
DIM     := \033[0;90m
GREEN   := \033[0;32m
YELLOW  := \033[0;33m
RED     := \033[0;31m
RESET   := \033[0m

help: ## Exibe os comandos disponíveis no workspace
	@printf "$(CYAN)╔══════════════════════════════════════════╗$(RESET)\n"
	@printf "$(CYAN)║$(MAGENTA)▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓$(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║                                          ║$(RESET)\n"
	@printf "$(CYAN)║$(RESET)      $(WHITE)NØX · WORKSPACE CONTROL PLANE$(RESET)      $(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║$(RESET)       $(MAGENTA)── Neo Protocol v4.2.0 ──$(RESET)       $(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║                                          ║$(RESET)\n"
	@printf "$(CYAN)║$(MAGENTA)▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓$(CYAN)║$(RESET)\n"
	@printf "$(CYAN)╚══════════════════════════════════════════╝$(RESET)\n"
	@printf "$(DIM) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░$(RESET)\n\n"
	@printf "$(DIM)  ·─── AMBIENTE & SETUP ─────────────────────$(RESET)\n"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "install" "Instala dependências de todos os workspaces"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "init" "Inicializa os .env dos módulos e instala deps"
	@printf "\n$(DIM)  ·─── DESENVOLVIMENTO ──────────────────────$(RESET)\n"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "dev" "Inicia servidor de dev do frontend Astro"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "dev-fe" "Inicia frontend Astro SSR (:3000)"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "dev-be" "Inicia backend Express API (:3001)"
	@printf "\n$(DIM)  ·─── QUALIDADE & BUILD ────────────────────$(RESET)\n"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "check" "Executa checagem de tipos do frontend e backend"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "build" "Gera build de produção do frontend"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "build-waf" "Compila a imagem Docker do Nginx WAF"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "test" "Roda testes unitários do backend"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "clean" "Limpa caches e artefatos dos módulos"
	@printf "\n$(DIM) ─────────────────────────────────────────────$(RESET)\n"
	@printf "$(DIM) ⬡ NΞØ Protocol // Ecosystem // neo-chat-uncensored$(RESET)\n\n"

init: ## Inicializa o ambiente local dos módulos
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)⚡  INITIALIZE WORKSPACE$(RESET)                $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	@if [ ! -f frontend/.env ] && [ -f frontend/.env.example ]; then cp frontend/.env.example frontend/.env; fi
	@if [ ! -f backend/.env ] && [ -f backend/.env.example ]; then cp backend/.env.example backend/.env; fi
	pnpm install

install: ## Instala dependências do workspace
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)📦  INSTALL DEPENDENCIES$(RESET)                $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm install

dev: dev-fe ## Inicia o ambiente de desenvolvimento

dev-fe: ## Inicia o frontend em dev
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🚀  START FRONTEND ASTRO$(RESET)                $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm --filter neo-chat-uncensored-frontend dev

dev-be: ## Inicia o backend em dev
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)⚙️   START BACKEND EXPRESS$(RESET)               $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm --filter chat-api-backend dev

check: ## Executa checagem de tipos do frontend e backend
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🔍  WORKSPACE QUALITY CHECK$(RESET)             $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm --filter neo-chat-uncensored-frontend check
	node --check backend/src/server.js

build: ## Gera o build do frontend
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🏗️   BUILD FRONTEND PRODUCTION$(RESET)           $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm --filter neo-chat-uncensored-frontend build

build-waf: ## Compila a imagem do Nginx WAF
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🛡️   BUILD NGINX WAF IMAGE$(RESET)               $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	$(MAKE) -C nginx build

test: ## Executa testes do backend
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🧪  RUN BACKEND TESTS$(RESET)                   $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm --filter chat-api-backend test

clean: ## Limpa artefatos de build de todos os módulos
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🧹  CLEAN WORKSPACE ARTIFACTS$(RESET)           $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	rm -rf frontend/dist frontend/.astro backend/app.log node_modules/.cache
