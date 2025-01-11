const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Normal Monster', 'Effect Monster', 'Fusion Monster', 'Ritual Monster', 'Spell', 'Trap'],
    required: true 
  },
  attribute: {
    type: String,
    enum: ['DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'],
    required: function() { return this.type.includes('Monster'); }
  },
  level: {
    type: Number,
    min: 1,
    max: 12,
    required: function() { return this.type.includes('Monster'); }
  },
  attack: {
    type: Number,
    required: function() { return this.type.includes('Monster'); }
  },
  defense: {
    type: Number,
    required: function() { return this.type.includes('Monster'); }
  },
  description: { type: String, required: true },
  image: { type: String, required: true },
  cardCode: { type: String, unique: true },
  releaseDate: Date,
  isLimited: { type: Boolean, default: false },
  isSemiLimited: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false }
});

module.exports = mongoose.model('Card', cardSchema); 