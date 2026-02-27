const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const { Server } = require('socket.io');
require('dotenv').config();

// Passport config
const passport = require('./config/passport');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://realtime-white-board-opal.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Session (needed for Passport OAuth flow)
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // set to true in production with HTTPS
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'https://realtime-white-board-opal.vercel.app',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const authRoutes = require('./routes/auth.routes');
const roomRoutes = require('./routes/room.routes');
const socketHandler = require('./sockets/socketHandler');

// Attach sockets
socketHandler(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('Collaborative Whiteboard API is running...');
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
