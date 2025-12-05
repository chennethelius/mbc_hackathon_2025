import { useState, useEffect } from 'react';
import { getUserVouchStats, getVouchesReceived, getVouchHistory } from '../services/vouchService';
import './VouchProfile.css';

function VouchProfile({ userId }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [vouchesReceived, setVouchesReceived] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState('all'); // 'all', 'gains', 'losses'
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const loadData = async () => {
    setLoading(true);

    try {
      // Load user stats
      const statsResult = await getUserVouchStats(userId);
      if (statsResult.success) {
        setStats(statsResult.stats);
      }

      // Load vouches received
      const receivedResult = await getVouchesReceived(userId);
      if (receivedResult.success) {
        setVouchesReceived(receivedResult.vouches || []);
      }

      // Load history
      const historyResult = await getVouchHistory(userId, 50);
      if (historyResult.success) {
        setHistory(historyResult.history || []);
      }
    } catch (error) {
      console.error('Error loading vouch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredHistory = () => {
    if (activeHistoryTab === 'gains') {
      return history.filter(h => h.points_change > 0);
    } else if (activeHistoryTab === 'losses') {
      return history.filter(h => h.points_change < 0);
    }
    return history;
  };

  const formatEventType = (type) => {
    switch (type) {
      case 'date_success':
        return { label: 'Date Success', icon: '✅', color: '#28a745' };
      case 'date_fail':
        return { label: 'Date Failed', icon: '❌', color: '#dc3545' };
      case 'vouch_given':
        return { label: 'Vouch Given', icon: '🎯', color: '#667eea' };
      case 'vouch_updated':
        return { label: 'Vouch Updated', icon: '🔄', color: '#17a2b8' };
      default:
        return { label: type, icon: '📝', color: '#6c757d' };
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="vouch-profile-loading">
        <div className="loading-spinner">Loading your vouch profile...</div>
      </div>
    );
  }

  return (
    <div className="vouch-profile">
      {/* Hero Section */}
      <div className="vouch-profile-hero">
        <div className="vouch-score-display">
          <div className="vouch-score-circle">
            <div className="vouch-score-value">{stats?.vouch_score?.toFixed(1) || '0.0'}</div>
            <div className="vouch-score-max">/ 5.0</div>
          </div>
          <div className="vouch-score-title-with-info">
            <h2>Your Vouch Score</h2>
            <button className="vouch-info-button" onClick={() => setShowInfo(true)} title="About vouch scores">
              i
            </button>
          </div>
          <p className="vouch-score-description">
            Average rating from {stats?.total_vouches_received || 0} friend{stats?.total_vouches_received !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="vouch-profile-stats">
          <div className="vouch-profile-stat">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{vouchesReceived.length}</span>
            <span className="stat-label">Vouches</span>
          </div>
          <div className="vouch-profile-stat">
            <span className="stat-icon">💰</span>
            <span className="stat-value">{stats?.budget?.toFixed(1) || '0.0'}</span>
            <span className="stat-label">Budget</span>
          </div>
          <div className="vouch-profile-stat">
            <span className="stat-icon">🎯</span>
            <span className="stat-value">{stats?.total_allocated?.toFixed(1) || '0.0'}</span>
            <span className="stat-label">Given</span>
          </div>
        </div>
      </div>

      {/* Vouches Received */}
      <div className="vouch-profile-section">
        <h3>Who Vouches for You</h3>
        {vouchesReceived.length === 0 ? (
          <div className="vouch-empty-state">
            <div className="empty-state-icon">⭐</div>
            <p>No vouches yet. Your friends haven't vouched for you.</p>
          </div>
        ) : (
          <div className="vouches-received-list">
            {vouchesReceived.map((vouch) => (
              <div key={vouch.id} className="vouch-received-card">
                <div className="vouch-received-avatar">
                  {vouch.voucher?.photos?.[0] ? (
                    <img src={vouch.voucher.photos[0]} alt={vouch.voucher.display_name} />
                  ) : (
                    <div className="vouch-received-avatar-placeholder">
                      {(vouch.voucher?.display_name || vouch.voucher?.username || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="vouch-received-info">
                  <h4>{vouch.voucher?.display_name || vouch.voucher?.username || 'Unknown'}</h4>
                  {vouch.voucher?.username && <p className="vouch-received-username">@{vouch.voucher.username}</p>}
                </div>
                <div className="vouch-received-points">
                  <div className="vouch-stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} className={i < vouch.points ? 'star-filled' : 'star-empty'}>
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="vouch-points-value">{parseFloat(vouch.points).toFixed(1)}/5.0</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Vouch History */}
      <div className="vouch-profile-section">
        <div className="vouch-history-header">
          <h3>Vouch History</h3>
          <div className="history-tabs">
            <button
              className={`history-tab ${activeHistoryTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveHistoryTab('all')}
            >
              All
            </button>
            <button
              className={`history-tab ${activeHistoryTab === 'gains' ? 'active' : ''}`}
              onClick={() => setActiveHistoryTab('gains')}
            >
              Gains
            </button>
            <button
              className={`history-tab ${activeHistoryTab === 'losses' ? 'active' : ''}`}
              onClick={() => setActiveHistoryTab('losses')}
            >
              Losses
            </button>
          </div>
        </div>

        {getFilteredHistory().length === 0 ? (
          <div className="vouch-empty-state">
            <div className="empty-state-icon">📜</div>
            <p>No history to show.</p>
          </div>
        ) : (
          <div className="vouch-history-list">
            {getFilteredHistory().map((event) => {
              const eventInfo = formatEventType(event.event_type);
              return (
                <div key={event.id} className="vouch-history-item">
                  <div className="history-icon" style={{ background: eventInfo.color }}>
                    {eventInfo.icon}
                  </div>
                  <div className="history-content">
                    <div className="history-main">
                      <span className="history-type">{eventInfo.label}</span>
                      {event.related_user && (
                        <span className="history-related">
                          {event.related_user.display_name || event.related_user.username || 'User'}
                        </span>
                      )}
                    </div>
                    <div className="history-details">
                      <span className="history-time">{formatDate(event.created_at)}</span>
                      <span className="history-budget">Budget: {parseFloat(event.budget_after).toFixed(1)}</span>
                    </div>
                  </div>
                  <div className={`history-change ${event.points_change > 0 ? 'positive' : 'negative'}`}>
                    {event.points_change > 0 ? '+' : ''}{parseFloat(event.points_change).toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Modal */}
      {showInfo && (
        <div className="vouch-info-modal-overlay" onClick={() => setShowInfo(false)}>
          <div className="vouch-info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="vouch-info-header">
              <h3>About Vouch Scores</h3>
              <button className="vouch-info-close" onClick={() => setShowInfo(false)}>×</button>
            </div>
            <div className="vouch-info-content">
              <div className="vouch-info-section">
                <div className="vouch-info-icon">📊</div>
                <div className="vouch-info-text">
                  <h4>What is a Vouch Score?</h4>
                  <p>Your vouch score is the average of all the vouch points your friends have given you. It represents how much your friends trust and recommend you.</p>
                </div>
              </div>
              <div className="vouch-info-section">
                <div className="vouch-info-icon">💡</div>
                <div className="vouch-info-text">
                  <h4>How to Improve Your Score</h4>
                  <p>Have great dates! When your dates go well, the friends who vouched for you gain points, encouraging them to vouch higher.</p>
                </div>
              </div>
              <div className="vouch-info-section">
                <div className="vouch-info-icon">🎯</div>
                <div className="vouch-info-text">
                  <h4>Budget & Rewards</h4>
                  <p>Friends who vouch for you gain or lose budget based on your date outcomes. Good dates reward them, incentivizing accurate vouches.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VouchProfile;

