import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  deviceId?: string;
  userRole?: string;
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

class SocketService {
  private io: SocketIOServer;
  private connectedDevices: Map<string, string> = new Map(); // deviceId -> socketId
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const deviceId = socket.handshake.auth.deviceId;

        if (deviceId) {
          // Conexão de dispositivo TV
          const device = await prisma.device.findUnique({
            where: { id: deviceId }
          });

          if (!device) {
            return next(new Error('Dispositivo não encontrado'));
          }

          socket.deviceId = deviceId;
          logger.info(`Dispositivo conectado: ${deviceId}`);
        } else if (token) {
          // Conexão de usuário autenticado
          const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
          
          const user = await prisma.user.findUnique({
            where: { id: decoded.id }
          });

          if (!user) { // Removido isActive pois não existe no schema
            return next(new Error('Usuário não autorizado'));
          }

          socket.userId = user.id;
          socket.userRole = user.role;
          logger.info(`Usuário conectado: ${user.email}`);
        } else {
          return next(new Error('Token ou deviceId requerido'));
        }

        next();
      } catch (error) {
        logger.error('Erro na autenticação do socket:', error);
        next(new Error('Falha na autenticação'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      logger.info(`Socket conectado: ${socket.id}`);

      // Registrar conexão
      if (socket.deviceId) {
        this.connectedDevices.set(socket.deviceId, socket.id);
        this.updateDeviceStatus(socket.deviceId, 'ONLINE');
        socket.join(`device:${socket.deviceId}`);
      }

      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        socket.join(`user:${socket.userId}`);
        
        // Usuários admin podem se juntar ao canal de administração
        if (socket.userRole === 'ADMIN') {
          socket.join('admin');
        }
      }

      // Event handlers para dispositivos
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

      // Event handlers para usuários admin
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

      // Desconexão
      socket.on('disconnect', () => {
        logger.info(`Socket desconectado: ${socket.id}`);

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

  private async updateDeviceStatus(deviceId: string, status: 'ONLINE' | 'OFFLINE') {
    try {
      await prisma.device.update({
        where: { id: deviceId },
        data: {
          lastSeen: new Date()
        }
      });

      // Notificar admins sobre mudança de status
      this.io.to('admin').emit('device:status-changed', {
        deviceId,
        status,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Erro ao atualizar status do dispositivo:', error);
    }
  }

  private async handleDeviceHeartbeat(deviceId: string) {
    try {
      await prisma.device.update({
        where: { id: deviceId },
        data: { lastSeen: new Date() }
      });
    } catch (error) {
      logger.error('Erro ao processar heartbeat:', error);
    }
  }

  private async handleDeviceStatus(deviceId: string, data: any) {
    logger.info(`Status do dispositivo ${deviceId}:`, data);
    
    // Notificar admins
    this.io.to('admin').emit('device:status-update', {
      deviceId,
      ...data,
      timestamp: new Date()
    });
  }

  private async handleVideoPlay(deviceId: string, data: any) {
    logger.info(`Vídeo iniciado no dispositivo ${deviceId}:`, data);
    
    // Registrar analytics
    await this.recordAnalytics(deviceId, data.videoId, 'VIDEO_START');
    
    // Notificar admins
    this.io.to('admin').emit('video:started', {
      deviceId,
      ...data,
      timestamp: new Date()
    });
  }

  private async handleVideoPause(deviceId: string, data: any) {
    logger.info(`Vídeo pausado no dispositivo ${deviceId}:`, data);
    
    await this.recordAnalytics(deviceId, data.videoId, 'VIDEO_PAUSE', data.currentTime);
  }

  private async handleVideoEnd(deviceId: string, data: any) {
    logger.info(`Vídeo finalizado no dispositivo ${deviceId}:`, data);
    
    await this.recordAnalytics(deviceId, data.videoId, 'VIDEO_END', data.duration);
    
    // Notificar admins
    this.io.to('admin').emit('video:ended', {
      deviceId,
      ...data,
      timestamp: new Date()
    });
  }

  private async recordAnalytics(deviceId: string, videoId: string, event: string, duration?: number) {
    try {
      await prisma.analytics.create({
        data: {
          deviceId,
          videoId,
          event: event as any,
          metadata: JSON.stringify({}) // Corrigido para string JSON
        }
      });
    } catch (error) {
      logger.error('Erro ao registrar analytics:', error);
    }
  }

  // Métodos públicos para envio de comandos
  public sendToDevice(deviceId: string, event: string, payload: any) {
    const socketId = this.connectedDevices.get(deviceId);
    if (socketId) {
      this.io.to(socketId).emit(event, payload);
      logger.info(`Comando enviado para dispositivo ${deviceId}: ${event}`);
    } else {
      logger.warn(`Dispositivo ${deviceId} não está conectado`);
    }
  }

  public broadcastToAllDevices(event: string, payload: any) {
    this.connectedDevices.forEach((socketId, deviceId) => {
      this.io.to(socketId).emit(event, payload);
    });
    logger.info(`Comando broadcast enviado para todos os dispositivos: ${event}`);
  }

  public sendToUser(userId: string, event: string, payload: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, payload);
    }
  }

  public getConnectedDevices(): string[] {
    return Array.from(this.connectedDevices.keys());
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  public isDeviceConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }
}

let socketService: SocketService;

export function initializeSocket(io: SocketIOServer): SocketService {
  socketService = new SocketService(io);
  return socketService;
}

export function getSocketService(): SocketService {
  if (!socketService) {
    throw new Error('Socket service não foi inicializado');
  }
  return socketService;
}

export { SocketService };
