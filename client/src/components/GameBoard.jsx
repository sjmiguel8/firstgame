import React, { useState, useEffect } from 'react';
import PlayerField from './PlayerField';
import Hand from './Hand';
import PhaseIndicator from './PhaseIndicator';
import GraveyardView from './GraveyardView';

const GameBoard = ({ socket, gameId, playerId }) => {
  const [gameState, setGameState] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    socket.on('gameUpdated', ({ game }) => {
      setGameState(game);
    });

    return () => {
      socket.off('gameUpdated');
    };
  }, [socket]);

  const handleCardSelect = (card) => {
    setSelectedCard(card);
  };

  // eslint-disable-next-line no-unused-vars
  const handleCardPlay = (card, position) => {
    // Implementation coming soon
  };

  // eslint-disable-next-line no-unused-vars
  const handleAttack = (attackingCard, targetCard) => {
    // Implementation coming soon
  };

  if (!gameState) return <div>Loading...</div>;

  const currentPlayer = gameState.players.find(p => p.user === playerId);
  const opponent = gameState.players.find(p => p.user !== playerId);

  return (
    <div className="game-board">
      <div className="opponent-field">
        <PlayerField
          player={opponent}
          isOpponent={true}
          onCardSelect={handleCardSelect}
          selectedCard={selectedCard}
        />
      </div>

      <div className="center-field">
        <PhaseIndicator 
          currentPhase={gameState.currentPhase}
          isPlayerTurn={gameState.currentTurn === gameState.players.indexOf(currentPlayer)}
        />
        <GraveyardView playerId={playerId} gameId={gameId} socket={socket} />
      </div>

      <div className="player-field">
        <PlayerField
          player={currentPlayer}
          isOpponent={false}
          onCardSelect={handleCardSelect}
          selectedCard={selectedCard}
        />
        <Hand
          cards={currentPlayer.hand}
          onCardSelect={handleCardSelect}
          selectedCard={selectedCard}
        />
      </div>
    </div>
  );
};

export default GameBoard; 