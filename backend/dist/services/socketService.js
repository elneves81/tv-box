"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketService = void 0;
exports.initializeSocket = initializeSocket;
exports.getSocketService = getSocketService;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const database_1 = require("../config/database");
class SocketService {
    constructor(io) {
        this.connectedDevices = new Map();
        this.connectedUsers = new Map();
        this.io = io;
        this.setupMiddleware();
        this.setupEventHandlers();
    }
    setupMiddleware() {
        this.io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                const deviceId = socket.handshake.auth.deviceId;
                if (deviceId) {
                    const device = await database_1.prisma.device.findUnique({
                        where: { id: deviceId }
                    });
                    if (!device) {
                        return next(new Error('Dispositivo não encontrado'));
                    }
                    socket.deviceId = deviceId;
                    logger_1.logger.info(`Dispositivo conectado: ${deviceId}`);
                }
                else if (token) {
                    const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
                    const user = await database_1.prisma.user.findUnique({
                        where: { id: decoded.id }
                    });
                    if (!user) {
                        return next(new Error('Usuário não autorizado'));
                    }
                    socket.userId = user.id;
                    socket.userRole = user.role;
                    logger_1.logger.info(`Usuário conectado: ${user.email}`);
                }
                else {
                    return next(new Error('Token ou deviceId requerido'));
                }
                next();
            }
            catch (error) {
                logger_1.logger.error('Erro na autenticação do socket:', error);
                next(new Error('Falha na autenticação'));
            }
        });
    }
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            logger_1.logger.info(`Socket conectado: ${socket.id}`);
            if (socket.deviceId) {
                this.connectedDevices.set(socket.deviceId, socket.id);
                this.updateDeviceStatus(socket.deviceId, 'ONLINE');
                socket.join(`device:${socket.deviceId}`);
            }
            if (socket.userId) {
                this.connectedUsers.set(socket.userId, socket.id);
                socket.join(`user:${socket.userId}`);
                if (socket.userRole === 'ADMIN') {
                    socket.join('admin');
                }
            }
            socket.on('device:status', (data) => {
                if (socket.deviceId) {
                    this.handleDeviceStatus(socket.deviceId, data);
                }
            });
            socket.on('device:heartbeat', () => {
                if (socket.deviceId) {
                    this.handleDeviceHeartbeat(socket.deviceId);
                }
            });
            socket.on('video:play', (data) => {
                if (socket.deviceId) {
                    this.handleVideoPlay(socket.deviceId, data);
                }
            });
            socket.on('video:pause', (data) => {
                if (socket.deviceId) {
                    this.handleVideoPause(socket.deviceId, data);
                }
            });
            socket.on('video:end', (data) => {
                if (socket.deviceId) {
                    this.handleVideoEnd(socket.deviceId, data);
                }
            });
            socket.on('admin:send-to-device', (data) => {
                if (socket.userRole === 'ADMIN') {
                    this.sendToDevice(data.deviceId, data.event, data.payload);
                }
            });
            socket.on('admin:broadcast', (data) => {
                if (socket.userRole === 'ADMIN') {
                    this.broadcastToAllDevices(data.event, data.payload);
                }
            });
            socket.on('disconnect', () => {
                logger_1.logger.info(`Socket desconectado: ${socket.id}`);
                if (socket.deviceId) {
                    this.connectedDevices.delete(socket.deviceId);
                    this.updateDeviceStatus(socket.deviceId, 'OFFLINE');
                }
                if (socket.userId) {
                    this.connectedUsers.delete(socket.userId);
                }
            });
        });
    }
    async updateDeviceStatus(deviceId, status) {
        try {
            await database_1.prisma.device.update({
                where: { id: deviceId },
                data: {
                    lastSeen: new Date()
                }
            });
            this.io.to('admin').emit('device:status-changed', {
                deviceId,
                status,
                timestamp: new Date()
            });
        }
        catch (error) {
            logger_1.logger.error('Erro ao atualizar status do dispositivo:', error);
        }
    }
    async handleDeviceHeartbeat(deviceId) {
        try {
            await database_1.prisma.device.update({
                where: { id: deviceId },
                data: { lastSeen: new Date() }
            });
        }
        catch (error) {
            logger_1.logger.error('Erro ao processar heartbeat:', error);
        }
    }
    async handleDeviceStatus(deviceId, data) {
        logger_1.logger.info(`Status do dispositivo ${deviceId}:`, data);
        this.io.to('admin').emit('device:status-update', {
            deviceId,
            ...data,
            timestamp: new Date()
        });
    }
    async handleVideoPlay(deviceId, data) {
        logger_1.logger.info(`Vídeo iniciado no dispositivo ${deviceId}:`, data);
        await this.recordAnalytics(deviceId, data.videoId, 'VIDEO_START');
        this.io.to('admin').emit('video:started', {
            deviceId,
            ...data,
            timestamp: new Date()
        });
    }
    async handleVideoPause(deviceId, data) {
        logger_1.logger.info(`Vídeo pausado no dispositivo ${deviceId}:`, data);
        await this.recordAnalytics(deviceId, data.videoId, 'VIDEO_PAUSE', data.currentTime);
    }
    async handleVideoEnd(deviceId, data) {
        logger_1.logger.info(`Vídeo finalizado no dispositivo ${deviceId}:`, data);
        await this.recordAnalytics(deviceId, data.videoId, 'VIDEO_END', data.duration);
        this.io.to('admin').emit('video:ended', {
            deviceId,
            ...data,
            timestamp: new Date()
        });
    }
    async recordAnalytics(deviceId, videoId, event, duration) {
        try {
            await database_1.prisma.analytics.create({
                data: {
                    deviceId,
                    videoId,
                    event: event,
                    metadata: JSON.stringify({})
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Erro ao registrar analytics:', error);
        }
    }
    sendToDevice(deviceId, event, payload) {
        const socketId = this.connectedDevices.get(deviceId);
        if (socketId) {
            this.io.to(socketId).emit(event, payload);
            logger_1.logger.info(`Comando enviado para dispositivo ${deviceId}: ${event}`);
        }
        else {
            logger_1.logger.warn(`Dispositivo ${deviceId} não está conectado`);
        }
    }
    broadcastToAllDevices(event, payload) {
        this.connectedDevices.forEach((socketId, deviceId) => {
            this.io.to(socketId).emit(event, payload);
        });
        logger_1.logger.info(`Comando broadcast enviado para todos os dispositivos: ${event}`);
    }
    sendToUser(userId, event, payload) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, payload);
        }
    }
    getConnectedDevices() {
        return Array.from(this.connectedDevices.keys());
    }
    getConnectedUsers() {
        return Array.from(this.connectedUsers.keys());
    }
    isDeviceConnected(deviceId) {
        return this.connectedDevices.has(deviceId);
    }
}
exports.SocketService = SocketService;
let socketService;
function initializeSocket(io) {
    socketService = new SocketService(io);
    return socketService;
}
function getSocketService() {
    if (!socketService) {
        throw new Error('Socket service não foi inicializado');
    }
    return socketService;
}
//# sourceMappingURL=socketService.js.map