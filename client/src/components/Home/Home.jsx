import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Home.css';

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <div className="home">
      <h1>Welcome to Yu-Gi-Oh! Online</h1>
      {currentUser ? (
        <div className="action-buttons">
          <Link to="/deck-builder" className="action-button">
            Build Your Deck
          </Link>
          <Link to="/game-mode" className="action-button">
            Play Game
          </Link>
        </div>
      ) : (
        <div className="auth-buttons">
          <Link to="/login" className="auth-button">
            Login
          </Link>
          <Link to="/register" className="auth-button">
            Register
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home; 