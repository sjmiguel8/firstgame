const Game = require('../models/Game');
const Card = require('../models/Card');

class GameController {
  static async initializeGame(game) {
    // Shuffle and deal initial hands
    for (let player of game.players) {
      player.hand = await this.drawCards(player.deck, 5);
      player.lifePoints = 8000;
    }
    return game;
  }

  static async drawCards(deck, count) {
    const cards = [...deck];
    const hand = [];
    for (let i = 0; i < count && cards.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * cards.length);
      hand.push(cards.splice(randomIndex, 1)[0]);
    }
    return hand;
  }

  static async playCard(game, playerId, cardId, position) {
    const player = game.players.find(p => p.user.toString() === playerId);
    if (!player) throw new Error('Player not found');

    const cardIndex = player.hand.findIndex(c => c.toString() === cardId);
    if (cardIndex === -1) throw new Error('Card not in hand');

    const card = await Card.findById(cardId);
    if (!card) throw new Error('Card not found');

    // Remove card from hand
    player.hand.splice(cardIndex, 1);

    // Add card to appropriate field
    if (card.type === 'Monster') {
      player.field.monsters.push({
        card: cardId,
        position,
        isFaceDown: position === 'defense'
      });
    } else {
      player.field.spellTrap.push({
        card: cardId,
        isFaceDown: true
      });
    }

    return game;
  }

  static async handleAttack(game, attackingCardId, targetCardId) {
    const attacker = await this.findCardOnField(game, attackingCardId);
    const target = await this.findCardOnField(game, targetCardId);
    
    if (!attacker || !target) {
      throw new Error('Invalid attack target');
    }

    const attackerCard = await Card.findById(attackingCardId);
    const targetCard = await Card.findById(targetCardId);

    let damage = 0;
    if (target.position === 'attack') {
      damage = attackerCard.attack - targetCard.attack;
      if (damage > 0) {
        // Target destroyed, damage to opponent
        target.player.lifePoints -= damage;
        this.destroyCard(game, targetCardId);
      } else if (damage < 0) {
        // Attacker destroyed, damage to player
        attacker.player.lifePoints += damage;
        this.destroyCard(game, attackingCardId);
      } else {
        // Both destroyed
        this.destroyCard(game, targetCardId);
        this.destroyCard(game, attackingCardId);
      }
    } else {
      // Defense position battle
      if (attackerCard.attack > targetCard.defense) {
        this.destroyCard(game, targetCardId);
      } else if (attackerCard.attack < targetCard.defense) {
        attacker.player.lifePoints -= (targetCard.defense - attackerCard.attack);
      }
    }

    return game;
  }

  static async destroyCard(game, cardId, options = { sendToGraveyard: true }) {
    for (const player of game.players) {
      // Check monsters
      const monsterIndex = player.field.monsters.findIndex(m => 
        m.card.toString() === cardId
      );
      if (monsterIndex !== -1) {
        const destroyedCard = player.field.monsters.splice(monsterIndex, 1)[0];
        if (options.sendToGraveyard) {
          player.graveyard.push(destroyedCard.card);
        }
        continue;
      }

      // Check spell/traps
      const spellTrapIndex = player.field.spellTrap.findIndex(s => 
        s.card.toString() === cardId
      );
      if (spellTrapIndex !== -1) {
        const destroyedCard = player.field.spellTrap.splice(spellTrapIndex, 1)[0];
        if (options.sendToGraveyard) {
          player.graveyard.push(destroyedCard.card);
        }
      }
    }
  }

  static async findCardOnField(game, cardId) {
    for (const player of game.players) {
      const monsterCard = player.field.monsters.find(m => 
        m.card.toString() === cardId
      );
      if (monsterCard) return { card: monsterCard, player };

      const spellTrapCard = player.field.spellTrap.find(s => 
        s.card.toString() === cardId
      );
      if (spellTrapCard) return { card: spellTrapCard, player };
    }
    return null;
  }

  static async handlePhaseChange(game, newPhase) {
    const validPhaseTransitions = {
      drawPhase: 'standbyPhase',
      standbyPhase: 'mainPhase1',
      mainPhase1: 'battlePhase',
      battlePhase: 'mainPhase2',
      mainPhase2: 'endPhase',
      endPhase: 'drawPhase'
    };

    if (validPhaseTransitions[game.currentPhase] !== newPhase) {
      throw new Error('Invalid phase transition');
    }

    game.currentPhase = newPhase;

    // Handle phase-specific effects
    switch (newPhase) {
      case 'drawPhase':
        if (game.turnCount > 1) { // First player doesn't draw on first turn
          await this.drawCard(game, game.players[game.currentTurn]);
        }
        break;
      case 'endPhase':
        game.normalSummonUsed = false;
        if (game.currentTurn === game.players.length - 1) {
          game.turnCount++;
        }
        game.currentTurn = (game.currentTurn + 1) % game.players.length;
        break;
    }

    return game;
  }

  static async summonMonster(game, playerId, cardId, position, tribute = []) {
    const player = game.players.find(p => p.user.toString() === playerId);
    const card = await Card.findById(cardId);

    if (!card || card.type !== 'Monster') {
      throw new Error('Invalid card for summoning');
    }

    // Check if normal summon is available
    if (!game.normalSummonUsed && position !== 'special') {
      // Handle tributes for high-level monsters
      if (card.level >= 5) {
        const requiredTributes = card.level >= 7 ? 2 : 1;
        if (tribute.length !== requiredTributes) {
          throw new Error(`Need ${requiredTributes} tribute(s) for this summon`);
        }
        
        // Remove tribute monsters from field
        for (const tributeId of tribute) {
          player.field.monsters = player.field.monsters.filter(m => 
            m.card.toString() !== tributeId
          );
        }
      }
      
      game.normalSummonUsed = true;
    } else if (position !== 'special') {
      throw new Error('Normal summon already used this turn');
    }

    // Add monster to field
    player.field.monsters.push({
      card: cardId,
      position: position === 'special' ? 'attack' : position,
      isFaceDown: position === 'defense'
    });

    return game;
  }

  static async activateSpellTrap(game, playerId, cardId, targets = []) {
    const player = game.players.find(p => p.user.toString() === playerId);
    const card = await Card.findById(cardId);

    if (!card || !['Spell', 'Trap'].includes(card.type)) {
      throw new Error('Invalid spell/trap card');
    }

    // Add to chain stack
    game.chainStack.push({
      cardId,
      playerId,
      effect: card.effect
    });

    // Resolve chain if no response
    await this.resolveChain(game);

    return game;
  }

  static async resolveChain(game) {
    // Resolve effects in LIFO order
    while (game.chainStack.length > 0) {
      const effect = game.chainStack.pop();
      await this.resolveEffect(game, effect);
    }
    return game;
  }

  static async resolveEffect(game, effect) {
    const card = await Card.findById(effect.cardId);
    const player = game.players.find(p => p.user.toString() === effect.playerId);
    
    switch (card.effect.type) {
      case 'destroy':
        // Handle destruction effects (like Dark Hole)
        for (const targetId of effect.targets) {
          await this.destroyCard(game, targetId);
        }
        break;

      case 'draw':
        // Handle draw effects (like Pot of Greed)
        const drawCount = card.effect.count || 1;
        const drawnCards = await this.drawCards(player.deck, drawCount);
        player.hand.push(...drawnCards);
        break;

      case 'specialSummon':
        // Handle special summon from various locations
        const location = card.effect.location; // 'hand', 'deck', 'graveyard'
        const target = card.effect.target; // target card ID or conditions
        await this.handleSpecialSummon(game, player, location, target);
        break;

      case 'returnToHand':
        // Handle bounce effects
        for (const targetId of effect.targets) {
          const targetCard = await this.findCardOnField(game, targetId);
          if (targetCard) {
            await this.destroyCard(game, targetId, { sendToGraveyard: false });
            targetCard.player.hand.push(targetId);
          }
        }
        break;

      case 'banish':
        // Handle banish effects
        for (const targetId of effect.targets) {
          await this.destroyCard(game, targetId, { sendToGraveyard: false });
        }
        break;
    }
  }

  static async handleSpecialSummon(game, player, location, target) {
    let cardToSummon;

    switch (location) {
      case 'hand':
        cardToSummon = player.hand.find(c => c.toString() === target);
        if (cardToSummon) {
          player.hand = player.hand.filter(c => c.toString() !== target);
        }
        break;

      case 'graveyard':
        cardToSummon = player.graveyard.find(c => c.toString() === target);
        if (cardToSummon) {
          player.graveyard = player.graveyard.filter(c => c.toString() !== target);
        }
        break;

      case 'deck':
        // Handle searching deck and special summoning
        const card = player.deck.find(c => c.toString() === target);
        if (card) {
          cardToSummon = card;
          player.deck = player.deck.filter(c => c.toString() !== target);
        }
        break;
    }

    if (cardToSummon) {
      player.field.monsters.push({
        card: cardToSummon,
        position: 'attack',
        isFaceDown: false
      });
    }
  }

  static async reviveFromGraveyard(game, playerId, cardId) {
    const player = game.players.find(p => p.user.toString() === playerId);
    const cardIndex = player.graveyard.findIndex(c => c.toString() === cardId);
    
    if (cardIndex === -1) {
      throw new Error('Card not found in graveyard');
    }

    const card = await Card.findById(cardId);
    if (!card) {
      throw new Error('Invalid card');
    }

    // Remove from graveyard
    player.graveyard.splice(cardIndex, 1);

    // Special summon to field
    if (card.type === 'Monster') {
      player.field.monsters.push({
        card: cardId,
        position: 'attack',
        isFaceDown: false
      });
    } else {
      player.field.spellTrap.push({
        card: cardId,
        isFaceDown: false
      });
    }

    return game;
  }
}

module.exports = GameController; 