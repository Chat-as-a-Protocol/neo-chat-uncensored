# ==============================================================================
# NØX WAF SHIELD DOCKERFILE
# ==============================================================================
# NOTE ON RAILWAY HEALTHCHECKS:
# In the root railway.json, healthcheckPath is intentionally omitted so that
# edge/proxy services reading root config do not fail boot if /health is proxied.
# For this standalone Nginx service, railway.json configures healthcheckPath to
# "/nginx-health" (handled natively in memory by Nginx) so firewall uptime
# is completely independent of backend availability.
# ==============================================================================

FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copia nossa configuração de blindagem WAF
COPY nginx.conf /etc/nginx/nginx.conf

# Expõe a porta que o Railway publicará
EXPOSE 3000

# Inicia em foreground
CMD ["nginx", "-g", "daemon off;"]
