import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import {
  getFriends,
  getPendingRequests,
  getSentRequests,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  removeFriend,
  searchUsers
} from '../services/friendsService';
import FriendCard from '../components/FriendCard';
import FriendRequestCard from '../components/FriendRequestCard';
import UserSearchCard from '../components/UserSearchCard';
import VouchForOthers from '../components/VouchForOthers';
import VouchProfile from '../components/VouchProfile';
import './Friends.css';

function Friends() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'all');
  const navigate = useNavigate();
  const { ready, authenticated, user: privyUser } = usePrivy();

  // Data state
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'

  const tabs = [
    { id: 'all', label: 'All Friends', count: friends.length },
    { id: 'requests', label: 'Requests', count: incomingRequests.length },
    { id: 'sent', label: 'Sent', count: sentRequests.length },
    { id: 'find', label: 'Find Friends', count: null },
    { id: 'vouch-others', label: 'Vouch for Others', count: null },
    { id: 'vouch-profile', label: 'Your Vouch Profile', count: null }
  ];

  // Check authentication
  useEffect(() => {
    if (ready && !authenticated) {
      navigate('/');
    }
  }, [ready, authenticated, navigate]);

  // Load data based on active tab
  useEffect(() => {
    if (privyUser) {
      loadTabData();
    }
  }, [activeTab, privyUser]);

  const loadTabData = async () => {
    setLoading(true);
    setMessage('');

    try {
      switch (activeTab) {
        case 'all':
          await loadFriends();
          break;
        case 'requests':
          await loadIncomingRequests();
          break;
        case 'sent':
          await loadSentRequests();
          break;
        case 'find':
          // Search is triggered by user input
          break;
        case 'vouch-others':
        case 'vouch-profile':
          // Vouch tabs - no data to preload
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading tab data:', error);
      showMessage('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async () => {
    const result = await getFriends(privyUser.id);
    if (result.success) {
      setFriends(result.friends || []);
    } else {
      showMessage('Error loading friends: ' + result.error, 'error');
    }
  };

  const loadIncomingRequests = async () => {
    const result = await getPendingRequests(privyUser.id);
    if (result.success) {
      setIncomingRequests(result.requests || []);
    } else {
      showMessage('Error loading requests: ' + result.error, 'error');
    }
  };

  const loadSentRequests = async () => {
    const result = await getSentRequests(privyUser.id);
    if (result.success) {
      setSentRequests(result.requests || []);
    } else {
      showMessage('Error loading sent requests: ' + result.error, 'error');
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const result = await searchUsers(searchQuery, privyUser.id);
    setLoading(false);

    if (result.success) {
      setSearchResults(result.users || []);
      if (result.users.length === 0) {
        showMessage('No users found matching your search', 'info');
      }
    } else {
      showMessage('Error searching users: ' + result.error, 'error');
    }
  };

  const handleAddFriend = async (user) => {
    const result = await sendFriendRequest(privyUser.id, user.id);
    if (result.success) {
      showMessage(`Friend request sent to ${user.display_name || user.username}!`, 'success');
    } else {
      showMessage('Error sending friend request: ' + result.error, 'error');
    }
  };

  const handleCancelRequest = async (request) => {
    const result = await removeFriend(request.id);
    if (result.success) {
      showMessage('Friend request cancelled', 'success');
      await loadSentRequests();
    } else {
      showMessage('Error cancelling request: ' + result.error, 'error');
    }
  };

  const handleAcceptRequest = async (request) => {
    const result = await acceptFriendRequest(request.id);
    if (result.success) {
      showMessage(`You are now friends with ${request.profile?.display_name || request.profile?.username}!`, 'success');
      await loadIncomingRequests();
      await loadFriends();
    } else {
      showMessage('Error accepting request: ' + result.error, 'error');
    }
  };

  const handleRejectRequest = async (request) => {
    const result = await rejectFriendRequest(request.id);
    if (result.success) {
      showMessage('Friend request rejected', 'success');
      await loadIncomingRequests();
    } else {
      showMessage('Error rejecting request: ' + result.error, 'error');
    }
  };

  const handleRemoveFriend = async (friend) => {
    if (!window.confirm(`Remove ${friend.profile?.display_name || friend.profile?.username} from your friends?`)) {
      return;
    }

    const result = await removeFriend(friend.id);
    if (result.success) {
      showMessage('Friend removed', 'success');
      await loadFriends();
    } else {
      showMessage('Error removing friend: ' + result.error, 'error');
    }
  };

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <div className="friends-page-loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!authenticated || !privyUser) {
    return null;
  }

  return (
    <div className="friends-page">
      <div className="friends-container">
        <div className="friends-header">
          <h1>Friends</h1>
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
        
        {message && (
          <div className={`friends-message ${messageType}`}>
            {message}
          </div>
        )}

        <div className="friends-content">
          <div className="friends-tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon && <span className="tab-icon">{tab.icon}</span>}
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="tab-count">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          <div className="friends-panel">
            {/* All Friends Tab */}
            {activeTab === 'all' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Your Friends ({friends.length})</h2>
                </div>
                
                {loading ? (
                  <div className="loading-state">Loading friends...</div>
                ) : friends.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <h3>No friends yet</h3>
                    <p>Start connecting with people by searching for users!</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setActiveTab('find')}
                    >
                      Find Friends
                    </button>
                  </div>
                ) : (
                  <div className="friends-grid">
                    {friends.map((friend) => (
                      <FriendCard
                        key={friend.id}
                        friend={friend}
                        onRemove={handleRemoveFriend}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Incoming Requests Tab */}
            {activeTab === 'requests' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Friend Requests ({incomingRequests.length})</h2>
                </div>
                
                {loading ? (
                  <div className="loading-state">Loading requests...</div>
                ) : incomingRequests.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📬</div>
                    <h3>No pending requests</h3>
                    <p>You don't have any friend requests at the moment.</p>
                  </div>
                ) : (
                  <div className="requests-list">
                    {incomingRequests.map((request) => (
                      <FriendRequestCard
                        key={request.id}
                        request={request}
                        type="incoming"
                        onAccept={handleAcceptRequest}
                        onReject={handleRejectRequest}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Sent Requests Tab */}
            {activeTab === 'sent' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Sent Requests ({sentRequests.length})</h2>
                </div>
                
                {loading ? (
                  <div className="loading-state">Loading sent requests...</div>
                ) : sentRequests.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">📤</div>
                    <h3>No sent requests</h3>
                    <p>You haven't sent any friend requests yet.</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setActiveTab('find')}
                    >
                      Find Friends
                    </button>
                  </div>
                ) : (
                  <div className="requests-list">
                    {sentRequests.map((request) => (
                      <FriendRequestCard
                        key={request.id}
                        request={request}
                        type="outgoing"
                        onReject={handleCancelRequest}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Find Friends Tab */}
            {activeTab === 'find' && (
              <div className="tab-content">
                <div className="tab-header">
                  <h2>Find Friends</h2>
                </div>
                
                <form className="search-form" onSubmit={handleSearch}>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Search by username or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <button type="submit" className="btn-search" disabled={loading}>
                    {loading ? 'Searching...' : '🔍 Search'}
                  </button>
                </form>

                {searchResults.length > 0 ? (
                  <div className="search-results">
                    <p className="results-count">
                      Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                    </p>
                    <div className="users-list">
                      {searchResults.map((user) => (
                        <UserSearchCard
                          key={user.id}
                          user={user}
                          currentUserId={privyUser.id}
                          onAddFriend={handleAddFriend}
                          onCancelRequest={handleCancelRequest}
                        />
                      ))}
                    </div>
                  </div>
                ) : searchQuery && !loading ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try searching with a different username or name.</p>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">👋</div>
                    <h3>Search for friends</h3>
                    <p>Enter a username or name to find people to connect with.</p>
                  </div>
                )}
              </div>
            )}

            {/* Vouch for Others Tab */}
            {activeTab === 'vouch-others' && (
              <div className="tab-content">
                <VouchForOthers userId={privyUser.id} />
              </div>
            )}

            {/* Your Vouch Profile Tab */}
            {activeTab === 'vouch-profile' && (
              <div className="tab-content">
                <VouchProfile userId={privyUser.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Friends;

