# ==============================================================================
# NØX WAF SHIELD DOCKERFILE
# ==============================================================================
# Railway injects a dynamic $PORT environment variable. This Dockerfile uses
# nginx:alpine's built-in envsubst mechanism to substitute ${PORT} at startup.
# ==============================================================================

FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx.conf as a template targeting /etc/nginx/nginx.conf directly
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

# Only substitute $PORT and output directly to /etc/nginx (avoiding nested http{} in conf.d)
ENV NGINX_ENVSUBST_FILTER=PORT
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx
ENV PORT=3000

# Preserve explicit port metadata for container introspection and local tooling
EXPOSE 3000

# Inicia em foreground (entrypoint handles envsubst automatically)
CMD ["nginx", "-g", "daemon off;"]

