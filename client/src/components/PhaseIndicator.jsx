import React from 'react';
import '../styles/PhaseIndicator.css';
import { useSocket } from '../contexts/SocketContext';

const PhaseIndicator = ({ currentPhase, isPlayerTurn }) => {
  const { changePhase, gameState } = useSocket();
  const phases = [
    'drawPhase',
    'standbyPhase',
    'mainPhase1',
    'battlePhase',
    'mainPhase2',
    'endPhase'
  ];

  const handlePhaseClick = (phase) => {
    if (!isPlayerTurn) return;
    changePhase(phase, gameState.gameId);
  };

  return (
    <div className="phase-indicator">
      <div className="turn-indicator">
        {isPlayerTurn ? "Your Turn" : "Opponent's Turn"}
      </div>
      <div className="phases">
        {phases.map(phase => (
          <div
            key={phase}
            className={`phase ${currentPhase === phase ? 'active' : ''} ${isPlayerTurn ? 'clickable' : ''}`}
            onClick={() => handlePhaseClick(phase)}
          >
            {phase.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PhaseIndicator; 