import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './GameMode.css';

const GameMode = () => {
  const navigate = useNavigate();
  const [showDeckSelection, setShowDeckSelection] = useState(false);
  const [savedDecks, setSavedDecks] = useState([]);

  useEffect(() => {
    const loadedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
    setSavedDecks(loadedDecks);
  }, []);

  const handleGameModeSelect = (mode) => {
    if (mode === 'ai') {
      if (savedDecks.length === 0) {
        alert('Please build a deck first!');
        navigate('/deck-builder');
        return;
      }
      setShowDeckSelection(true);
    }
  };

  const handleDeckSelect = (selectedDeck) => {
    try {
      localStorage.setItem('activeDeck', JSON.stringify(selectedDeck));
      navigate('/play-ai');
    } catch (error) {
      console.error('Error setting deck:', error);
      alert('Error loading deck. Please try again.');
    }
  };

  if (showDeckSelection) {
    return (
      <div className="game-mode">
        <h1>Select Your Deck</h1>
        <div className="deck-selection">
          {savedDecks.map(deck => (
            <button
              key={deck.id}
              className="deck-button"
              onClick={() => handleDeckSelect(deck)}
            >
              {deck.name} ({deck.cards.length} cards)
            </button>
          ))}
        </div>
        <button
          className="back-button"
          onClick={() => setShowDeckSelection(false)}
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="game-mode">
      <h1>Select Game Mode</h1>
      <div className="mode-buttons">
        <button 
          className="mode-button"
          onClick={() => handleGameModeSelect('ai')}
        >
          Play vs AI
        </button>
        <button 
          className="mode-button"
          onClick={() => handleGameModeSelect('player')}
          disabled
        >
          Play vs Player (Coming Soon)
        </button>
      </div>
    </div>
  );
};

export default GameMode;
