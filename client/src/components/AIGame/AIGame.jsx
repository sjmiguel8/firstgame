import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import GameBoard from '../GameBoard';
import './AIGame.css';

const AIGame = () => {
  const [difficulty, setDifficulty] = useState('easy');
  const [gameStarted, setGameStarted] = useState(false);
  const { currentUser } = useAuth();

  const handleStartGame = () => {
    setGameStarted(true);
  };

  if (!gameStarted) {
    return (
      <div className="ai-game-setup">
        <h2>Play Against AI</h2>
        <div className="difficulty-selection">
          <h3>Select Difficulty:</h3>
          <div className="difficulty-buttons">
            <button 
              className={`difficulty-btn ${difficulty === 'easy' ? 'active' : ''}`}
              onClick={() => setDifficulty('easy')}
            >
              Easy
            </button>
            <button 
              className={`difficulty-btn ${difficulty === 'medium' ? 'active' : ''}`}
              onClick={() => setDifficulty('medium')}
            >
              Medium
            </button>
            <button 
              className={`difficulty-btn ${difficulty === 'hard' ? 'active' : ''}`}
              onClick={() => setDifficulty('hard')}
            >
              Hard
            </button>
          </div>
          <div className="difficulty-description">
            {difficulty === 'easy' && 'AI will play basic strategies and make occasional mistakes.'}
            {difficulty === 'medium' && 'AI will use more advanced strategies and make fewer mistakes.'}
            {difficulty === 'hard' && 'AI will use optimal strategies and rarely make mistakes.'}
          </div>
          <button className="start-game-btn" onClick={handleStartGame}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <GameBoard 
      isAIGame={true} 
      difficulty={difficulty}
      playerId={currentUser.uid}
    />
  );
};

export default AIGame; 