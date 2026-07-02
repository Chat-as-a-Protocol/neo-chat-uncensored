# ==============================================================================
# NØX WAF SHIELD DOCKERFILE
# ==============================================================================
# Railway injects a dynamic $PORT environment variable. This Dockerfile uses
# nginx:alpine's built-in envsubst mechanism to substitute ${PORT} at startup.
# ==============================================================================

FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy nginx.conf as a template for envsubst processing
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Only substitute $PORT — do not touch nginx's own variables ($host, $request, etc.)
ENV NGINX_ENVSUBST_FILTER=PORT
ENV PORT=3000

# Inicia em foreground (entrypoint handles envsubst automatically)
CMD ["nginx", "-g", "daemon off;"]

