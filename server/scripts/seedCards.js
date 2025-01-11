const mongoose = require('mongoose');
const axios = require('axios');
const Card = require('../models/Card');
const path = require('path');

// Load environment variables from the root server directory
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

async function seedCards() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('Missing MONGODB_URI in environment variables');
      console.log('Current directory:', __dirname);
      console.log('Looking for .env file at:', path.resolve(__dirname, '..', '.env'));
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Clear existing cards
    await Card.deleteMany({});
    console.log('Cleared existing cards');

    console.log('Fetching cards from YGOPRODeck API...');
    const response = await axios.get('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    const cards = response.data.data.slice(0, 1000); // Start with first 1000 cards

    console.log('Processing cards...');
    const formattedCards = cards.map(card => {
      const isMonster = card.type.includes('Monster');
      
      const baseCard = {
        name: card.name,
        cardCode: card.id.toString(),
        type: isMonster ? 'Monster' : 
              card.type.includes('Spell') ? 'Spell' : 'Trap',
        description: card.desc,
        image: card.card_images[0].image_url
      };

      // Only add monster-specific fields if it's a monster card
      if (isMonster) {
        return {
          ...baseCard,
          attack: card.atk,
          defense: card.def,
          level: card.level,
          attribute: card.attribute
        };
      }

      return baseCard;
    });

    // Drop the collection and its indexes before inserting
    await mongoose.connection.dropCollection('cards').catch(() => {
      console.log('Collection does not exist, skipping drop');
    });

    // Insert cards in smaller batches to avoid timeout
    const batchSize = 100;
    for (let i = 0; i < formattedCards.length; i += batchSize) {
      const batch = formattedCards.slice(i, i + batchSize);
      await Card.insertMany(batch, { ordered: false });
      console.log(`Inserted cards ${i + 1} to ${Math.min(i + batchSize, formattedCards.length)}`);
    }

    console.log(`Successfully seeded ${formattedCards.length} cards`);

    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error seeding cards:', error);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seedCards(); 