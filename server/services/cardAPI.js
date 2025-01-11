const axios = require('axios');
const Card = require('../models/CardData');

const BASE_URL = 'https://db.ygoprodeck.com/api/v7';

class CardAPIService {
  static async fetchAndCacheCards() {
    try {
      const response = await axios.get(`${BASE_URL}/cardinfo.php`);
      const cards = response.data.data.map(card => ({
        name: card.name,
        type: this.mapCardType(card.type),
        attribute: card.attribute,
        level: card.level,
        attack: card.atk,
        defense: card.def,
        description: card.desc,
        image: card.card_images[0].image_url,
        cardCode: card.id.toString(),
        releaseDate: card.misc_info ? new Date(card.misc_info[0].tcg_date) : null,
        isLimited: card.banlist_info?.ban_tcg === 'Limited',
        isSemiLimited: card.banlist_info?.ban_tcg === 'Semi-Limited',
        isBanned: card.banlist_info?.ban_tcg === 'Banned'
      }));

      // Batch insert/update cards
      await Card.bulkWrite(
        cards.map(card => ({
          updateOne: {
            filter: { cardCode: card.cardCode },
            update: { $set: card },
            upsert: true
          }
        }))
      );

      console.log(`Successfully cached ${cards.length} cards`);
      return cards;
    } catch (error) {
      console.error('Error fetching and caching cards:', error);
      throw error;
    }
  }

  static mapCardType(type) {
    const typeMap = {
      'Normal Monster': 'Normal Monster',
      'Effect Monster': 'Effect Monster',
      'Fusion Monster': 'Fusion Monster',
      'Ritual Monster': 'Ritual Monster',
      'Spell Card': 'Spell',
      'Trap Card': 'Trap'
    };
    return typeMap[type] || type;
  }

  static async searchCards(query) {
    try {
      const { term, type, attribute, level } = query;
      let apiUrl = `${BASE_URL}/cardinfo.php?`;

      if (term) apiUrl += `&fname=${encodeURIComponent(term)}`;
      if (type && type !== 'all') apiUrl += `&type=${encodeURIComponent(type)}`;
      if (attribute && attribute !== 'all') apiUrl += `&attribute=${encodeURIComponent(attribute)}`;
      if (level && level !== 'all') apiUrl += `&level=${level}`;

      const response = await axios.get(apiUrl);
      return response.data.data.map(this.transformCardData);
    } catch (error) {
      console.error('Error searching cards:', error);
      // Fallback to database if API fails
      return this.searchLocalCards(query);
    }
  }

  static transformCardData(card) {
    return {
      name: card.name,
      type: this.mapCardType(card.type),
      attribute: card.attribute,
      level: card.level,
      attack: card.atk,
      defense: card.def,
      description: card.desc,
      image: card.card_images[0].image_url,
      cardCode: card.id.toString()
    };
  }

  static async searchLocalCards(query) {
    const { term, type, attribute, level } = query;
    const dbQuery = {};

    if (term) {
      dbQuery.$or = [
        { name: new RegExp(term, 'i') },
        { description: new RegExp(term, 'i') }
      ];
    }
    if (type && type !== 'all') dbQuery.type = type;
    if (attribute && attribute !== 'all') dbQuery.attribute = attribute;
    if (level && level !== 'all') dbQuery.level = parseInt(level);

    return Card.find(dbQuery).limit(50);
  }
}

module.exports = CardAPIService; 