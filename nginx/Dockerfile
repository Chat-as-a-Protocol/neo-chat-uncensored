FROM nginx:alpine

# Remove configuração padrão do Nginx
RUN rm -f /etc/nginx/conf.d/default.conf

# Copia nossa configuração de blindagem WAF
COPY nginx.conf /etc/nginx/nginx.conf

# Expõe a porta que o Railway publicará
EXPOSE 3000

# Inicia em foreground
CMD ["nginx", "-g", "daemon off;"]
