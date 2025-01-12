import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Navigation from './components/Navigation/Navigation';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import DeckBuilder from './components/DeckBuilder/DeckBuilder';
import GameMode from './components/GameMode/GameMode';
import PlayAI from './components/PlayAI/PlayAI';
import Profile from './components/Profile/Profile';
import Home from './components/Home/Home';
import ErrorBoundary from './components/ErrorBoundary';
import RuleUploader from './components/RuleUploader/RuleUploader';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <SocketProvider>
            <Navigation />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/deck-builder" element={<PrivateRoute><DeckBuilder /></PrivateRoute>} />
              <Route path="/game-mode" element={<PrivateRoute><GameMode /></PrivateRoute>} />
              <Route path="/play-ai" element={<PrivateRoute><PlayAI /></PrivateRoute>} />
              <Route path="/rules-upload" element={<PrivateRoute><RuleUploader /></PrivateRoute>} />
            </Routes>
          </SocketProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App; 