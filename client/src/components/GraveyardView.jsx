import React, { useState, useEffect } from 'react';
import Card from './Card';
import '../styles/GraveyardView.css';

const GraveyardView = ({ playerId, gameId, socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [graveyardCards, setGraveyardCards] = useState([]);

  useEffect(() => {
    socket.on('graveyardContents', ({ graveyard }) => {
      setGraveyardCards(graveyard);
    });

    return () => {
      socket.off('graveyardContents');
    };
  }, [socket]);

  const handleViewGraveyard = () => {
    setIsOpen(true);
    socket.emit('viewGraveyard', { gameId, playerId });
  };

  return (
    <>
      <div className="graveyard-pile" onClick={handleViewGraveyard}>
        <span className="card-count">{graveyardCards.length}</span>
        Graveyard
      </div>

      {isOpen && (
        <div className="graveyard-modal">
          <div className="modal-content">
            <button className="close-button" onClick={() => setIsOpen(false)}>×</button>
            <h2>Graveyard</h2>
            <div className="graveyard-cards">
              {graveyardCards.map((card, index) => (
                <Card
                  key={`graveyard-${index}`}
                  card={card}
                  isFaceDown={false}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GraveyardView; 