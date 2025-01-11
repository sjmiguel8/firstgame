const CardAPIService = require('../services/cardAPI');
const mongoose = require('mongoose');
require('dotenv').config();

async function initializeCardDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Starting card database initialization...');
    await CardAPIService.fetchAndCacheCards();
    console.log('Card database initialization complete!');

    process.exit(0);
  } catch (error) {
    console.error('Error initializing card database:', error);
    process.exit(1);
  }
}

initializeCardDatabase(); 