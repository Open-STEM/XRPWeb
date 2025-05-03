import { io, Socket } from 'socket.io-client';
import { parseSensorData } from '@/utils/sensorParsers';

class SocketService {
  private socket: Socket | null = null;
  private url: string;
  private connected: boolean = false;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map(); // eslint-disable-line @typescript-eslint/no-explicit-any

  constructor(url: string = 'http://localhost:5001') {
    this.url = url;
    this.eventHandlers = new Map();
  }

  connect(): void {
    if (this.socket) {
      return; // Already connected
    }

    this.socket = io(this.url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
      this.notifyEventHandlers('connect', null);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      this.connected = false;
      this.notifyEventHandlers('disconnect', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.notifyEventHandlers('error', error);
    });

    // Listen for data updates from server and parse them
    this.socket.on('data_update', (rawData) => {
      const parsedData = parseSensorData(rawData);
      if (parsedData) {
        this.notifyEventHandlers('data_update', parsedData);
      }
    });
  }

  private notifyEventHandlers(event: string, data: any): void { // eslint-disable-line @typescript-eslint/no-explicit-any
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in ${event} handler:`, error);
        }
      });
    }
  }

  // Subscribe to an event
  on(event: string, callback: (data: any) => void): () => void { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    const handlers = this.eventHandlers.get(event)!;
    handlers.add(callback);

    // Return unsubscribe function
    return () => {
      if (handlers.has(callback)) {
        handlers.delete(callback);
      }
    };
  }

  // Request data from sensors
  requestSensorData(sensors: string[]): void {
    if (this.socket && this.connected) {
      this.socket.emit('send_data', { data: sensors });
    } else {
      console.warn('Cannot request data: socket not connected');
    }
  }


  // Get random data from sensors
  getRandomSensorData(): void {
    if (this.socket && this.connected) {
      this.socket.emit('start_data');
    } else {
      console.warn('Cannot request data: socket not connected');
    }
  }

  // Get random data from sensors
  stopData(): void {
    if (this.socket && this.connected) {
      this.socket.emit('stop_data');
    } else {
      console.warn('Cannot request data: socket not connected');
    }
  }

  // Check if connected
  isConnected(): boolean {
    return this.connected;
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }
}

// Create singleton instance
const socketService = new SocketService();
export default socketService;