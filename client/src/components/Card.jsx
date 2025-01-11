import React from 'react';
import styled from 'styled-components';
import { cardFlip, cardSummon, cardAttack, cardDestroy, chainLink } from '../utils/animations';

const StyledCard = styled.div`
  /* ... existing styles ... */

  &.summoning {
    animation: ${cardSummon} 0.5s ease-out;
  }

  &.attacking {
    animation: ${cardAttack} 0.5s ease-out;
  }

  &.destroying {
    animation: ${cardDestroy} 0.5s ease-out;
  }

  &.flipping {
    animation: ${cardFlip} 0.5s ease-out;
  }

  &.chain-link {
    animation: ${chainLink} 0.3s ease-out;
  }
`;

const Card = ({ card, position, isFaceDown, isSelected, onClick, animationState }) => {
  const cardClass = `
    card
    ${position || ''}
    ${isFaceDown ? 'face-down' : ''}
    ${isSelected ? 'selected' : ''}
    ${animationState || ''}
  `;

  return (
    <StyledCard className={cardClass} onClick={onClick}>
      {!isFaceDown && (
        <>
          <div className="card-header">
            <span className="card-name">{card.name}</span>
            {card.type === 'Monster' && (
              <span className="card-level">★{card.level}</span>
            )}
          </div>
          {card.type === 'Monster' && (
            <div className="card-stats">
              <span className="attack">ATK/{card.attack}</span>
              <span className="defense">DEF/{card.defense}</span>
            </div>
          )}
          <div className="card-description">{card.description}</div>
        </>
      )}
    </StyledCard>
  );
};

export default Card; 