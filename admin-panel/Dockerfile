# Dockerfile para o Frontend Admin Panel
FROM node:18-alpine AS builder

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --silent

# Copiar código fonte
COPY public/ ./public/
COPY src/ ./src/
COPY tsconfig.json ./

# Build da aplicação
RUN npm run build

# Estágio de produção com Nginx
FROM nginx:alpine AS production

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/build /usr/share/nginx/html

# Criar script de inicialização para substituir variáveis de ambiente
RUN echo '#!/bin/sh' > /docker-entrypoint.sh && \
    echo 'set -e' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Substituir variáveis de ambiente no JavaScript' >> /docker-entrypoint.sh && \
    echo 'if [ -n "$REACT_APP_API_URL" ]; then' >> /docker-entrypoint.sh && \
    echo '  find /usr/share/nginx/html -name "*.js" -exec sed -i "s|REACT_APP_API_URL_PLACEHOLDER|$REACT_APP_API_URL|g" {} \;' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo 'if [ -n "$REACT_APP_SOCKET_URL" ]; then' >> /docker-entrypoint.sh && \
    echo '  find /usr/share/nginx/html -name "*.js" -exec sed -i "s|REACT_APP_SOCKET_URL_PLACEHOLDER|$REACT_APP_SOCKET_URL|g" {} \;' >> /docker-entrypoint.sh && \
    echo 'fi' >> /docker-entrypoint.sh && \
    echo '' >> /docker-entrypoint.sh && \
    echo '# Iniciar Nginx' >> /docker-entrypoint.sh && \
    echo 'exec nginx -g "daemon off;"' >> /docker-entrypoint.sh && \
    chmod +x /docker-entrypoint.sh

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

# Comando de inicialização
ENTRYPOINT ["/docker-entrypoint.sh"]
