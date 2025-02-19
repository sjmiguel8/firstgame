import React from 'react';
import './PhaseIndicator.css';

const PHASES = ['DRAW', 'STANDBY', 'MAIN1', 'BATTLE', 'MAIN2', 'END'];

const PhaseIndicator = ({ currentPhase = 'DRAW', isPlayerTurn }) => {
  return (
    <div className="phase-indicator">
      {PHASES.map((phase) => (
        <div
          key={phase}
          className={`phase ${currentPhase === phase ? 'active' : ''}`}
        >
          {phase}
        </div>
      ))}
      <div className="turn-indicator">
        {isPlayerTurn ? "Your Turn" : "Opponent's Turn"}
      </div>
    </div>
  );
};

export default PhaseIndicator;
