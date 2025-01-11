import React from 'react';
import { useNavigate } from 'react-router-dom';
import './GameMode.css';

const GameMode = () => {
  const navigate = useNavigate();

  const handleGameModeSelect = (mode) => {
    if (mode === 'ai') {
      const activeDeckString = localStorage.getItem('activeDeck');
      if (!activeDeckString) {
        alert('Please build and select a deck first!');
        navigate('/deck-builder');
        return;
      }

      try {
        const activeDeck = JSON.parse(activeDeckString);
        if (!activeDeck || !activeDeck.cards) {
          alert('Invalid deck format. Please rebuild your deck.');
          navigate('/deck-builder');
          return;
        }
        navigate('/play-ai');
      } catch (error) {
        console.error('Error parsing deck:', error);
        alert('Error loading deck. Please rebuild your deck.');
        navigate('/deck-builder');
      }
    }
  };

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