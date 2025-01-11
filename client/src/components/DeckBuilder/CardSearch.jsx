import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './CardSearch.css';

const CardSearch = ({ onSearchResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  // Debounce search to avoid too many API calls
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm) {
        setLoading(true);
        try {
          const token = await currentUser.getIdToken();
          const response = await fetch(`/api/cards/search?q=${searchTerm}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          onSearchResults(data);
        } catch (error) {
          console.error('Search failed:', error);
          setError(error.message);
        } finally {
          setLoading(false);
        }
      }
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, currentUser, onSearchResults]);

  return (
    <div className="search-container">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search cards..."
        className="search-input"
        disabled={loading}
      />
      {loading && <div className="search-loading">Searching...</div>}
      {error && <div className="search-error">{error}</div>}
    </div>
  );
};

export default CardSearch; 