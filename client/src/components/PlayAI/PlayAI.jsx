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
  const [currentPhase, setCurrentPhase] = useState('DRAW_PHASE');
  const [hasDrawnCard, setHasDrawnCard] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  // Phase progression
  const phases = ['DRAW_PHASE', 'STANDBY_PHASE', 'MAIN_PHASE_1', 'BATTLE_PHASE', 'MAIN_PHASE_2', 'END_PHASE'];

  // Initialize game when socket connects or reconnects
  const initializeGame = useCallback(() => {
    if (!socket) return;

    const currentDeck = JSON.parse(localStorage.getItem('currentDeck'));
    if (!currentDeck) {
      console.error('No deck found');
      navigate('/deck-builder');
      return;
    }

    console.log('Starting game with deck:', currentDeck);
    socket.emit('startGame', { deck: currentDeck });
  }, [socket, navigate]);

  useEffect(() => {
    if (!socket) return;

    // Set player ID when socket is available
    setPlayerId(socket.id);

    console.log('Setting up game event listeners');

    // Listen for reconnection
    socket.on('connect', () => {
      console.log('Socket reconnected, reinitializing game');
      setPlayerId(socket.id);
      initializeGame();
    });

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
      
      // Reset draw flag when turn changes
      if (updatedState.turn !== gameState?.turn) {
        setHasDrawnCard(false);
      }
    });

    // Listen for errors
    socket.on('game_error', (error) => {
      console.error('Game error:', error);
      alert(error.message);
    });

    // Initialize game on mount
    initializeGame();

    return () => {
      socket.off('connect');
      socket.off('gameStarted');
      socket.off('game_state');
      socket.off('game_error');
    };
  }, [socket, initializeGame, gameState?.turn]);

  // Handle automatic draw in draw phase
  useEffect(() => {
    if (gameState && 
        playerId && 
        gameState.turn === playerId && 
        currentPhase === 'DRAW_PHASE' && 
        !hasDrawnCard &&
        socket) {
      socket.emit('draw_card');
      setHasDrawnCard(true);
    }
  }, [gameState, currentPhase, playerId, hasDrawnCard, socket]);

  const handleZoneClick = (index, zoneType) => {
    if (!awaitingZoneSelect || !selectedCard || !playerId || !socket) return;

    // Check if card type matches zone type
    if ((selectedCard.type === 'Monster' && zoneType !== 'monster') ||
        ((selectedCard.type === 'Spell' || selectedCard.type === 'Trap') && zoneType !== 'spellTrap')) {
      alert('Invalid zone for this card type!');
      return;
    }

    // Check if zone is empty
    if (!gameState?.players[playerId]?.field) return;
    const playerField = gameState.players[playerId].field;
    const zone = zoneType === 'monster' ? playerField.monsters[index] : playerField.spellsTraps[index];
    if (zone) {
      alert('This zone is already occupied!');
      return;
    }

    socket.emit('play_card', {
      cardId: selectedCard.id,
      position: selectedPosition,
      zone: index,
      zoneType: zoneType
    });

    // Reset selection states
    setSelectedCard(null);
    setSelectedPosition(null);
    setAwaitingZoneSelect(false);
  };

  const handleCardSelect = (card) => {
    if (currentPhase !== 'MAIN_PHASE_1' && currentPhase !== 'MAIN_PHASE_2') {
      alert('You can only play cards during Main Phase 1 or 2!');
      return;
    }

    console.log('Card selected:', card);
    setSelectedCard(card);
    setShowPositionDialog(true);
  };

  const handlePositionSelect = (position) => {
    setSelectedPosition(position);
    setShowPositionDialog(false);
    setAwaitingZoneSelect(true);
  };

  const renderHand = () => {
    if (!gameState || !playerId || !gameState.players[playerId]) return null;
    
    const player = gameState.players[playerId];
    
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

  const renderField = (playerId) => {
    if (!gameState || !gameState.players[playerId]) return null;
    
    const player = gameState.players[playerId];
    console.log('Rendering field for player:', playerId, player);

    return (
      <div className="field">
        <div className="monster-zones">
          {player.field.monsters.map((slot, index) => (
            <div 
              key={`monster-${index}`} 
              className={`card-zone monster-zone ${isValidMonsterZone(index) ? 'playable' : ''}`}
              onClick={() => handleZoneClick(index, 'monster')}
            >
              {slot && (
                <img 
                  src={slot.isFaceDown ? cardBack : (slot.card.image || cardBack)}
                  alt={slot.isFaceDown ? 'Face-down card' : slot.card.name}
                  className={slot.position === 'defense' ? 'rotated' : ''}
                />
              )}
            </div>
          ))}
        </div>
        <div className="spell-trap-zones">
          {player.field.spellsTraps.map((slot, index) => (
            <div 
              key={`spell-${index}`} 
              className={`card-zone spell-trap-zone ${isValidSpellTrapZone(index) ? 'playable' : ''}`}
              onClick={() => handleZoneClick(index, 'spellTrap')}
            >
              {slot && (
                <img 
                  src={slot.isFaceDown ? cardBack : (slot.card.image || cardBack)}
                  alt={slot.isFaceDown ? 'Face-down card' : slot.card.name}
                />
              )}
            </div>
          ))}
        </div>
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

  const handlePhaseChange = (newPhase) => {
    if (!socket) return;
    socket.emit('change_phase', { phase: newPhase });
    setCurrentPhase(newPhase);
  };

  const isValidMonsterZone = (index) => {
    if (!gameState || !selectedCard || !awaitingZoneSelect || !playerId) return false;
    
    // Check if it's the right phase
    if (currentPhase !== 'MAIN_PHASE_1' && currentPhase !== 'MAIN_PHASE_2') return false;
    
    const playerField = gameState.players[playerId]?.field;
    if (!playerField) return false;
    
    // Check if zone is empty
    if (playerField.monsters[index]) return false;
    
    // Check if card type matches zone type
    if (selectedCard.type === 'Monster') {
      return true;
    }
    
    return false;
  };

  const isValidSpellTrapZone = (index) => {
    if (!gameState || !selectedCard || !awaitingZoneSelect || !playerId) return false;
    
    // Check if it's the right phase
    if (currentPhase !== 'MAIN_PHASE_1' && currentPhase !== 'MAIN_PHASE_2') return false;
    
    const playerField = gameState.players[playerId]?.field;
    if (!playerField) return false;
    
    // Check if zone is empty
    if (playerField.spellsTraps[index]) return false;
    
    // Check if card type matches zone type
    if (selectedCard.type === 'Spell' || selectedCard.type === 'Trap') {
      return true;
    }
    
    return false;
  };

  const handleAttackDeclaration = (attackingMonster, targetMonster) => {
    if (!socket) return;
    socket.emit('declare_attack', {
      attackerId: attackingMonster.id,
      targetId: targetMonster ? targetMonster.id : null
    });
  };

  const isValidPhaseTransition = (currentPhase, newPhase) => {
    if (!gameState || !playerId) return false;
    
    const phaseOrder = phases;
    
    // Can't change phases if it's not your turn
    if (gameState.turn !== playerId) {
      return false;
    }

    // Get the indices of the current and new phases
    const currentIndex = phaseOrder.indexOf(currentPhase);
    const newIndex = phaseOrder.indexOf(newPhase);

    // Phase must exist
    if (currentIndex === -1 || newIndex === -1) {
      return false;
    }

    // Must draw in draw phase before proceeding
    if (currentPhase === 'DRAW_PHASE' && !hasDrawnCard) {
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
    if (!gameState || !playerId || gameState.turn !== playerId) return null;

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
    if (!gameState || currentPhase !== 'BATTLE_PHASE') return null;

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

  // Add game info display
  const renderGameInfo = () => {
    if (!gameState || !playerId) return null;

    return (
      <div className="game-info">
        <div className="player-info opponent">
          <span className="life-points">LP: {gameState.players.ai.lifePoints}</span>
          <span className="deck-count">Deck: {gameState.players.ai.deck.length}</span>
        </div>
        <div className="phase-indicator">
          <PhaseIndicator 
            currentPhase={currentPhase} 
            isPlayerTurn={gameState.turn === playerId}
          />
        </div>
        <div className="player-info player">
          <span className="life-points">LP: {gameState.players[playerId].lifePoints}</span>
          <span className="deck-count">Deck: {gameState.players[playerId].deck.length}</span>
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
          {renderField(playerId)}
          {renderHand()}
        </div>
      </div>
      {renderPositionDialog()}
    </div>
  );
};

export default PlayAI;
