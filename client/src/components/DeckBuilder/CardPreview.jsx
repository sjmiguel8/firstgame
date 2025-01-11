import React from 'react';
import styled from 'styled-components';
import '../../styles/CardPreview.css';

const PreviewContainer = styled.div`
  position: sticky;
  top: 20px;
  padding: 15px;
  background: #2a2a2a;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const CardPreview = ({ card }) => {
  if (!card) return <div className="preview-placeholder">Select a card to preview</div>;

  return (
    <PreviewContainer>
      <div className="preview-image">
        <img src={card.image} alt={card.name} />
      </div>
      <div className="preview-details">
        <h3 className="preview-name">{card.name}</h3>
        {card.type === 'Monster' && (
          <div className="preview-stats">
            <div className="stat">
              <span className="label">Level:</span>
              <span className="value">{'★'.repeat(card.level)}</span>
            </div>
            <div className="stat">
              <span className="label">Attribute:</span>
              <span className="value">{card.attribute}</span>
            </div>
            <div className="stat">
              <span className="label">ATK/DEF:</span>
              <span className="value">{card.attack}/{card.defense}</span>
            </div>
          </div>
        )}
        <div className="preview-type">[{card.type}]</div>
        <p className="preview-description">{card.description}</p>
      </div>
    </PreviewContainer>
  );
};

export default CardPreview; 