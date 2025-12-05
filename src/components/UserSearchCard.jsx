import { useState, useEffect } from 'react';
import { getFriendshipStatus } from '../services/friendsService';
import './UserSearchCard.css';

function UserSearchCard({ user, currentUserId, onAddFriend, onCancelRequest }) {
  const [friendshipStatus, setFriendshipStatus] = useState('none');
  const [loading, setLoading] = useState(true);
  const displayPhoto = user.photos?.[0] || null;

  useEffect(() => {
    checkFriendshipStatus();
  }, [user.id, currentUserId]);

  const checkFriendshipStatus = async () => {
    setLoading(true);
    const result = await getFriendshipStatus(currentUserId, user.id);
    if (result.success) {
      setFriendshipStatus(result.status || 'none');
    }
    setLoading(false);
  };

  const handleAddFriend = async () => {
    await onAddFriend(user);
    setFriendshipStatus('pending');
  };

  const handleCancelRequest = async () => {
    await onCancelRequest(user);
    setFriendshipStatus('none');
  };

  const renderActionButton = () => {
    if (loading) {
      return <button className="btn-loading" disabled>...</button>;
    }

    switch (friendshipStatus) {
      case 'accepted':
        return <button className="btn-friends" disabled>✓ Friends</button>;
      case 'pending':
        return <button className="btn-pending" onClick={handleCancelRequest}>⏱ Pending</button>;
      case 'none':
      default:
        return <button className="btn-add-friend" onClick={handleAddFriend}>+ Add Friend</button>;
    }
  };

  return (
    <div className="user-search-card">
      <div className="user-search-avatar">
        {displayPhoto ? (
          <img src={displayPhoto} alt={user.display_name || user.username || user.email} />
        ) : (
          <div className="user-search-avatar-placeholder">
            {(user.display_name || user.username || user.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="user-search-info">
        <h3 className="user-search-name">
          {user.display_name || user.username || user.email || 'Unknown User'}
        </h3>
        {user.username && <p className="user-search-username">@{user.username}</p>}
        {!user.username && user.email && <p className="user-search-username">{user.email}</p>}
        {user.university && <p className="user-search-detail">🎓 {user.university}</p>}
        {user.location && <p className="user-search-detail">📍 {user.location}</p>}
        {user.bio && <p className="user-search-bio">{user.bio.substring(0, 60)}{user.bio.length > 60 ? '...' : ''}</p>}
      </div>
      
      <div className="user-search-actions">
        {renderActionButton()}
      </div>
    </div>
  );
}

export default UserSearchCard;

