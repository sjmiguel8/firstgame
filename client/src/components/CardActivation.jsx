import React from 'react';
import '../styles/CardActivation.css';

const CardActivation = ({ card, onActivate, onCancel, targets, onTargetSelect }) => {
  const positions = ['attack', 'defense', 'facedown'];

  return (
    <div className="card-activation-overlay">
      <div className="activation-modal">
        <h3>{card.name}</h3>
        {card.type === 'Monster' ? (
          <div className="summon-options">
            <h4>Select Position</h4>
            <div className="position-buttons">
              {positions.map(position => (
                <button
                  key={position}
                  onClick={() => onActivate(position)}
                  className="position-button"
                >
                  {position.charAt(0).toUpperCase() + position.slice(1)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="spell-trap-options">
            {targets && targets.length > 0 && (
              <div className="target-selection">
                <h4>Select Target(s)</h4>
                <div className="targets-grid">
                  {targets.map(target => (
                    <div
                      key={target._id}
                      onClick={() => onTargetSelect(target)}
                      className="target-card"
                    >
                      {target.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => onActivate('activate')} className="activate-button">
              Activate
            </button>
          </div>
        )}
        <button onClick={onCancel} className="cancel-button">Cancel</button>
      </div>
    </div>
  );
};

export default CardActivation; 