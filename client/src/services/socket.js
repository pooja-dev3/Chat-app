import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map(); // Track listeners for cleanup
  }

  // Connect to socket server
  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    console.log('Connecting to socket server with token:', token ? 'Token present' : 'No token');

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(SOCKET_URL, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'] // Fallback to polling if websocket fails
    });

    this.socket.on('connect', () => {
      console.log('✅ Connected to socket server with ID:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from socket server. Reason:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.isConnected = false;
    });

    // Test connection
    this.socket.on('pong', () => {
      console.log('🏓 Pong received - connection is working');
    });
  }

  // Disconnect from socket server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join user's personal room
  // Join user to their personal room
  joinUserRoom(userId) {
    if (this.socket && this.isConnected) {
      console.log(`🔗 Joining room for user: ${userId}`);
      this.socket.emit('join', userId);
      
      // Test connection
      setTimeout(() => {
        console.log('🏓 Sending ping to test connection');
        this.socket.emit('ping');
      }, 1000);
    } else {
      console.warn('❌ Cannot join room - socket not connected');
    }
  }

  // Send a message
  sendMessage(messageData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('sendMessage', messageData);
    }
  }

  // Send typing indicator
  sendTyping(receiverId, isTyping) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', {
        receiverId,
        isTyping
      });
    }
  }

  // Listen for new messages
  onReceiveMessage(callback) {
    if (this.socket) {
      this.socket.off('receiveMessage'); // Remove existing listener first
      this.socket.on('receiveMessage', callback);
    }
  }

  // Listen for message sent confirmation
  onMessageSent(callback) {
    if (this.socket) {
      this.socket.off('messageSent'); // Remove existing listener first
      this.socket.on('messageSent', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.off('userTyping'); // Remove existing listener first
      this.socket.on('userTyping', callback);
    }
  }

  // Listen for errors
  onError(callback) {
    if (this.socket) {
      this.socket.off('error'); // Remove existing listener first
      this.socket.on('error', callback);
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return this.isConnected;
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }
}

// Create and export a singleton instance
const socketService = new SocketService();
export default socketService;
