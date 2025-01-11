import React, { useState } from 'react';
import DeckSelection from './DeckSelection';
import '../styles/GameSetup.css';

const GameSetup = ({ onGameStart }) => {
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const handleFindMatch = () => {
    if (!selectedDeck) return;
    
    setIsSearching(true);
    onGameStart(selectedDeck);
  };

  return (
    <div className="game-setup">
      <h1>Yu-Gi-Oh! Online</h1>
      
      <DeckSelection
        onDeckSelect={setSelectedDeck}
        selectedDeck={selectedDeck}
      />

      <button 
        className={`find-match-btn ${isSearching ? 'searching' : ''}`}
        onClick={handleFindMatch}
        disabled={!selectedDeck || isSearching}
      >
        {isSearching ? 'Finding Match...' : 'Find Match'}
      </button>

      {isSearching && (
        <div className="searching-animation">
          <div className="spinner"></div>
          <p>Searching for opponent...</p>
        </div>
      )}
    </div>
  );
};

export default GameSetup; 