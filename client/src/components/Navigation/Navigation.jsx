import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <nav className="navigation">
      <div className="nav-brand">
        <Link to="/">Yu-Gi-Oh! Game</Link>
      </div>
      <div className="nav-links">
        {currentUser ? (
          <>
            <Link to="/deck-builder">Deck Builder</Link>
            <Link to="/game-mode">Play Game</Link>
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
      <Link to="/rules-upload" className="nav-link">
        Upload Rules
      </Link>
    </nav>
  );
};

export default Navigation; 