import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';
import CardSearch from './CardSearch';
import DeckList from './DeckList';
import CardPreview from './CardPreview';
import '../../styles/DeckBuilder.css';

const DeckBuilder = () => {
  const [deck, setDeck] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [error, setError] = useState('');
  const [deckName, setDeckName] = useState('');
  const [savedDecks, setSavedDecks] = useState([]);
  const navigate = useNavigate();

  // Load saved decks on component mount
  useEffect(() => {
    const loadedDecks = JSON.parse(localStorage.getItem('savedDecks') || '[]');
    setSavedDecks(loadedDecks);
  }, []);

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(deck);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setDeck(items);
  };

  const handleAddCard = (card) => {
    setError('');
    if (deck.length >= 60) {
      setError('Maximum deck size is 60 cards');
      return;
    }
    
    const copiesInDeck = deck.filter(c => c.cardCode === card.cardCode).length;
    if (copiesInDeck >= 3) {
      setError('Maximum 3 copies of a card allowed');
      return;
    }

    setDeck([...deck, card]);
  };

  const handlePlayDeck = () => {
    if (deck.length < 40) {
      setError('Minimum deck size is 40 cards');
      return;
    }

    // Save deck to local storage or database
    localStorage.setItem('currentDeck', JSON.stringify(deck));
    
    // Navigate to game mode selection
    navigate('/game-mode');
  };

  const handleSaveDeck = () => {
    if (deck.length < 40) {
      setError('Cannot save deck with less than 40 cards');
      return;
    }
    if (!deckName.trim()) {
      setError('Please enter a deck name');
      return;
    }
    if (savedDecks.length >= 5) {
      setError('Maximum 5 decks allowed. Please delete a deck first.');
      return;
    }

    const newDeck = {
      id: Date.now(),
      name: deckName,
      cards: deck
    };

    const updatedDecks = [...savedDecks, newDeck];
    localStorage.setItem('savedDecks', JSON.stringify(updatedDecks));
    setSavedDecks(updatedDecks);
    setDeckName('');
    setError('Deck saved successfully!');
  };

  const handleLoadDeck = (savedDeck) => {
    setDeck(savedDeck.cards);
    setDeckName(savedDeck.name);
  };

  const handleDeleteDeck = (deckId) => {
    const updatedDecks = savedDecks.filter(deck => deck.id !== deckId);
    localStorage.setItem('savedDecks', JSON.stringify(updatedDecks));
    setSavedDecks(updatedDecks);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="deck-builder">
        <div className="deck-builder-grid">
          <div className="search-section">
            <div className="section-header">Search Cards</div>
            <CardSearch onSearchResults={setSearchResults} />
            <div className="search-results">
              {searchResults.map(card => (
                <div
                  key={card._id}
                  className="search-result-card"
                  onClick={() => handleAddCard(card)}
                  onMouseEnter={() => setSelectedCard(card)}
                >
                  <img src={card.image} alt={card.name} />
                </div>
              ))}
            </div>
          </div>

          <div className="deck-section">
            <div className="section-header">
              Your Deck ({deck.length}/60)
              {error && <span className="deck-error">{error}</span>}
            </div>
            
            <div className="deck-actions">
              <input
                type="text"
                value={deckName}
                onChange={(e) => setDeckName(e.target.value)}
                placeholder="Enter deck name"
                className="deck-name-input"
              />
              <button 
                className="save-deck-button"
                onClick={handleSaveDeck}
                disabled={deck.length < 40 || !deckName.trim()}
              >
                Save Deck
              </button>
            </div>

            {savedDecks.length > 0 && (
              <div className="saved-decks">
                <h3>Saved Decks</h3>
                {savedDecks.map(savedDeck => (
                  <div key={savedDeck.id} className="saved-deck-item">
                    <span>{savedDeck.name}</span>
                    <div className="saved-deck-actions">
                      <button onClick={() => handleLoadDeck(savedDeck)}>Load</button>
                      <button onClick={() => handleDeleteDeck(savedDeck.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Droppable droppableId="deck">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <DeckList
                    deck={deck}
                    onRemoveCard={(index) => {
                      const newDeck = [...deck];
                      newDeck.splice(index, 1);
                      setDeck(newDeck);
                    }}
                    onCardHover={setSelectedCard}
                  />
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
            <button 
              className={`play-deck-button ${deck.length >= 40 ? 'ready' : ''}`}
              onClick={handlePlayDeck}
              disabled={deck.length < 40}
            >
              {deck.length < 40 
                ? `Add ${40 - deck.length} more cards to play` 
                : 'Play with this deck'}
            </button>
          </div>

          <div className="preview-section">
            <div className="section-header">Card Preview</div>
            {selectedCard && <CardPreview card={selectedCard} />}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

export default DeckBuilder; 