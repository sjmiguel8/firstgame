import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import PhaseIndicator from './PhaseIndicator';
import './PlayAI.css';

const cardBack = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';

const PlayAI = () => {
  const [gameState, setGameState] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const socket = useSocket();
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [showPositionDialog, setShowPositionDialog] = useState(false);
  const [awaitingZoneSelect, setAwaitingZoneSelect] = useState(false);
  const [selectedAttacker, setSelectedAttacker] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('DRAW_PHASE');

  // Phase progression
  const phases = ['DRAW_PHASE', 'STANDBY_PHASE', 'MAIN_PHASE_1', 'BATTLE_PHASE', 'MAIN_PHASE_2', 'END_PHASE'];

  useEffect(() => {
    if (!socket) return;

    console.log('Setting up game event listeners');

    // Listen for game start
    socket.on('gameStarted', ({ game }) => {
      console.log('Game started:', game);
      setGameState(game);
      setIsInitializing(false);
    });

    // Listen for game state updates
    socket.on('game_state', (updatedState) => {
      console.log('Game state updated:', updatedState);
      setGameState(updatedState);
    });

    // Listen for errors
    socket.on('game_error', (error) => {
      console.error('Game error:', error);
      alert(error.message);
    });

    // Start the game when component mounts
    const activeDeck = JSON.parse(localStorage.getItem('activeDeck'));
    if (activeDeck) {
      console.log('Starting game with deck:', activeDeck);
      socket.emit('startGame', { deck: activeDeck });
    } else {
      console.error('No active deck found');
      navigate('/deck-builder');
    }

    return () => {
      socket.off('gameStarted');
      socket.off('game_state');
      socket.off('game_error');
    };
  }, [socket, navigate]);

  const renderField = (playerId) => {
    if (!gameState || !gameState.players[playerId]) return null;
    
    const player = gameState.players[playerId];
    console.log('Rendering field for player:', playerId, player);

    return (
      <div className="field">
        <div className="monster-zones">
          {player.field.map((slot, index) => (
            <div key={`monster-${index}`} className="card-zone monster-zone">
              {slot && (
                <img 
                  src={slot.card.image || cardBack} 
                  alt={slot.card.name} 
                />
              )}
            </div>
          ))}
        </div>
        <div className="spell-trap-zones">
          {player.spellTrapZone.map((slot, index) => (
            <div key={`spell-${index}`} className="card-zone spell-trap-zone">
              {slot && (
                <img 
                  src={slot.card.image || cardBack} 
                  alt={slot.card.name} 
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const handleCardSelect = (card) => {
    console.log('Card selected:', card);
    setSelectedCard(card);
    
    if (card.type === 'Monster') {
      // Show position options for monsters
      setShowPositionDialog(true);
    } else {
      // Spells/Traps can only be set face-down or activated face-up
      setShowPositionDialog(true);
    }
  };

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
    setShowPositionDialog(false);
    // Now show available zones
    setAwaitingZoneSelect(true);
  };

  const handleZoneSelect = (zoneIndex, zoneType) => {
    if (!selectedCard || !selectedPosition) return;

    socket.emit('play_card', {
      cardId: selectedCard.id,
      position: selectedPosition,
      zone: zoneIndex,
      zoneType: zoneType // 'monster' or 'spellTrap'
    });

    // Reset selection states
    setSelectedCard(null);
    setSelectedPosition(null);
    setAwaitingZoneSelect(false);
  };

  const renderHand = () => {
    if (!gameState || !gameState.players[socket.id]) return null;
    
    const player = gameState.players[socket.id];
    
    return (
      <div className="hand">
        {player.hand.map((card, index) => (
          <div 
            key={`hand-${index}`} 
            className={`card ${selectedCard?.id === card.id ? 'selected' : ''}`}
            onClick={() => handleCardSelect(card)}
          >
            <img src={card.image || cardBack} alt={card.name} />
          </div>
        ))}
      </div>
    );
  };

  const renderPositionDialog = () => {
    if (!showPositionDialog || !selectedCard) return null;

    return (
      <div className="position-dialog">
        {selectedCard.type === 'Monster' ? (
          <>
            <button onClick={() => handlePositionSelect('attack')}>
              Attack Position
            </button>
            <button onClick={() => handlePositionSelect('defense')}>
              Defense Position
            </button>
            <button onClick={() => handlePositionSelect('set')}>
              Set Face-down
            </button>
          </>
        ) : (
          <>
            <button onClick={() => handlePositionSelect('activate')}>
              Activate
            </button>
            <button onClick={() => handlePositionSelect('set')}>
              Set
            </button>
          </>
        )}
        <button onClick={() => setShowPositionDialog(false)}>Cancel</button>
      </div>
    );
  };

  const handleEndTurn = () => {
    socket.emit('end_turn');
  };

  const handlePhaseChange = (newPhase) => {
    socket.emit('change_phase', { phase: newPhase });
  };

  const handleAttackDeclaration = (attackingMonster, targetMonster) => {
    socket.emit('declare_attack', {
      attackerId: attackingMonster.id,
      targetId: targetMonster ? targetMonster.id : null // null means direct attack
    });
  };

  const isValidPhaseTransition = (currentPhase, newPhase) => {
    const phaseOrder = [
      'DRAW_PHASE',
      'STANDBY_PHASE',
      'MAIN_PHASE_1',
      'BATTLE_PHASE',
      'MAIN_PHASE_2',
      'END_PHASE'
    ];
    
    // Can't change phases if it's not your turn
    if (gameState && gameState.turn !== socket.id) {
      return false;
    }

    // Get the indices of the current and new phases
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const newIndex = phaseOrder.indexOf(newPhase);

    // Phase must exist and be the next one in sequence
    if (currentIndex === -1 || newIndex === -1) {
      return false;
    }

    // Special case: Can skip Battle Phase and Main Phase 2
    if (currentPhase === 'MAIN_PHASE_1' && newPhase === 'END_PHASE') {
      return true;
    }

    // Normal case: Must be the next phase in sequence
    return newIndex === currentIndex + 1;
  };

  // Add phase controls
  const renderPhaseControls = () => {
    if (!gameState || gameState.turn !== socket.id) return null;

    return (
      <div className="phase-controls">
        {phases.map((phase) => (
          <button
            key={phase}
            onClick={() => handlePhaseChange(phase)}
            disabled={!isValidPhaseTransition(currentPhase, phase)}
            className={`phase-button ${currentPhase === phase ? 'active' : ''}`}
          >
            {phase.replace('_', ' ')}
          </button>
        ))}
      </div>
    );
  };

  // Add battle controls
  const renderBattleControls = () => {
    if (!gameState || gameState.currentPhase !== 'BATTLE_PHASE') return null;

    return (
      <div className="battle-controls">
        {selectedAttacker ? (
          <div className="attack-options">
            <button onClick={() => handleAttackDeclaration(selectedAttacker, null)}>
              Direct Attack
            </button>
            <button onClick={() => setSelectedAttacker(null)}>
              Cancel Attack
            </button>
          </div>
        ) : null}
      </div>
    );
  };

  // Update monster zone rendering to include attack selection
  const renderMonsterZone = (slot, index, isPlayer) => {
    if (!slot) return (
      <div 
        key={`monster-${index}`} 
        className={`card-zone monster-zone ${isValidMonsterZone(index) ? 'playable' : ''}`}
        onClick={() => handleMonsterZoneClick(index)}
      />
    );

    return (
      <div 
        key={`monster-${index}`} 
        className={`card-zone monster-zone ${slot.canAttack ? 'can-attack' : ''} ${selectedAttacker?.id === slot.card.id ? 'selected' : ''}`}
        onClick={() => handleMonsterClick(slot, index, isPlayer)}
      >
        <img 
          src={slot.isFaceDown ? cardBack : (slot.card.image || cardBack)} 
          alt={slot.isFaceDown ? 'Face-down card' : slot.card.name}
          className={slot.position === 'defense' ? 'rotated' : ''}
        />
        {slot.card.attack && !slot.isFaceDown && (
          <div className="card-stats">
            <span className="atk">ATK: {slot.card.attack}</span>
            <span className="def">DEF: {slot.card.defense}</span>
          </div>
        )}
      </div>
    );
  };

  const handleMonsterClick = (slot, index, isPlayer) => {
    if (gameState.currentPhase === 'BATTLE_PHASE' && isPlayer && slot.canAttack) {
      setSelectedAttacker(slot);
    } else if (gameState.currentPhase === 'BATTLE_PHASE' && !isPlayer && selectedAttacker) {
      handleAttackDeclaration(selectedAttacker, slot);
    }
  };

  // Add game info display
  const renderGameInfo = () => {
    if (!gameState) return null;

    return (
      <div className="game-info">
        <div className="player-info opponent">
          <span className="life-points">LP: {gameState.players.ai.lifePoints}</span>
          <span className="deck-count">Deck: {gameState.players.ai.deck.length}</span>
        </div>
        <div className="phase-indicator">
          {currentPhase.replace('_', ' ')}
        </div>
        <div className="player-info player">
          <span className="life-points">LP: {gameState.players[socket.id].lifePoints}</span>
          <span className="deck-count">Deck: {gameState.players[socket.id].deck.length}</span>
        </div>
      </div>
    );
  };

  if (isInitializing) {
    return <div className="loading">Initializing game...</div>;
  }

  if (!gameState) {
    return <div className="error">Failed to load game state</div>;
  }

  return (
    <div className="play-ai">
      {renderGameInfo()}
      <div className="game-board">
        <div className="opponent-area">
          {renderField('ai')}
        </div>

        <div className="center-area">
          {renderPhaseControls()}
          {renderBattleControls()}
        </div>

        <div className="player-area">
          {renderField(socket.id)}
          {renderHand()}
        </div>
      </div>
      {renderPositionDialog()}
    </div>
  );
};

export default PlayAI; 