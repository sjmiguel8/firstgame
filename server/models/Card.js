const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  cardCode: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Monster', 'Spell', 'Trap']
  },
  description: {
    type: String,
    required: true
  },
  attack: {
    type: Number,
    required: function() { 
      return this.type === 'Monster';
    },
    default: null
  },
  defense: {
    type: Number,
    required: function() { 
      return this.type === 'Monster';
    },
    default: null
  },
  level: {
    type: Number,
    required: function() { 
      return this.type === 'Monster';
    },
    default: null
  },
  attribute: {
    type: String,
    required: function() { 
      return this.type === 'Monster';
    },
    default: null
  },
  image: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Card', cardSchema); 