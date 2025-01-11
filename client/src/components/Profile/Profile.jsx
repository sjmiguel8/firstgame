import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Profile.css';

const Profile = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      if (!currentUser) return;
      
      const response = await fetch(`/api/profile/${currentUser.uid}`, {
        headers: {
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
      setUsername(data.username);
    } catch (error) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/profile/${currentUser.uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await currentUser.getIdToken()}`
        },
        body: JSON.stringify({ username })
      });
      
      if (response.ok) {
        setProfile({ ...profile, username });
        setEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      setError(error.message);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>{editing ? 'Edit Profile' : 'Profile'}</h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="edit-button">
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="button-group">
              <button type="submit" className="save-button">
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setUsername(profile.username);
                }}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-item">
              <label>Username:</label>
              <span>{profile.username}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{profile.email}</span>
            </div>
            <div className="stats">
              <h3>Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <label>Wins:</label>
                  <span>{profile.stats.wins}</span>
                </div>
                <div className="stat-item">
                  <label>Losses:</label>
                  <span>{profile.stats.losses}</span>
                </div>
                <div className="stat-item">
                  <label>Win Rate:</label>
                  <span>
                    {profile.stats.wins + profile.stats.losses > 0
                      ? `${Math.round(
                          (profile.stats.wins /
                            (profile.stats.wins + profile.stats.losses)) *
                            100
                        )}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile; 