# ==============================================================================
# NΞØ PROTOCOL · NØX NGINX WAF SHIELD MODULE
# ==============================================================================

.PHONY: help build test-health check-conf clean

# Colors
CYAN    := \033[0;36m
MAGENTA := \033[0;35m
WHITE   := \033[1;37m
DIM     := \033[0;90m
GREEN   := \033[0;32m
YELLOW  := \033[0;33m
RED     := \033[0;31m
RESET   := \033[0m

help: ## Exibe os comandos do módulo Nginx WAF
	@printf "$(CYAN)╔══════════════════════════════════════════╗$(RESET)\n"
	@printf "$(CYAN)║$(MAGENTA)▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓$(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║                                          ║$(RESET)\n"
	@printf "$(CYAN)║$(RESET)     $(WHITE)NØX · NGINX WAF FIREWALL$(RESET)        $(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║$(RESET)     $(MAGENTA)── api.noxai.chat / :3000 ──$(RESET)       $(CYAN)║$(RESET)\n"
	@printf "$(CYAN)║                                          ║$(RESET)\n"
	@printf "$(CYAN)║$(MAGENTA)▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓$(CYAN)║$(RESET)\n"
	@printf "$(CYAN)╚══════════════════════════════════════════╝$(RESET)\n"
	@printf "$(DIM) ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░$(RESET)\n\n"
	@printf "$(DIM)  ·─── OPERAÇÕES ────────────────────────────$(RESET)\n"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "build" "Constrói a imagem Docker local do WAF Shield"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "check-conf" "Testa a sintaxe do arquivo nginx.conf com Docker"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "test-health" "Testa a rota de saúde /nginx-health"
	@printf "  $(CYAN)◆ %-16s$(RESET) $(DIM)%s$(RESET)\n" "clean" "Remove imagens e artefatos de build locais"
	@printf "\n$(DIM) ─────────────────────────────────────────────$(RESET)\n"
	@printf "$(DIM) ⬡ NΞØ Protocol // Node // nginx-waf$(RESET)\n\n"

build: ## Constrói a imagem Docker
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🐳  BUILD NGINX WAF DOCKER IMAGE$(RESET)        $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	docker build -t nox-nginx-waf .

check-conf: ## Testa a sintaxe do nginx.conf
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🔍  TEST NGINX CONFIGURATION SYNTAX$(RESET)     $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	docker run --rm -t nox-nginx-waf nginx -t

test-health: ## Valida a rota /nginx-health
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)💚  CHECK /nginx-health ENDPOINT$(RESET)       $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	curl -i -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NOX-TestClient/4.2" http://localhost:3000/nginx-health

clean: ## Limpa a imagem Docker local
	@printf "$(CYAN)╭──────────────────────────────────────────╮$(RESET)\n"
	@printf "$(CYAN)│$(RESET)  $(WHITE)🧹  CLEAN LOCAL DOCKER IMAGE$(RESET)           $(CYAN)│$(RESET)\n"
	@printf "$(CYAN)╰──────────────────────────────────────────╯$(RESET)\n"
	docker rmi nox-nginx-waf 2>/dev/null || true
