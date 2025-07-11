# 📺 Videos Box - Sistema de TV Box Corporativo

Sistema completo de gerenciamento e distribuição de vídeos para dispositivos TV Box, desenvolvido com tecnologias **100% gratuitas e open source**.

## 🚀 Características

- **Painel Administrativo**: Interface web para gerenciar vídeos, campanhas e dispositivos
- **Player TV Box**: Interface otimizada para reprodução em TVs
- **Distribuição em Tempo Real**: Envio de conteúdo via WebSockets
- **Processamento de Vídeo**: Conversão automática para múltiplas qualidades
- **Analytics**: Relatórios detalhados de reprodução
- **Multi-dispositivo**: Controle centralizado de múltiplas TVs

## 🛠️ Stack Tecnológica (100% Gratuita)

### Backend
- **Node.js + Express**: API REST e WebSocket
- **TypeScript**: Tipagem estática
- **Prisma**: ORM para banco de dados
- **PostgreSQL**: Banco de dados principal
- **Redis**: Cache e filas
- **Socket.io**: Comunicação em tempo real

### Frontend
- **React + TypeScript**: Interface administrativa
- **Material-UI**: Componentes de interface
- **HTML5 + JavaScript**: Player para TV Box

### Infraestrutura
- **Docker**: Containerização
- **Nginx**: Proxy reverso
- **MinIO**: Armazenamento de arquivos (alternativa gratuita ao AWS S3)
- **FFmpeg**: Processamento de vídeo

## 📋 Pré-requisitos

- **Docker** e **Docker Compose**
- **Node.js** 18+ (para desenvolvimento)
- **Git**

## 🚀 Instalação Rápida

### 1. Clone o repositório
```bash
git clone <repository-url>
cd videos-box
```

### 2. Configure as variáveis de ambiente
```bash
# Backend
cp backend/.env.example backend/.env

# Edite o arquivo backend/.env com suas configurações
```

### 3. Inicie com Docker
```bash
# Instalar dependências
npm run install:all

# Iniciar todos os serviços
docker-compose up -d

# Verificar status dos serviços
docker-compose ps
```

### 4. Configurar banco de dados
```bash
# Executar migrations
docker-compose exec backend npm run db:migrate

# Executar seeds (dados iniciais)
docker-compose exec backend npm run db:seed
```

## 🌐 Acesso aos Serviços

- **Painel Admin**: http://localhost:3000
- **API Backend**: http://localhost:3001
- **Player TV**: http://localhost:3001/player/{deviceId}
- **MinIO Console**: http://localhost:9001
- **Health Check**: http://localhost:3001/health

### Credenciais Padrão

**Admin do Sistema:**
- Email: admin@videosbox.com
- Senha: admin123

**MinIO:**
- Access Key: minioadmin
- Secret Key: minioadmin123

## 📱 Como Usar

### 1. Configurar Dispositivos TV
1. Acesse o painel admin
2. Vá em "Dispositivos" → "Adicionar Dispositivo"
3. Configure nome, localização e resolução
4. Anote o ID do dispositivo

### 2. Conectar TV Box
1. Abra o navegador na TV
2. Acesse: `http://[IP_SERVIDOR]:3001/player/[DEVICE_ID]`
3. O dispositivo aparecerá como "Online" no painel

### 3. Upload de Vídeos
1. No painel admin, vá em "Vídeos"
2. Clique em "Upload" e selecione os arquivos
3. Os vídeos serão processados automaticamente

### 4. Criar Campanhas
1. Vá em "Campanhas" → "Nova Campanha"
2. Adicione vídeos à campanha
3. Configure dispositivos de destino
4. Ative a campanha

### 5. Monitoramento
- **Dashboard**: Visão geral do sistema
- **Analytics**: Relatórios de reprodução
- **Dispositivos**: Status em tempo real

## 🔧 Desenvolvimento

### Executar em modo desenvolvimento
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd admin-panel
npm install
npm start
```

### Estrutura do Projeto
```
videos-box/
├── backend/           # API Node.js + Express
│   ├── src/
│   ├── prisma/
│   └── uploads/
├── admin-panel/       # React Admin Interface
│   ├── src/
│   └── public/
├── tv-player/         # HTML5 TV Player
│   ├── index.html
│   └── js/
├── scripts/           # Scripts utilitários
├── docker-compose.yml
└── README.md
```

## 📊 Funcionalidades Detalhadas

### Painel Administrativo
- ✅ Dashboard com métricas em tempo real
- ✅ Gerenciamento de usuários e permissões
- ✅ Upload e organização de vídeos
- ✅ Criação de campanhas e playlists
- ✅ Controle de dispositivos remotos
- ✅ Analytics e relatórios
- ✅ Configurações do sistema

### Player TV Box
- ✅ Reprodução automática de vídeos
- ✅ Suporte a múltiplos formatos
- ✅ Controle remoto via teclado
- ✅ Modo fullscreen automático
- ✅ Reconexão automática
- ✅ Heartbeat para monitoramento
- ✅ Interface otimizada para TV

### API Backend
- ✅ Autenticação JWT com refresh tokens
- ✅ Upload de arquivos com validação
- ✅ Processamento de vídeo em background
- ✅ WebSocket para comunicação em tempo real
- ✅ Rate limiting e segurança
- ✅ Logs estruturados
- ✅ Health checks

## 🔒 Segurança

- **Autenticação JWT** com refresh tokens
- **Rate limiting** para prevenir ataques
- **Validação de entrada** em todas as rotas
- **CORS** configurado adequadamente
- **Helmet.js** para headers de segurança
- **Bcrypt** para hash de senhas

## 📈 Escalabilidade

- **Redis** para cache e sessões
- **Filas** para processamento assíncrono
- **Load balancing** com Nginx
- **Containerização** com Docker
- **Monitoramento** de saúde dos serviços

## 🐛 Troubleshooting

### Problemas Comuns

**1. Serviços não iniciam:**
```bash
# Verificar logs
docker-compose logs [service-name]

# Reiniciar serviços
docker-compose restart
```

**2. Banco de dados não conecta:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Executar migrations novamente
docker-compose exec backend npm run db:migrate
```

**3. Vídeos não reproduzem:**
- Verificar se FFmpeg está instalado
- Confirmar formatos de vídeo suportados
- Verificar logs do backend

**4. Dispositivo não conecta:**
- Verificar conectividade de rede
- Confirmar ID do dispositivo
- Verificar logs do WebSocket

## 📝 Logs

```bash
# Logs em tempo real
docker-compose logs -f

# Logs de um serviço específico
docker-compose logs -f backend

# Logs do sistema
tail -f logs/app.log
```

## 🔄 Backup e Restore

### Backup
```bash
# Backup do banco de dados
docker-compose exec postgres pg_dump -U videosbox videosbox > backup.sql

# Backup dos arquivos
tar -czf uploads-backup.tar.gz uploads/
```

### Restore
```bash
# Restore do banco
docker-compose exec -T postgres psql -U videosbox videosbox < backup.sql

# Restore dos arquivos
tar -xzf uploads-backup.tar.gz
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença ELBER NEVES. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Documentação**: [Wiki do projeto]
- **Issues**: [GitHub Issues]
- **Discussões**: [GitHub Discussions]

## 🎯 Roadmap

- [ ] App mobile para controle remoto
- [ ] Suporte a streaming ao vivo
- [ ] Integração com APIs de terceiros
- [ ] Sistema de templates para campanhas
- [ ] Suporte a múltiplos idiomas
- [ ] API GraphQL
- [ ] Clustering para alta disponibilidade

---

**Desenvolvido com ❤️ usando tecnologias 100% gratuitas e open source**
