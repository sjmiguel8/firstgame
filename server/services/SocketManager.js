const socketIO = require('socket.io');
const Game = require('../models/Game');
const User = require('../models/User');
const GameController = require('../controllers/gameController');
const Card = require('../models/Card');

class SocketManager {
  constructor(server) {
    this.io = socketIO(server);
    this.gameRooms = new Map();
    this.setupSocketHandlers();
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Handle matchmaking
      socket.on('findMatch', async (userId) => {
        const waitingPlayers = Array.from(this.gameRooms.values())
          .filter(room => room.status === 'waiting');

        if (waitingPlayers.length > 0) {
          // Join existing game
          const gameRoom = waitingPlayers[0];
          await this.joinGame(socket, gameRoom.gameId, userId);
        } else {
          // Create new game
          await this.createGame(socket, userId);
        }
      });

      // Handle game actions
      socket.on('playCard', async (data) => {
        const { gameId, cardId, position } = data;
        await this.handlePlayCard(socket, gameId, cardId, position);
      });

      socket.on('attack', async (data) => {
        const { gameId, attackingCardId, targetCardId } = data;
        await this.handleAttack(socket, gameId, attackingCardId, targetCardId);
      });

      socket.on('endTurn', async (gameId) => {
        await this.handleEndTurn(socket, gameId);
      });

      socket.on('changePhase', async (data) => {
        const { gameId, newPhase } = data;
        const game = await Game.findById(gameId);
        if (game) {
          await GameController.handlePhaseChange(game, newPhase);
          await game.save();
          this.io.to(gameId).emit('gameUpdated', { game });
        }
      });

      socket.on('summonMonster', async (data) => {
        const { gameId, cardId, position, tribute } = data;
        const game = await Game.findById(gameId);
        if (game) {
          await GameController.summonMonster(game, socket.userId, cardId, position, tribute);
          await game.save();
          this.io.to(gameId).emit('gameUpdated', { game });
        }
      });

      socket.on('activateSpellTrap', async (data) => {
        const { gameId, cardId, targets } = data;
        const game = await Game.findById(gameId);
        if (game) {
          await GameController.activateSpellTrap(game, socket.userId, cardId, targets);
          await game.save();
          this.io.to(gameId).emit('gameUpdated', { game });
        }
      });

      socket.on('reviveCard', async (data) => {
        const { gameId, cardId } = data;
        const game = await Game.findById(gameId);
        if (game) {
          await GameController.reviveFromGraveyard(game, socket.userId, cardId);
          await game.save();
          this.io.to(gameId).emit('gameUpdated', { game });
        }
      });

      socket.on('viewGraveyard', async (data) => {
        const { gameId, playerId } = data;
        const game = await Game.findById(gameId);
        if (game) {
          const player = game.players.find(p => p.user.toString() === playerId);
          if (player) {
            socket.emit('graveyardContents', { 
              graveyard: await Card.find({ _id: { $in: player.graveyard } })
            });
          }
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });
  }

  async createGame(socket, userId) {
    const game = new Game({
      players: [{ user: userId }],
      status: 'waiting'
    });
    await game.save();

    socket.join(game._id.toString());
    this.gameRooms.set(game._id.toString(), {
      gameId: game._id,
      status: 'waiting'
    });

    socket.emit('gameCreated', { gameId: game._id });
  }

  async joinGame(socket, gameId, userId) {
    const game = await Game.findById(gameId);
    if (!game) return;

    game.players.push({ user: userId });
    game.status = 'active';
    await game.save();

    socket.join(gameId);
    this.gameRooms.get(gameId).status = 'active';

    this.io.to(gameId).emit('gameStarted', { game });
  }

  // Add more game logic handlers here
}

module.exports = SocketManager; 