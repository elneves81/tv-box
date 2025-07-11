import { Server as SocketIOServer } from 'socket.io';
declare class SocketService {
    private io;
    private connectedDevices;
    private connectedUsers;
    constructor(io: SocketIOServer);
    private setupMiddleware;
    private setupEventHandlers;
    private updateDeviceStatus;
    private handleDeviceHeartbeat;
    private handleDeviceStatus;
    private handleVideoPlay;
    private handleVideoPause;
    private handleVideoEnd;
    private recordAnalytics;
    sendToDevice(deviceId: string, event: string, payload: any): void;
    broadcastToAllDevices(event: string, payload: any): void;
    sendToUser(userId: string, event: string, payload: any): void;
    getConnectedDevices(): string[];
    getConnectedUsers(): string[];
    isDeviceConnected(deviceId: string): boolean;
}
export declare function initializeSocket(io: SocketIOServer): SocketService;
export declare function getSocketService(): SocketService;
export { SocketService };
//# sourceMappingURL=socketService.d.ts.map