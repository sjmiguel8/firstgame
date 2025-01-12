const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const GameService = require('./services/GameService');
const MatchmakingService = require('./services/MatchmakingService');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
    transports: ['websocket', 'polling']
  }
});

// Debug logging
console.log('Starting server setup...');

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5001"],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ status: 'ok' });
});

// Connect to MongoDB
console.log('Attempting MongoDB connection...');
mongoose.connect(process.env.MONGODB_URI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Routes
app.use('/api/profile', require('./routes/profile'));
app.use('/api/cards', require('./routes/cards'));

// Create a single instance of GameService
const gameService = new GameService();

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('startGame', async (data) => {
    try {
      const gameState = gameService.initializeGame(socket.id, data.deck);
      socket.emit('gameStarted', { game: gameState });
    } catch (error) {
      console.error('Error starting game:', error);
      socket.emit('error', { message: 'Failed to start game' });
    }
  });

  socket.on('change_phase', (data) => {
    try {
      console.log('Changing phase:', data);
      const updatedState = gameService.handlePhaseChange(socket.id, data);
      if (updatedState) {
        socket.emit('game_state', updatedState);
      } else {
        socket.emit('game_error', { message: 'Invalid phase change' });
      }
    } catch (error) {
      console.error('Error changing phase:', error);
      socket.emit('game_error', { message: 'Failed to change phase' });
    }
  });

  socket.on('play_card', (data) => {
    try {
      console.log('Received play_card event:', data);
      const updatedState = gameService.handlePlayCard(socket.id, data);
      if (updatedState) {
        console.log('Card played successfully, emitting new state');
        socket.emit('game_state', updatedState);
      } else {
        console.log('Failed to play card');
        socket.emit('game_error', { message: 'Invalid card play' });
      }
    } catch (error) {
      console.error('Error playing card:', error);
      socket.emit('game_error', { message: 'Failed to play card' });
    }
  });

  socket.on('draw_card', () => {
    try {
      const updatedState = gameService.handleDrawCard(socket.id);
      if (updatedState) {
        socket.emit('game_state', updatedState);
      } else {
        socket.emit('game_error', { message: 'Cannot draw card' });
      }
    } catch (error) {
      console.error('Error drawing card:', error);
      socket.emit('game_error', { message: 'Failed to draw card' });
    }
  });

  socket.on('end_turn', () => {
    try {
      const updatedState = gameService.handleEndTurn(socket.id);
      if (updatedState) {
        socket.emit('game_state', updatedState);
      } else {
        socket.emit('game_error', { message: 'Cannot end turn' });
      }
    } catch (error) {
      console.error('Error ending turn:', error);
      socket.emit('game_error', { message: 'Failed to end turn' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameService.cleanupGame(socket.id);
  });
});

// Add error handling for socket connections
io.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  process.exit(1);
}); 