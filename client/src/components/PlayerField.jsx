import React from 'react';
import Card from './Card';

const PlayerField = ({ player, isOpponent, onCardSelect, selectedCard }) => {
  return (
    <div className={`player-field ${isOpponent ? 'opponent' : ''}`}>
      <div className="player-info">
        <span className="life-points">LP: {player.lifePoints}</span>
        <span className="deck-count">Deck: {player.deck.length}</span>
      </div>

      <div className="monster-zone">
        {player.field.monsters.map((monster, index) => (
          <Card
            key={`monster-${index}`}
            card={monster.card}
            position={monster.position}
            isFaceDown={monster.isFaceDown}
            isSelected={selectedCard?._id === monster.card._id}
            onClick={() => onCardSelect(monster.card)}
          />
        ))}
      </div>

      <div className="spell-trap-zone">
        {player.field.spellTrap.map((card, index) => (
          <Card
            key={`spell-${index}`}
            card={card.card}
            isFaceDown={card.isFaceDown}
            isSelected={selectedCard?._id === card.card._id}
            onClick={() => onCardSelect(card.card)}
          />
        ))}
      </div>
    </div>
  );
};

export default PlayerField; 