const fs = require('fs');
const path = require('path');

class GameService {
  constructor() {
    this.games = new Map();
    this.rules = this.loadRules();
  }

  loadRules() {
    try {
      const rulesPath = path.join(__dirname, '../data/gameRules.json');
      const rulesData = fs.readFileSync(rulesPath, 'utf8');
      return JSON.parse(rulesData);
    } catch (error) {
      console.error('Failed to load game rules:', error);
      return null;
    }
  }

  initializeGame(playerId, deck) {
    console.log('Initializing game for player:', playerId);
    console.log('Deck:', deck);

    const gameState = {
      players: {
        [playerId]: {
          deck: [...deck.cards],
          hand: [],
          field: Array(5).fill(null),
          spellTrapZone: Array(5).fill(null),
          graveyard: [],
          lifePoints: 8000,
          hasNormalSummoned: false,
          isAI: false
        },
        'ai': {
          deck: this.generateAIDeck(),
          hand: [],
          field: Array(5).fill(null),
          spellTrapZone: Array(5).fill(null),
          graveyard: [],
          lifePoints: 8000,
          hasNormalSummoned: false,
          isAI: true
        }
      },
      currentPhase: 'DRAW_PHASE',
      turn: playerId,
      turnCount: 1,
      lastAction: null
    };

    // Draw initial hands for both players
    for (let i = 0; i < 5; i++) {
      this.drawCard(gameState, playerId);
      this.drawCard(gameState, 'ai');
    }

    console.log('Game initialized:', gameState);
    this.games.set(playerId, gameState);
    return gameState;
  }

  generateAIDeck() {
    // Generate a simple AI deck
    const aiDeck = [];
    for (let i = 0; i < 40; i++) {
      aiDeck.push({
        id: `ai-card-${i}`,
        name: `AI Monster ${i}`,
        type: 'Monster',
        attack: 1000 + Math.floor(Math.random() * 1000),
        defense: 1000 + Math.floor(Math.random() * 1000),
        level: 4,
        attribute: 'DARK',
        description: 'An AI monster'
      });
    }
    return aiDeck;
  }

  handlePhaseChange(playerId, { phase }) {
    const gameState = this.games.get(playerId);
    if (!gameState) return null;

    // Validate phase change according to rules
    if (!this.isValidPhaseChange(gameState.currentPhase, phase)) {
      return null;
    }

    // Execute phase-specific actions
    switch (phase) {
      case 'DRAW_PHASE':
        if (gameState.turnCount > 1) {
          this.drawCard(gameState, playerId);
        }
        break;
      case 'STANDBY_PHASE':
        this.resolveStandbyEffects(gameState);
        break;
      case 'MAIN_PHASE_1':
        gameState.hasNormalSummoned = false;
        break;
      case 'BATTLE_PHASE':
        if (!this.canEnterBattlePhase(gameState)) {
          return null;
        }
        break;
      case 'MAIN_PHASE_2':
        break;
      case 'END_PHASE':
        this.resolveEndPhaseEffects(gameState);
        break;
    }

    gameState.currentPhase = phase;
    return gameState;
  }

  handlePlayCard(playerId, { cardId, position, zone }) {
    const gameState = this.games.get(playerId);
    if (!gameState) return null;

    // Validate card play according to rules
    if (!this.isValidCardPlay(gameState, cardId, position, zone)) {
      return null;
    }

    // Execute card play
    const player = gameState.players[playerId];
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    if (cardIndex === -1) return null;

    const card = player.hand[cardIndex];
    player.hand.splice(cardIndex, 1);

    if (card.type === 'Monster') {
      player.field[zone] = {
        card,
        position,
        canAttack: position === 'attack'
      };
      if (position === 'attack' || position === 'defense') {
        player.hasNormalSummoned = true;
      }
    } else {
      player.spellTrapZone[zone] = {
        card,
        position
      };
    }

    return gameState;
  }

  handleCardPlay(playerId, { cardId, position, zone, zoneType }) {
    const gameState = this.games.get(playerId);
    if (!gameState) return null;

    const player = gameState.players[playerId];
    const cardIndex = player.hand.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) return null;
    
    const card = player.hand[cardIndex];
    
    // Validate play
    if (!this.isValidCardPlay(gameState, card, position, zone, zoneType)) {
      return null;
    }
    
    // Remove card from hand
    player.hand.splice(cardIndex, 1);
    
    // Place card on field
    if (zoneType === 'monster') {
      player.field[zone] = {
        card,
        position,
        canAttack: position === 'attack',
        isFaceDown: position === 'set'
      };
      
      if (position !== 'set') {
        player.hasNormalSummoned = true;
      }
    } else {
      player.spellTrapZone[zone] = {
        card,
        isFaceDown: position === 'set'
      };
    }
    
    return gameState;
  }

  // Helper methods
  isValidPhaseChange(currentPhase, newPhase) {
    const phaseOrder = [
      'DRAW_PHASE',
      'STANDBY_PHASE',
      'MAIN_PHASE_1',
      'BATTLE_PHASE',
      'MAIN_PHASE_2',
      'END_PHASE'
    ];
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const newIndex = phaseOrder.indexOf(newPhase);
    return newIndex === currentIndex + 1;
  }

  drawCard(gameState, playerId) {
    const player = gameState.players[playerId];
    if (player.deck.length === 0) return false;
    const card = player.deck.pop();
    player.hand.push(card);
    return true;
  }

  cleanupGame(playerId) {
    if (this.games.has(playerId)) {
      console.log(`Cleaning up game for player ${playerId}`);
      this.games.delete(playerId);
      return true;
    }
    return false;
  }

  handleEndTurn(playerId) {
    const gameState = this.games.get(playerId);
    if (!gameState) return null;

    gameState.turnCount++;
    gameState.currentPhase = 'DRAW_PHASE';
    gameState.hasNormalSummoned = false;

    return gameState;
  }

  handleDrawCard(playerId) {
    const gameState = this.games.get(playerId);
    if (!gameState) return null;

    const success = this.drawCard(gameState, playerId);
    if (!success) {
      return null;
    }

    return gameState;
  }

  isValidCardPlay(gameState, cardId, position, zone) {
    const player = gameState.players[gameState.turn];
    const card = player.hand.find(c => c.id === cardId);
    
    if (!card) return false;
    
    // Check if it's a valid phase for playing cards
    if (!['MAIN_PHASE_1', 'MAIN_PHASE_2'].includes(gameState.currentPhase)) {
      return false;
    }

    // Check if the zone is empty
    if (card.type === 'Monster' && player.field[zone] !== null) {
      return false;
    }
    if (card.type !== 'Monster' && player.spellTrapZone[zone] !== null) {
      return false;
    }

    // Check normal summon limit
    if (card.type === 'Monster' && 
        (position === 'attack' || position === 'defense') && 
        player.hasNormalSummoned) {
      return false;
    }

    // Use this.rules to validate card plays based on the rules extracted from the PDF
    if (this.rules.summoning.normal.limit > 0 && position === 'normal') {
      // Implement logic based on the rules
    }
    // Additional validation logic...

    return true;
  }

  canEnterBattlePhase(gameState) {
    const player = gameState.players[gameState.turn];
    // Check if player has any monsters that can attack
    return player.field.some(slot => 
      slot && slot.position === 'attack' && slot.canAttack
    );
  }

  resolveStandbyEffects(gameState) {
    // Implement standby phase effects here
    console.log('Resolving standby phase effects');
  }

  resolveEndPhaseEffects(gameState) {
    // Implement end phase effects here
    console.log('Resolving end phase effects');
  }

  // Add more methods as needed based on rules.pdf
}

module.exports = GameService; 