const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const app = express();
const server = http.createServer(app);

const corsOriginDelegate = (origin, callback) => {
  if (!origin) return callback(null, true);
  if (process.env.CLIENT_ORIGIN) {
    const list = process.env.CLIENT_ORIGIN.split(',').map(s => s.trim());
    if (list.includes(origin)) return callback(null, origin);
  }
  if (
    origin.endsWith('.onrender.com') ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost') ||
    process.env.NODE_ENV === 'production'
  ) {
    return callback(null, origin);
  }
  return callback(null, origin);
};

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: corsOriginDelegate,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: corsOriginDelegate,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Prometheus Metrics Setup
const promClient = require('prom-client');
const register = new promClient.Registry();

// Collect Node.js default process and system metrics
promClient.collectDefaultMetrics({ register });

// Custom HTTP request duration histogram metric
const httpRequestDurationMicroseconds = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});
register.registerMetric(httpRequestDurationMicroseconds);

// Middleware to track HTTP request metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const routePath = req.route ? (Array.isArray(req.route.path) ? req.route.path.join('|') : req.route.path) : req.path;
    httpRequestDurationMicroseconds
      .labels(req.method, routePath, res.statusCode)
      .observe(duration);
  });
  next();
});

// Prometheus metrics scraping endpoint
app.get(['/metrics', '/api/metrics'], async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err.message || 'Metrics processing error');
  }
});

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get(['/health', '/api/health'], (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: dbState,
    service: 'QuickChat Backend API'
  });
});

// Test endpoint to check if uploads directory is accessible
app.get('/test-uploads', (req, res) => {
  const fs = require('fs');
  const uploadsPath = path.join(__dirname, 'uploads');
  
  fs.readdir(uploadsPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Cannot read uploads directory', details: err.message });
    }
    res.json({ 
      message: 'Uploads directory accessible', 
      files: files,
      path: uploadsPath 
    });
  });
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chatapp')
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/messages', require('./routes/messages'));

// Socket.io connection handling
const connectedUsers = new Map();

// Socket.io authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('✅ User connected:', socket.id, 'User ID:', socket.userId);

  // Test connection
  socket.on('ping', () => {
    console.log('🏓 Ping received from:', socket.id);
    socket.emit('pong');
  });

  // Join user to their personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    console.log(`✅ User ${userId} joined their room. Socket ID: ${socket.id}`);
    console.log(`📋 Current rooms:`, Array.from(socket.rooms));
  });

  // Handle sending messages
  socket.on('sendMessage', async (data) => {
    try {
      const Message = require('./models/Message');
      const User = require('./models/User');
      
      // Use the authenticated user's ID as sender
      const senderId = socket.userId;
      const receiverId = data.receiverId;
      
      // Validate receiver exists
      const receiver = await User.findById(receiverId);
      if (!receiver) {
        throw new Error('Receiver not found');
      }
      
      const newMessage = new Message({
        senderId: senderId,
        receiverId: receiverId,
        text: data.text,
        image: data.image,
        file: data.file,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize
      });
      
      await newMessage.save();
      
      // Populate sender info for the response
      await newMessage.populate('senderId', 'fullName profilePic');
      
      // Ensure image and file URLs are full URLs
      if (newMessage.image && !newMessage.image.startsWith('http')) {
        newMessage.image = process.env.NODE_ENV === 'production' 
          ? `https://chat-app-s-nine.vercel.app${newMessage.image}`
          : `http://localhost:5000${newMessage.image}`;
      }
      if (newMessage.file && !newMessage.file.startsWith('http')) {
        newMessage.file = process.env.NODE_ENV === 'production' 
          ? `https://chat-app-s-nine.vercel.app${newMessage.file}`
          : `http://localhost:5000${newMessage.file}`;
      }
      
      // Emit to receiver
      console.log(`Emitting receiveMessage to room: ${receiverId}`);
      socket.to(receiverId).emit('receiveMessage', newMessage);
      
      // Emit back to sender for confirmation
      console.log(`Emitting messageSent to sender: ${senderId}`);
      socket.emit('messageSent', newMessage);
      
      console.log(`Message sent from ${senderId} to ${receiverId}`);
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', { message: error.message || 'Failed to send message' });
    }
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    socket.to(data.receiverId).emit('userTyping', {
      senderId: socket.userId,
      isTyping: data.isTyping
    });
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Remove user from connected users map
    for (let [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        break;
      }
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
