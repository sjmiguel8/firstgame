const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  players: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lifePoints: { type: Number, default: 8000 },
    deck: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
    hand: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
    graveyard: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Card' }],
    field: {
      monsters: [{
        card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
        position: { type: String, enum: ['attack', 'defense'] },
        isFaceDown: { type: Boolean, default: false }
      }],
      spellTrap: [{
        card: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
        isFaceDown: { type: Boolean, default: true }
      }]
    }
  }],
  currentTurn: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed'],
    default: 'waiting'
  },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  currentPhase: {
    type: String,
    enum: ['drawPhase', 'standbyPhase', 'mainPhase1', 'battlePhase', 'mainPhase2', 'endPhase'],
    default: 'drawPhase'
  },
  turnCount: { type: Number, default: 1 },
  normalSummonUsed: { type: Boolean, default: false },
  chainStack: [{
    cardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Card' },
    playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    effect: String
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Game', gameSchema); 