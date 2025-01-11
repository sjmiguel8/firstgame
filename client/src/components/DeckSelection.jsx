import React, { useEffect, useState } from 'react';
import '../styles/DeckSelection.css';

const DeckSelection = ({ onDeckSelect, selectedDeck }) => {
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user's decks from the server
    const fetchDecks = async () => {
      try {
        const response = await fetch('/api/decks', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        setDecks(data.decks);
      } catch (error) {
        console.error('Error fetching decks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDecks();
  }, []);

  if (loading) return <div className="loading">Loading decks...</div>;

  return (
    <div className="deck-selection">
      <h2>Select Your Deck</h2>
      <div className="decks-grid">
        {decks.map(deck => (
          <div
            key={deck._id}
            className={`deck-card ${selectedDeck?._id === deck._id ? 'selected' : ''}`}
            onClick={() => onDeckSelect(deck)}
          >
            <img src={deck.thumbnail || '/default-deck.png'} alt={deck.name} />
            <div className="deck-info">
              <h3>{deck.name}</h3>
              <p>{deck.cards.length} cards</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeckSelection; 