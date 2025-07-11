# Documentação do Sistema de Vídeos e Propagandas (TV Box)

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-Proprietary-blue)

© Direitos Reservados ELBER NEVES

---

## Índice
- [Visão Geral](#visão-geral)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Funcionalidades Implementadas](#funcionalidades-implementadas)
- [Exemplo de Uso da API](#exemplo-de-uso-da-api)
- [Testes Realizados](#testes-realizados)
- [Próximos Passos](#próximos-passos)
- [Como Executar](#como-executar)
- [Configuração de Ambiente](#configuração-de-ambiente)
- [Como Contribuir](#como-contribuir)
- [Contato](#contato)

---

## Visão Geral
Sistema completo para gerenciamento, envio e reprodução de vídeos de marketing em dispositivos TV Box. Composto por backend API, frontend administrativo e player para dispositivos.

---

## Estrutura do Projeto

- **backend/**: API RESTful em Node.js + Express + TypeScript
  - Gerenciamento de usuários, vídeos, campanhas e dispositivos
  - Upload e processamento de vídeos
  - Comunicação via WebSockets para sincronização em tempo real
  - Banco de dados PostgreSQL e cache Redis
  - Principais dependências: express, prisma, socket.io, jsonwebtoken

- **admin-panel/**: Frontend administrativo em React + TypeScript
  - Interface para upload, gerenciamento de campanhas e controle de dispositivos
  - Autenticação e autorização via JWT
  - Uso de React Query para gerenciamento de dados
  - Estilização com Material-UI
  - Principais dependências: react, @mui/material, react-query, axios

- **tv-player/**: Player HTML5 + JavaScript Vanilla
  - Reprodução de vídeos em modo fullscreen
  - Sincronização com backend via WebSockets
  - Interface simples para dispositivos TV

- **docker-compose.yml**: Orquestração dos serviços para desenvolvimento e produção

---

## Funcionalidades Implementadas

- Upload e armazenamento de vídeos em formatos MP4 e WebM
- Criação e gerenciamento de campanhas e playlists
- Controle e monitoramento de dispositivos TV Box conectados
- Streaming adaptativo e sincronização em tempo real
- Sistema de autenticação e permissões
- Logs e tratamento de erros centralizados

---

## Exemplo de Uso da API

### Autenticação
```http
POST /api/auth/login
Content-Type: application/json
{
  "email": "usuario@exemplo.com",
  "senha": "123456"
}
```
**Resposta:**
```json
{
  "token": "<jwt-token>"
}
```

### Upload de Vídeo
```http
POST /api/videos/upload
Headers: Authorization: Bearer <jwt-token>
Body: multipart/form-data (campo: file)
```
**Resposta:**
```json
{
  "id": 1,
  "nome": "video.mp4",
  "url": "/uploads/video.mp4"
}
```

---

## Testes Realizados

### Backend
- Testes manuais dos principais endpoints: autenticação, upload, campanhas, dispositivos
- Validação de respostas, erros e fluxos de autenticação
- Testes de integração com banco de dados e cache Redis

### Frontend Administrativo
- Testes manuais de navegação, upload, gerenciamento e controle de dispositivos
- Validação da comunicação com backend via API e WebSockets
- Testes de usabilidade e responsividade

### Player TV Box
- Testes de reprodução de vídeos
- Sincronização em tempo real com backend
- Testes de interface e controle remoto

---

## Próximos Passos

- Automatizar testes unitários e de integração
- Implementar monitoramento e alertas
- Otimizar performance e escalabilidade
- Documentar API detalhadamente (Swagger/OpenAPI)

---

## Como Executar

1. Copie o arquivo `.env.example` para `.env` e configure as variáveis de ambiente necessárias para backend e frontend.
2. Execute `docker-compose up` para iniciar todos os serviços.
3. Acesse o painel administrativo via navegador em `http://localhost:3000` (ajuste conforme necessário).
4. Conecte dispositivos TV Box para reprodução.

---

## Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis (exemplo):
```
# Backend
DATABASE_URL=postgresql://usuario:senha@localhost:5432/videosbox
REDIS_URL=redis://localhost:6379
JWT_SECRET=sua_chave_secreta

# Frontend
REACT_APP_API_URL=http://localhost:4000/api
```

---

## Como Contribuir

1. Faça um fork do projeto
2. Crie uma branch: `git checkout -b minha-feature`
3. Commit suas alterações: `git commit -m 'Minha feature'`
4. Push para o fork: `git push origin minha-feature`
5. Abra um Pull Request

---

## Contato

Para dúvidas ou suporte, contate o time de desenvolvimento.

---

Esta documentação foi gerada automaticamente após a conclusão do desenvolvimento e testes manuais do sistema.
