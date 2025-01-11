const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Profile = require('../models/Profile');

router.get('/:userId', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ userId: req.params.userId });
    
    if (!profile) {
      // Create default profile if none exists
      profile = await Profile.create({
        userId: req.params.userId,
        username: req.user.email.split('@')[0],
        email: req.user.email,
        stats: { wins: 0, losses: 0 }
      });
    }
    
    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 