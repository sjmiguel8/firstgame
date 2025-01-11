const express = require('express');
const router = express.Router();
const Card = require('../models/Card');
const auth = require('../middleware/auth');

// Search cards
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      // Return some default cards if no query
      const cards = await Card.find().limit(20);
      return res.json(cards);
    }

    const cards = await Card.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }).limit(20);

    res.json(cards);
  } catch (error) {
    console.error('Card search error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get card by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const card = await Card.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(card);
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 