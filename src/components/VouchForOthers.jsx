import { useState, useEffect } from 'react';
import { getUserVouchStats, getFriendVouches, setVouch } from '../services/vouchService';
import './VouchForOthers.css';

function VouchForOthers({ userId }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [friendVouches, setFriendVouches] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info');
  const [savingVouch, setSavingVouch] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setLoading(true);
    setMessage('');

    try {
      // Load user stats
      const statsResult = await getUserVouchStats(userId);
      if (statsResult.success) {
        setStats(statsResult.stats);
      } else {
        showMessage('Error loading vouch stats: ' + statsResult.error, 'error');
      }

      // Load friend vouches
      const friendsResult = await getFriendVouches(userId);
      if (friendsResult.success) {
        setFriendVouches(friendsResult.friendVouches || []);
      } else {
        showMessage('Error loading friends: ' + friendsResult.error, 'error');
      }
    } catch (error) {
      console.error('Error loading vouch data:', error);
      showMessage('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVouchChange = async (friendId, newPoints) => {
    setSavingVouch(friendId);
    setMessage('');

    try {
      const result = await setVouch(userId, friendId, newPoints);
      
      if (result.success) {
        showMessage('Vouch updated!', 'success');
        // Reload data to reflect changes
        await loadData();
      } else {
        showMessage(result.error || 'Error updating vouch', 'error');
      }
    } catch (error) {
      console.error('Error updating vouch:', error);
      showMessage('Error updating vouch', 'error');
    } finally {
      setSavingVouch(null);
    }
  };

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const getStarColor = (index, currentPoints) => {
    if (index < currentPoints) return '#FFD700'; // Gold
    return '#ddd'; // Gray
  };

  if (loading) {
    return (
      <div className="vouch-for-others-loading">
        <div className="loading-spinner">Loading vouch data...</div>
      </div>
    );
  }

  return (
    <div className="vouch-for-others">
      {/* Header with Info Button */}
      <div className="tab-header">
        <div className="vouch-title-with-info">
          <h2>Vouch for Your Friends</h2>
          <button className="vouch-info-button" onClick={() => setShowInfo(true)} title="How vouching works">
            i
          </button>
        </div>
      </div>

      {/* Stats Header */}
      <div className="vouch-stats-header">
        <div className="vouch-stat-card">
          <div className="vouch-stat-icon">💰</div>
          <div className="vouch-stat-info">
            <h3>Available Points</h3>
            <p className="vouch-stat-value">{stats?.budget?.toFixed(1) || '0.0'}</p>
            <p className="vouch-stat-detail">
              {stats?.total_allocated?.toFixed(1) || '0.0'} allocated
            </p>
          </div>
        </div>

        <div className="vouch-stat-card">
          <div className="vouch-stat-icon">👥</div>
          <div className="vouch-stat-info">
            <h3>Total Budget</h3>
            <p className="vouch-stat-value">
              {((stats?.base_budget || 0) + ((stats?.points_per_friend || 0) * friendVouches.length)).toFixed(1)}
            </p>
            <p className="vouch-stat-detail">
              {friendVouches.length} friends × {stats?.points_per_friend?.toFixed(1) || '3.0'} pts
            </p>
          </div>
        </div>

        <div className="vouch-stat-card">
          <div className="vouch-stat-icon">🎯</div>
          <div className="vouch-stat-info">
            <h3>Vouches Given</h3>
            <p className="vouch-stat-value">
              {friendVouches.filter(f => f.vouch_points > 0).length}
            </p>
            <p className="vouch-stat-detail">
              of {friendVouches.length} friends
            </p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`vouch-message ${messageType}`}>
          {message}
        </div>
      )}

      {/* Info Modal */}
      {showInfo && (
        <div className="vouch-info-modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="vouch-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vouch-info-header">
              <h3>How Vouching Works</h3>
              <button className="vouch-info-close" onClick={() => setShowInfo(false)}>×</button>
            </div>
            <div className="vouch-info-content">
              <ul>
                <li>🌟 Vouch for friends you trust (0-5 stars)</li>
                <li>💰 You get {stats?.base_budget || 20} base points + {stats?.points_per_friend || 3} per friend</li>
                <li>📈 When your vouched friends have successful dates, you gain points!</li>
                <li>📉 When they have failed dates, you lose points (risk/reward)</li>
                <li>🔄 You can redistribute your points at any time</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Friends List */}
      <div className="vouch-friends-section">
        {friendVouches.length === 0 ? (
          <div className="vouch-empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No friends yet</h3>
            <p>Add friends to start vouching for them!</p>
          </div>
        ) : (
          <div className="vouch-friends-list">
            {friendVouches.map((friend) => (
              <div key={friend.id} className="vouch-friend-card">
                <div className="vouch-friend-avatar">
                  {friend.photos?.[0] ? (
                    <img src={friend.photos[0]} alt={friend.display_name} />
                  ) : (
                    <div className="vouch-friend-avatar-placeholder">
                      {friend.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="vouch-friend-info">
                  <h3>{friend.display_name}</h3>
                  {friend.username && <p className="vouch-friend-username">@{friend.username}</p>}
                  {friend.vouch_score > 0 && (
                    <p className="vouch-friend-score">
                      Vouch Score: ⭐ {friend.vouch_score.toFixed(1)}/5.0
                    </p>
                  )}
                </div>

                <div className="vouch-friend-controls">
                  <div className="vouch-star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`vouch-star ${star <= friend.vouch_points ? 'active' : ''}`}
                        onClick={() => handleVouchChange(friend.id, star)}
                        disabled={savingVouch === friend.id}
                        title={`${star} star${star !== 1 ? 's' : ''}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <div className="vouch-points-display">
                    <span className="vouch-points-value">{friend.vouch_points.toFixed(1)}</span>
                    <span className="vouch-points-label">points</span>
                  </div>
                  {friend.vouch_points > 0 && (
                    <button
                      className="btn-clear-vouch"
                      onClick={() => handleVouchChange(friend.id, 0)}
                      disabled={savingVouch === friend.id}
                      title="Clear vouch"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {savingVouch === friend.id && (
                  <div className="vouch-saving-indicator">Saving...</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VouchForOthers;

