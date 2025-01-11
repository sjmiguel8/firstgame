import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import './Matchmaking.css';

const Matchmaking = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const { socket, joinGame } = useSocket();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (isSearching) {
      timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSearching]);

  useEffect(() => {
    if (!socket) return;

    socket.on('waitingForMatch', () => {
      setIsSearching(true);
    });

    socket.on('matchFound', ({ gameId, isFirstPlayer }) => {
      setIsSearching(false);
      joinGame(gameId);
      navigate(`/game/${gameId}`);
    });

    socket.on('matchmakingCancelled', () => {
      setIsSearching(false);
      setSearchTime(0);
    });

    return () => {
      socket.off('waitingForMatch');
      socket.off('matchFound');
      socket.off('matchmakingCancelled');
    };
  }, [socket, navigate, joinGame]);

  const startMatchmaking = () => {
    socket.emit('findMatch', currentUser.uid);
  };

  const cancelMatchmaking = () => {
    socket.emit('cancelMatchmaking', currentUser.uid);
    setIsSearching(false);
    setSearchTime(0);
  };

  return (
    <div className="matchmaking-container">
      <div className="matchmaking-card">
        <h2>Find a Match</h2>
        {isSearching ? (
          <>
            <div className="searching-animation">
              Searching for opponent... ({searchTime}s)
            </div>
            <button 
              className="cancel-button"
              onClick={cancelMatchmaking}
            >
              Cancel
            </button>
          </>
        ) : (
          <button 
            className="find-match-button"
            onClick={startMatchmaking}
          >
            Find Match
          </button>
        )}
      </div>
    </div>
  );
};

export default Matchmaking; 