import { io, Socket } from 'socket.io-client';

export interface WebSocketEvents {
  new_log: (data: { timestamp: string; data: any }) => void;
  new_detection: (data: { timestamp: string; data: any }) => void;
  critical_alert: (data: { timestamp: string; data: any }) => void;
  stats_update: (data: { timestamp: string; data: any }) => void;
}

class WebSocketService {
  private socket: Socket | null = null;
  private isConnected = false;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket = io('http://localhost:4000', {
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('[WEBSOCKET] Connected to server');
        this.isConnected = true;
        resolve();
      });

      this.socket.on('disconnect', () => {
        console.log('[WEBSOCKET] Disconnected from server');
        this.isConnected = false;
      });

      this.socket.on('connect_error', (error) => {
        console.error('[WEBSOCKET] Connection error:', error);
        reject(error);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  on<K extends keyof WebSocketEvents>(event: K, callback: WebSocketEvents[K]) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off<K extends keyof WebSocketEvents>(event: K, callback?: WebSocketEvents[K]) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const websocketService = new WebSocketService();