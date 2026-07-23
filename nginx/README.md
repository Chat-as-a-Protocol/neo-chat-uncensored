<!-- markdownlint-disable MD003 MD007 MD013 MD022 MD023 MD025 MD029 MD032 MD033 MD034 -->
# NØX · Nginx WAF Module

```text
========================================
     NØX · NGINX WAF FIREWALL SHIELD
========================================
Status: active
Runtime: Nginx Alpine (envsubst $PORT)
Public Access: https://api.noxai.chat (Porta 3000)
Upstream: http://backend.railway.internal:3001
========================================
```

## ⟠ Papel & Arquitetura

O módulo **Nginx WAF** é o escudo de borda e proxy reverso exposto em `https://api.noxai.chat`.

- **Substituição de Porta em Tempo de Inicialização:** Utiliza o mecanismo `envsubst` nativo da imagem `nginx:alpine` para injetar dinamicamente a variável `$PORT` (fornecida pelo Railway) diretamente em `/etc/nginx/nginx.conf`.
- **Healthcheck Independente:** Rota `/nginx-health` respondendo `200 OK` diretamente da memória em ~0.1ms. Isso garante que a disponibilidade do Firewall permaneça 100% independente do status de boot do backend.
- **Proteção de Upstream:** Repassa tráfego higienizado para o serviço de backend interno em `http://backend.railway.internal:3001`.

---

## ⧉ Estrutura do Nó

```text
nginx/
├── Dockerfile           # Imagem Nginx Alpine com envsubst em NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx
├── nginx.conf           # Configuração de proxy_pass, rate-limiting e /nginx-health
├── railway.json         # Configuração de deploy Railway com healthcheckPath=/nginx-health
├── Makefile             # Interface canônica NΞØ Protocol
└── README.md            # Especificação técnica do módulo WAF
```

---

## ⨷ Comandos Canônicos

```bash
make build        # Constrói a imagem Docker local (nox-nginx-waf)
make check-conf   # Valida a sintaxe do arquivo nginx.conf usando o Docker
make test-health  # Testa o endpoint /nginx-health via cURL
make clean        # Remove a imagem Docker local criada
```

---

## ⧖ Regra de Ouro da Infraestrutura

- **Cache DNS do Upstream:** Quando o serviço `backend` for reimplantado ou reiniciado no Railway, ele receberá um novo IP privado interno. **É OBRIGATÓRIO dar um Restart no serviço `nginx-WAF`** no Railway logo após o deploy do backend para renovar a resolução DNS do upstream e evitar erros `504 Gateway Timeout`.
