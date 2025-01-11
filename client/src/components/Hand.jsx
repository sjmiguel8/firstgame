import React from 'react';
import Card from './Card';
import '../styles/Hand.css';

const Hand = ({ cards, onCardSelect, selectedCard }) => {
  return (
    <div className="hand">
      {cards.map((card, index) => (
        <div 
          key={`hand-${index}`}
          className="hand-card-wrapper"
          style={{ 
            transform: `rotate(${(index - cards.length/2) * 5}deg)`,
            zIndex: index
          }}
        >
          <Card
            card={card}
            isSelected={selectedCard?._id === card._id}
            onClick={() => onCardSelect(card)}
          />
        </div>
      ))}
    </div>
  );
};

export default Hand; 