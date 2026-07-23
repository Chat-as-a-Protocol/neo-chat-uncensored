# ==============================================================================
# NΞØ PROTOCOL · NØX FRONTEND MODULE
# ==============================================================================

.PHONY: help dev check build preview clean

# Colors
CYAN    := \033[0;36m
MAGENTA := \033[0;35m
WHITE   := \033[1;37m
DIM     := \033[0;90m
GREEN   := \033[0;32m
YELLOW  := \033[0;33m
RED     := \033[0;31m
RESET   := \033[0m

help: ## Exibe os comandos do módulo Frontend
	@printf "$(CYAN)╔══════════════════════════════════════════╗$(RESET)\n"
	@printf "$(CYAN)║$(MAGENTA)▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓$(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║                                          ║$(RESET)\n"
	@printf "$(CYAN)║$(RESET)     $(WHITE)NØX · FRONTEND (ASTRO 6 SSR)$(RESET)       $(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║$(RESET)         $(MAGENTA)── noxai.chat / :4321 ──$(RESET)          $(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║                                          ║$(RESET)\n"
	@printf "$(CYAN)║$(MAGENTA)▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓$(CYAN)║$(RESET)\n"
	@printf "$(CYAN)╚══════════════════════════════════════════╝$(RESET)\n"
	@printf "$(DIM) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░$(RESET)\n\n"
	@printf "$(DIM)  ·─── OPERAÇÕES ────────────────────────────$(RESET)\n"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "dev" "Inicia servidor de desenvolvimento Astro (:4321)"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "check" "Roda diagnóstico de tipos com astro check"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "build" "Gera o build de produção (SSR Node standalone)"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "preview" "Roda o preview local do build gerado"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "clean" "Remove pastas .astro e dist"
	@printf "\n$(DIM) ─────────────────────────────────────────────$(RESET)\n"
	@printf "$(DIM) ⬡ NΞØ Protocol // Node // frontend$(RESET)\n\n"

dev: ## Inicia o servidor Astro em dev
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🚀  DEV SERVER ASTRO (:4321)$(RESET)             $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm astro dev

check: ## Roda o astro check
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🔍  ASTRO DIAGNOSTICS CHECK$(RESET)             $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm astro check

build: ## Gera o build do frontend
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🏗️   ASTRO PRODUCTION BUILD$(RESET)              $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm astro build

preview: ## Roda o preview do build
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)👀  ASTRO PREVIEW BUILD$(RESET)                 $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	pnpm astro preview

clean: ## Limpa pastas de build
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🧹  CLEAN FRONTEND CACHE$(RESET)                $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	rm -rf dist .astro
