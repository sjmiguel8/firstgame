import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import PhaseIndicator from './PhaseIndicator';
import './PlayAI.css';

const cardBack = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';

const PlayAI = () => {
  const [gameState, setGameState] = useState({
    currentPhase: 'DRAW',
    players: {},
    turn: null
  });
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPositionOptions, setShowPositionOptions] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [awaitingZoneSelect, setAwaitingZoneSelect] = useState(false);
  const socket = useSocket();
  const navigate = useNavigate();

  const handlePhaseChange = useCallback((newPhase) => {
    if (!socket || !gameState || gameState.turn !== socket.id) return;
    
    // Only allow phase changes during player's turn
    const validPhaseTransitions = {
      'DRAW': 'MAIN1',
      'MAIN1': 'BATTLE',
      'BATTLE': 'MAIN2',
      'MAIN2': 'END'
    };

    if (validPhaseTransitions[gameState.currentPhase] === newPhase) {
      socket.emit('change_phase', { phase: newPhase });
    }
  }, [socket, gameState]);

  const handleCardSelect = (cardIndex) => {
    console.log('Card Select Triggered:', {
      cardIndex,
      currentPhase: gameState.currentPhase,
      isPlayerTurn: gameState.turn === socket?.id
    });

    // Clear selections if clicking the same card
    if (selectedCard === cardIndex) {
      console.log('Clearing selections');
      setSelectedCard(null);
      setShowPositionOptions(false);
      setSelectedPosition(null);
      setAwaitingZoneSelect(false);
      return;
    }

    // Only allow card selection during player's turn and main phases
    if (gameState.turn !== socket?.id || 
        (gameState.currentPhase !== 'MAIN1' && gameState.currentPhase !== 'MAIN2')) {
      console.log('Cannot select card - wrong phase or not player turn');
      return;
    }

    const card = gameState.players[socket.id].hand[cardIndex];
    console.log('Selected card:', card);
    
    setSelectedCard(cardIndex);
    
    // Show position options based on card type
    if (card.type === 'Monster') {
      setShowPositionOptions('monster');
    } else if (card.type === 'Spell' || card.type === 'Trap') {
      setShowPositionOptions('spell-trap');
    }
  };

  const handleZoneSelect = (zoneType, zoneIndex) => {
    console.log('Zone Select Triggered:', {
      awaitingZoneSelect,
      selectedCard,
      zoneType,
      zoneIndex,
      currentPhase: gameState.currentPhase,
      turn: gameState.turn,
      socketId: socket?.id
    });

    if (!awaitingZoneSelect || selectedCard === null) {
      console.log('Not awaiting zone select or no card selected');
      return;
    }
    
    const card = gameState.players[socket.id].hand[selectedCard];
    console.log('Selected Card:', card);

    if (!isZonePlayable(zoneType, zoneIndex)) {
      console.log('Zone not playable:', {
        zoneType,
        zoneIndex,
        cardType: card.type,
        currentPhase: gameState.currentPhase
      });
      return;
    }

    const playData = {
      cardIndex: selectedCard,
      zoneType,
      zoneIndex,
      position: selectedPosition,
      cardType: card.type
    };
    
    console.log('Emitting play_card event:', playData);
    socket.emit('play_card', playData);
    
    // Clear all selections after emitting
    setSelectedCard(null);
    setSelectedZone(null);
    setShowPositionOptions(false);
    setSelectedPosition(null);
    setAwaitingZoneSelect(false);
  };

  const handleDrawCard = () => {
    if (!socket || gameState.currentPhase !== 'DRAW') return;
    socket.emit('draw_card');
  };

  const handleEndTurn = () => {
    if (!socket || gameState.turn !== socket.id) return;
    socket.emit('end_turn');
  };

  const handlePositionSelect = (position) => {
    const card = gameState.players[socket.id].hand[selectedCard];
    
    if (card.type === 'Trap' && position === 'FACE-UP') {
      return;
    }

    if (card.type === 'Spell') {
      if (card.spellType === 'Quick-Play' && position === 'FACE-UP' && 
          gameState.currentPhase !== 'MAIN1' && gameState.currentPhase !== 'MAIN2') {
        return;
      }
    }

    setSelectedPosition(position);
    setAwaitingZoneSelect(true);
    setShowPositionOptions(false);
  };

  const isZonePlayable = (zoneType, zoneIndex) => {
    console.log('Checking if zone is playable:', {
      zoneType,
      zoneIndex,
      selectedCard,
      awaitingZoneSelect,
      currentPhase: gameState.currentPhase,
      turn: gameState.turn
    });

    if (!selectedCard || !awaitingZoneSelect || gameState.turn !== socket?.id) {
      console.log('Basic checks failed');
      return false;
    }

    if (gameState.currentPhase !== 'MAIN1' && gameState.currentPhase !== 'MAIN2') {
      console.log('Not in main phase');
      return false;
    }
    
    const card = gameState.players[socket.id].hand[selectedCard];
    const player = gameState.players[socket.id];
    
    // Check if zone matches card type
    if (card.type === 'Monster' && zoneType === 'monster') {
      return player.field[zoneIndex] === null;
    } else if ((card.type === 'Spell' || card.type === 'Trap') && zoneType === 'spell-trap') {
      return player.spellTrapZone[zoneIndex] === null;
    }
    
    return false;
  };

  useEffect(() => {
    if (!socket) return;

    try {
      const activeDeckString = localStorage.getItem('activeDeck');
      if (!activeDeckString) {
        navigate('/game-mode');
        return;
      }

      const activeDeck = JSON.parse(activeDeckString);
      if (!activeDeck?.cards) {
        setError('Invalid deck format');
        return;
      }

      socket.emit('start_ai_game', { deck: activeDeck });

      socket.on('game_state', (state) => {
        if (state?.players) {
          setGameState(state);
          setLoading(false);
        }
      });

      socket.on('game_error', (err) => {
        setError(err.message || 'Game error occurred');
        setLoading(false);
      });

      return () => {
        socket.off('game_state');
        socket.off('game_error');
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [socket, navigate]);

  useEffect(() => {
    if (!socket) return;

    socket.on('game_error', (error) => {
      console.error('Game error:', error);
      setError(error.message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off('game_error');
    };
  }, [socket]);

  if (loading) {
    return <div className="play-ai loading">Initializing game...</div>;
  }

  if (error) {
    return <div className="play-ai error">{error}</div>;
  }

  const renderCard = (card, isOpponent) => {
    if (!card) return null;

    const shouldShowBack = isOpponent || card.position === 'SET' || card.position === 'FACE-DOWN';
    const isDefense = card.position === 'DEFENSE';

    return (
      <img
        src={shouldShowBack ? cardBack : card.image}
        alt={card.name}
        className={`card-image ${isDefense ? 'rotated' : ''}`}
      />
    );
  };

  const renderField = (player, isOpponent = false) => {
    const field = gameState.players[player]?.field || Array(5).fill(null);
    const spellTrapZone = gameState.players[player]?.spellTrapZone || Array(5).fill(null);

    return (
      <div className={`field ${isOpponent ? 'opponent' : 'player'}`}>
        <div className="monster-zones">
          {field.map((card, index) => (
            <div
              key={`monster-${index}`}
              className={`card-zone monster-zone
                ${selectedZone === `monster-${index}` ? 'selected' : ''} 
                ${!isOpponent && awaitingZoneSelect && isZonePlayable('monster', index) ? 'playable' : ''}`
              }
              onClick={() => !isOpponent && handleZoneSelect('monster', index)}
            >
              {renderCard(card, isOpponent)}
            </div>
          ))}
        </div>
        
        <div className="spell-trap-zones">
          {spellTrapZone.map((card, index) => (
            <div
              key={`spell-trap-${index}`}
              className={`card-zone spell-trap-zone
                ${selectedZone === `spell-trap-${index}` ? 'selected' : ''} 
                ${!isOpponent && awaitingZoneSelect && isZonePlayable('spell-trap', index) ? 'playable' : ''}`
              }
              onClick={() => !isOpponent && handleZoneSelect('spell-trap', index)}
            >
              {renderCard(card, isOpponent)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPositionOptions = (card) => {
    if (!showPositionOptions) return null;

    if (showPositionOptions === 'monster') {
      return (
        <div className="position-options">
          <button 
            className="position-button"
            onClick={() => handlePositionSelect('ATTACK')}
          >
            Attack
          </button>
          <button 
            className="position-button"
            onClick={() => handlePositionSelect('DEFENSE')}
          >
            Defense
          </button>
        </div>
      );
    }

    if (showPositionOptions === 'spell-trap') {
      if (card.type === 'Trap') {
        // Traps can only be set initially
        return (
          <div className="position-options">
            <button 
              className="position-button"
              onClick={() => handlePositionSelect('SET')}
            >
              Set
            </button>
          </div>
        );
      }

      return (
        <div className="position-options">
          <button 
            className="position-button"
            onClick={() => handlePositionSelect('FACE-UP')}
            disabled={!canActivateSpell(card)}
          >
            Activate
          </button>
          <button 
            className="position-button"
            onClick={() => handlePositionSelect('SET')}
          >
            Set
          </button>
        </div>
      );
    }
  };

  const renderHand = () => {
    const hand = gameState.players[socket.id]?.hand || [];
    return (
      <div className="hand">
        {hand.map((card, index) => (
          <div
            key={`hand-${index}`}
            className={`card ${selectedCard === index ? 'selected' : ''}`}
            onClick={() => handleCardSelect(index)}
          >
            <img src={card.image} alt={card.name} className="card-image" />
            {selectedCard === index && renderPositionOptions(card)}
          </div>
        ))}
      </div>
    );
  };

  const renderLifePoints = (player, isOpponent = false) => {
    const lifePoints = gameState.players[player]?.lifePoints || 8000;
    return (
      <div className={`life-points ${isOpponent ? 'opponent' : 'player'}`}>
        LP: {lifePoints}
      </div>
    );
  };

  const canActivateSpell = (card) => {
    if (card.type !== 'Spell') return false;
    
    switch (card.spellType) {
      case 'Quick-Play':
        return true; // Can be activated in response to actions
      case 'Normal':
      case 'Continuous':
      case 'Field':
        return gameState.currentPhase === 'MAIN1' || gameState.currentPhase === 'MAIN2';
      default:
        return false;
    }
  };

  const renderPhaseControls = () => {
    if (gameState.turn !== socket?.id) return null;

    const nextPhase = {
      'DRAW': 'MAIN1',
      'MAIN1': 'BATTLE',
      'BATTLE': 'MAIN2',
      'MAIN2': 'END'
    }[gameState.currentPhase];

    if (!nextPhase) return null;

    return (
      <button 
        className="phase-button"
        onClick={() => handlePhaseChange(nextPhase)}
      >
        Next Phase ({nextPhase})
      </button>
    );
  };

  return (
    <div className="play-ai">
      <div className="game-board">
        <div className="opponent-area">
          {renderLifePoints('ai', true)}
          {renderField('ai', true)}
        </div>
        
        <div className="center-area">
          <PhaseIndicator
            currentPhase={gameState.currentPhase}
            isPlayerTurn={gameState.turn === socket?.id}
          />
          <div className="game-controls">
            {gameState.currentPhase === 'DRAW' && gameState.turn === socket?.id && (
              <button 
                className="draw-button"
                onClick={handleDrawCard}
              >
                Draw Card
              </button>
            )}
            {renderPhaseControls()}
            {(gameState.currentPhase === 'MAIN2') && 
             gameState.turn === socket?.id && (
              <button 
                className="end-turn-button"
                onClick={handleEndTurn}
              >
                End Turn
              </button>
            )}
          </div>
        </div>

        <div className="player-area">
          {renderField(socket.id)}
          {renderLifePoints(socket?.id)}
          {renderHand()}
        </div>
      </div>
    </div>
  );
};

export default PlayAI; 