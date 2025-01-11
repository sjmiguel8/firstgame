import React from 'react';
import { Draggable } from 'react-beautiful-dnd';

const DeckList = ({ deck, onRemoveCard, onCardHover }) => {
  return (
    <div className="deck-list">
      {deck.map((card, index) => (
        <Draggable key={index} draggableId={`card-${index}`} index={index}>
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              className="deck-card"
              onMouseEnter={() => onCardHover(card)}
            >
              <img src={card.image} alt={card.name} />
              <button 
                className="remove-card"
                onClick={() => onRemoveCard(index)}
              >
                ×
              </button>
            </div>
          )}
        </Draggable>
      ))}
    </div>
  );
};

export default DeckList; 