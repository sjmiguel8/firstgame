class GameService {
  constructor() {
    this.games = new Map();
  }

  initializeGame(playerId, deck) {
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
        ai: {
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
      currentPhase: 'DRAW',
      turn: playerId,
      turnCount: 1,
      lastAction: 'Game started',
      chainStack: [], // For handling card effect chains
      isFirstTurn: true
    };

    // Draw initial hands (5 cards)
    for (let i = 0; i < 5; i++) {
      gameState.players[playerId].hand.push(gameState.players[playerId].deck.shift());
      gameState.players.ai.hand.push(gameState.players.ai.deck.shift());
    }

    this.games.set(playerId, gameState);
    return gameState;
  }

  handleDrawCard(playerId) {
    const gameState = this.games.get(playerId);
    if (!gameState) return null;

    const player = gameState.players[playerId];
    
    // Skip draw on first turn
    if (gameState.isFirstTurn) {
      gameState.isFirstTurn = false;
      gameState.currentPhase = 'MAIN1';
      this.games.set(playerId, gameState);
      return gameState;
    }

    // Normal draw phase
    if (gameState.currentPhase === 'DRAW' && player.deck.length > 0) {
      const drawnCard = player.deck.shift();
      player.hand.push(drawnCard);
      gameState.currentPhase = 'MAIN1';
      player.hasNormalSummoned = false; // Reset normal summon flag
    }

    this.games.set(playerId, gameState);
    return gameState;
  }

  handlePlayCard(playerId, { cardIndex, zoneType, zoneIndex, position, cardType }) {
    console.log('Handling play card:', { playerId, cardIndex, zoneType, zoneIndex, position, cardType });
    
    const gameState = this.games.get(playerId);
    if (!gameState || gameState.turn !== playerId) {
      console.log('Invalid game state or not player turn');
      return null;
    }

    const player = gameState.players[playerId];
    const card = player.hand[cardIndex];

    if (!card) {
      console.log('Card not found in hand');
      return null;
    }

    try {
      if (gameState.currentPhase !== 'MAIN1' && gameState.currentPhase !== 'MAIN2') {
        console.log('Not in main phase');
        return gameState;
      }

      // Check if the zone is already occupied
      const targetZone = zoneType === 'monster' ? player.field : player.spellTrapZone;
      if (targetZone[zoneIndex] !== null) {
        console.log('Zone is occupied');
        return gameState;
      }

      let result;
      if (card.type === 'Monster' && zoneType === 'monster') {
        result = this.handleMonsterSummon(gameState, playerId, cardIndex, zoneIndex, position);
      } else if ((card.type === 'Spell' || card.type === 'Trap') && zoneType === 'spell-trap') {
        result = card.type === 'Spell' ? 
          this.handleSpellPlay(gameState, playerId, cardIndex, zoneIndex, position) :
          this.handleTrapSet(gameState, playerId, cardIndex, zoneIndex);
      }

      if (result) {
        console.log('Card played successfully');
        this.games.set(playerId, result);
        return result;
      }

      console.log('Failed to play card');
      return gameState;
    } catch (error) {
      console.error('Error playing card:', error);
      return gameState;
    }
  }

  isMonsterCard(card) {
    return card.type === 'Monster' || 
           ['Normal', 'Effect', 'Fusion', 'Synchro', 'Xyz', 'Link', 'Pendulum']
           .includes(card.monsterType);
  }

  isSpellCard(card) {
    return card.type === 'Spell';
  }

  isTrapCard(card) {
    return card.type === 'Trap';
  }

  handleMonsterSummon(gameState, playerId, cardIndex, zoneIndex, position) {
    const player = gameState.players[playerId];
    const monster = player.hand[cardIndex];

    // Check if zone is empty
    if (player.field[zoneIndex] !== null) {
      return gameState;
    }

    // Check for Normal Summon availability
    if (player.hasNormalSummoned && !monster.specialSummon) {
      return gameState;
    }

    // Handle tribute summons
    if (monster.level >= 5) {
      const tributesNeeded = monster.level >= 7 ? 2 : 1;
      const availableTributes = player.field.filter(card => card !== null).length;
      
      if (availableTributes < tributesNeeded) {
        return gameState;
      }

      // Remove tributes
      let tributeCount = 0;
      for (let i = 0; i < player.field.length && tributeCount < tributesNeeded; i++) {
        if (player.field[i] !== null) {
          player.graveyard.push(player.field[i]);
          player.field[i] = null;
          tributeCount++;
        }
      }
    }

    // Place monster on field
    player.field[zoneIndex] = {
      ...monster,
      position,
      turnPlayed: gameState.turnCount,
      canAttack: position === 'ATTACK' && !gameState.isFirstTurn
    };

    // Remove from hand and update flags
    player.hand.splice(cardIndex, 1);
    if (!monster.specialSummon) {
      player.hasNormalSummoned = true;
    }

    gameState.lastAction = `${playerId} summoned ${monster.name} in ${position} position`;
    this.games.set(playerId, gameState);
    return gameState;
  }

  handleSpellPlay(gameState, playerId, cardIndex, zoneIndex, position) {
    const player = gameState.players[playerId];
    const spell = player.hand[cardIndex];

    // Check if zone is empty
    if (player.spellTrapZone[zoneIndex] !== null) {
      return gameState;
    }

    // Handle different spell types
    switch (spell.spellType) {
      case 'Normal':
        if (position === 'FACE-UP') {
          // Activate immediately and resolve effect
          this.activateSpellEffect(gameState, playerId, spell);
          player.hand.splice(cardIndex, 1);
          gameState.lastAction = `${playerId} activated ${spell.name}`;
        } else {
          // Set the spell face-down
          player.spellTrapZone[zoneIndex] = {
            ...spell,
            position: 'SET',
            turnPlayed: gameState.turnCount
          };
          player.hand.splice(cardIndex, 1);
          gameState.lastAction = `${playerId} set a Spell card`;
        }
        break;

      case 'Quick-Play':
        // Can be activated immediately or set
        player.spellTrapZone[zoneIndex] = {
          ...spell,
          position: position === 'SET' ? 'SET' : 'FACE-UP',
          turnPlayed: gameState.turnCount,
          canActivate: position === 'SET' ? false : true
        };
        player.hand.splice(cardIndex, 1);
        if (position === 'FACE-UP') {
          this.activateSpellEffect(gameState, playerId, spell);
          gameState.lastAction = `${playerId} activated ${spell.name}`;
        } else {
          gameState.lastAction = `${playerId} set a Quick-Play Spell`;
        }
        break;

      case 'Continuous':
      case 'Field':
        // Place on field and apply continuous effect
        player.spellTrapZone[zoneIndex] = {
          ...spell,
          position: position === 'SET' ? 'SET' : 'FACE-UP',
          turnPlayed: gameState.turnCount
        };
        player.hand.splice(cardIndex, 1);
        if (position === 'FACE-UP') {
          this.applyContinuousEffect(gameState, playerId, spell);
          gameState.lastAction = `${playerId} activated ${spell.name}`;
        } else {
          gameState.lastAction = `${playerId} set a Continuous Spell`;
        }
        break;

      default:
        return gameState;
    }

    this.games.set(playerId, gameState);
    return gameState;
  }

  handleTrapSet(gameState, playerId, cardIndex, zoneIndex) {
    const player = gameState.players[playerId];
    const trap = player.hand[cardIndex];

    // Traps can only be set initially
    if (player.spellTrapZone[zoneIndex] === null) {
      player.spellTrapZone[zoneIndex] = {
        ...trap,
        position: 'SET',
        turnPlayed: gameState.turnCount,
        canActivate: false // Can't activate trap the turn it's set
      };
      player.hand.splice(cardIndex, 1);
      gameState.lastAction = `${playerId} set a Trap card`;
    }

    this.games.set(playerId, gameState);
    return gameState;
  }

  activateSpellEffect(gameState, playerId, spell) {
    // Implement spell effects based on card type
    switch (spell.name) {
      // Add specific spell card effects here
      default:
        console.log(`Activating spell effect: ${spell.name}`);
    }
  }

  applyContinuousEffect(gameState, playerId, spell) {
    // Implement continuous effects
    switch (spell.name) {
      // Add specific continuous effects here
      default:
        console.log(`Applying continuous effect: ${spell.name}`);
    }
  }

  canActivateTrap(gameState, playerId, trapIndex, trigger) {
    const player = gameState.players[playerId];
    const trap = player.spellTrapZone[trapIndex];

    if (!trap || trap.position !== 'SET' || !trap.canActivate) {
      return false;
    }

    // Check if the trigger matches the trap's activation conditions
    switch (trap.trapType) {
      case 'Normal':
        // Check normal trap conditions
        return true;
      case 'Counter':
        // Check if responding to spell/trap activation
        return trigger.type === 'SPELL_ACTIVATION' || trigger.type === 'TRAP_ACTIVATION';
      case 'Continuous':
        // Check continuous trap conditions
        return true;
      default:
        return false;
    }
  }

  getTributeCount(level) {
    if (level >= 7) return 2;
    if (level >= 5) return 1;
    return 0;
  }

  handleBattlePhase(playerId) {
    const gameState = this.games.get(playerId);
    if (!gameState || gameState.isFirstTurn) return null;

    gameState.currentPhase = 'BATTLE';
    this.games.set(playerId, gameState);
    return gameState;
  }

  handleAttack(playerId, { attackingMonsterIndex, targetMonsterIndex }) {
    const gameState = this.games.get(playerId);
    if (!gameState || gameState.currentPhase !== 'BATTLE') return null;

    const attacker = gameState.players[playerId];
    const defender = gameState.players[playerId === 'ai' ? gameState.players[0] : 'ai'];
    
    const attackingMonster = attacker.field[attackingMonsterIndex];
    const targetMonster = targetMonsterIndex !== null ? defender.field[targetMonsterIndex] : null;

    // Check if monster can attack
    if (!attackingMonster || !attackingMonster.canAttack || attackingMonster.position !== 'ATTACK') {
      return gameState;
    }

    // Direct attack
    if (targetMonster === null) {
      defender.lifePoints -= attackingMonster.attack;
      gameState.lastAction = `${playerId} attacked directly for ${attackingMonster.attack} damage`;
    } else {
      // Monster battle
      if (targetMonster.position === 'ATTACK') {
        // Both in attack position
        const difference = attackingMonster.attack - targetMonster.attack;
        if (difference > 0) {
          defender.lifePoints -= difference;
          defender.field[targetMonsterIndex] = null;
          gameState.lastAction = `${attackingMonster.name} destroyed ${targetMonster.name}`;
        } else if (difference < 0) {
          attacker.lifePoints += difference;
          attacker.field[attackingMonsterIndex] = null;
          gameState.lastAction = `${targetMonster.name} destroyed ${attackingMonster.name}`;
        } else {
          // Both monsters are destroyed
          attacker.field[attackingMonsterIndex] = null;
          defender.field[targetMonsterIndex] = null;
          gameState.lastAction = 'Both monsters were destroyed';
        }
      } else {
        // Target in defense position
        if (attackingMonster.attack > targetMonster.defense) {
          defender.field[targetMonsterIndex] = null;
          gameState.lastAction = `${attackingMonster.name} destroyed ${targetMonster.name}`;
        } else if (attackingMonster.attack < targetMonster.defense) {
          attacker.lifePoints -= (targetMonster.defense - attackingMonster.attack);
          gameState.lastAction = `${playerId} took ${targetMonster.defense - attackingMonster.attack} damage`;
        }
      }
    }

    // Mark monster as having attacked
    if (attackingMonster) {
      attackingMonster.canAttack = false;
    }

    this.games.set(playerId, gameState);
    return gameState;
  }

  handleEndTurn(playerId) {
    const gameState = this.games.get(playerId);
    if (!gameState) return null;

    // Clean up phase effects
    const currentPlayer = gameState.players[playerId];
    currentPlayer.hasNormalSummoned = false;

    // Switch turns
    gameState.turn = gameState.turn === playerId ? 'ai' : playerId;
    gameState.currentPhase = 'DRAW';
    gameState.turnCount++;

    if (gameState.turn === 'ai') {
      this.handleAITurn(playerId);
    }

    this.games.set(playerId, gameState);
    return gameState;
  }

  generateAIDeck() {
    // Create a varied AI deck instead of all Blue-Eyes
    const aiDeck = [];
    
    // Add some basic monsters
    for (let i = 0; i < 20; i++) {
      aiDeck.push({
        name: `AI Monster ${i}`,
        type: 'Monster',
        attack: 1000 + (Math.floor(Math.random() * 1000)),
        defense: 1000 + (Math.floor(Math.random() * 1000)),
        level: Math.floor(Math.random() * 4) + 1, // Levels 1-4
        attribute: 'DARK',
        image: 'https://images.ygoprodeck.com/images/cards/4614116.jpg', // Changed to a smaller monster card
        description: 'AI Monster'
      });
    }
    
    // Add some spell cards
    for (let i = 0; i < 10; i++) {
      aiDeck.push({
        name: `AI Spell ${i}`,
        type: 'Spell',
        image: 'https://images.ygoprodeck.com/images/cards/24094653.jpg', // Basic spell card
        description: 'AI Spell Card'
      });
    }
    
    // Add some trap cards
    for (let i = 0; i < 10; i++) {
      aiDeck.push({
        name: `AI Trap ${i}`,
        type: 'Trap',
        image: 'https://images.ygoprodeck.com/images/cards/4440873.jpg', // Basic trap card
        description: 'AI Trap Card'
      });
    }
    
    return aiDeck;
  }

  handleAITurn(playerId) {
    const gameState = this.games.get(playerId);
    const ai = gameState.players.ai;

    // AI Draw Phase
    if (ai.deck.length > 0) {
      const drawnCard = ai.deck.shift();
      ai.hand.push(drawnCard);
      gameState.lastAction = 'AI drew a card';
    }

    // AI Main Phase 1
    gameState.currentPhase = 'MAIN1';
    
    // AI plays cards (simple logic)
    if (ai.hand.length > 0) {
      const emptyZones = ai.field.reduce((acc, zone, index) => {
        if (zone === null) acc.push(index);
        return acc;
      }, []);

      if (emptyZones.length > 0) {
        // Try to play a monster first
        const monsterCard = ai.hand.find(card => card.type === 'Monster');
        if (monsterCard) {
          const zoneIndex = emptyZones[0];
          const cardIndex = ai.hand.indexOf(monsterCard);
          ai.field[zoneIndex] = monsterCard;
          ai.hand.splice(cardIndex, 1);
          gameState.lastAction = `AI played ${monsterCard.name}`;
        }
      }
    }

    // Go through all phases
    ['STANDBY', 'MAIN1', 'BATTLE', 'MAIN2', 'END'].forEach(phase => {
      gameState.currentPhase = phase;
    });

    // End AI turn
    gameState.turn = playerId;
    gameState.currentPhase = 'DRAW';
    
    this.games.set(playerId, gameState);
    return gameState;
  }

  cleanupGame(playerId) {
    this.games.delete(playerId);
  }

  emitGameState(playerId, gameState) {
    // This method should be implemented in your socket handling code
    // to emit game state updates to the client
  }

  handlePhaseChange(playerId, { phase }) {
    const gameState = this.games.get(playerId);
    if (!gameState || gameState.turn !== playerId) return null;

    // Define valid phase transitions
    const validPhaseTransitions = {
      'DRAW': 'MAIN1',
      'MAIN1': 'BATTLE',
      'BATTLE': 'MAIN2',
      'MAIN2': 'END'
    };

    // Verify valid phase transition
    if (validPhaseTransitions[gameState.currentPhase] !== phase) {
      return gameState;
    }

    // Update phase
    gameState.currentPhase = phase;
    gameState.lastAction = `Phase changed to ${phase}`;

    // Handle phase-specific logic
    switch (phase) {
      case 'BATTLE':
        // Reset attack flags at start of Battle Phase
        Object.values(gameState.players).forEach(player => {
          player.field.forEach(monster => {
            if (monster && monster.position === 'ATTACK') {
              monster.canAttack = true;
            }
          });
        });
        break;
      case 'END':
        // Handle end phase effects then move to next turn
        this.handleEndTurn(playerId);
        break;
    }

    this.games.set(playerId, gameState);
    return gameState;
  }

  // Add more game logic methods...
}

module.exports = GameService; 