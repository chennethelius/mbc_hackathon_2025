import { useNavigate } from 'react-router-dom';
import './FriendCard.css';

function FriendCard({ friend, onRemove, showActions = true }) {
  const navigate = useNavigate();
  const profile = friend.profile || friend;
  const displayPhoto = profile.photos?.[0] || null;

  return (
    <div className="friend-card">
      <div className="friend-card-avatar">
        {displayPhoto ? (
          <img src={displayPhoto} alt={profile.display_name || profile.username || profile.email} />
        ) : (
          <div className="friend-card-avatar-placeholder">
            {(profile.display_name || profile.username || profile.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="friend-card-info">
        <h3 className="friend-card-name">
          {profile.display_name || profile.username || profile.email || 'Unknown User'}
        </h3>
        {profile.username && <p className="friend-card-username">@{profile.username}</p>}
        {!profile.username && profile.email && <p className="friend-card-username">{profile.email}</p>}
        {profile.university && <p className="friend-card-detail">🎓 {profile.university}</p>}
        {profile.location && <p className="friend-card-detail">📍 {profile.location}</p>}
      </div>
      
      {showActions && (
        <div className="friend-card-actions">
          <button 
            className="btn-view-profile"
            onClick={() => navigate(`/profile/${profile.id}`)}
            title="View Profile"
          >
            View Profile
          </button>
          <button 
            className="btn-remove-friend"
            onClick={() => onRemove(friend)}
            title="Remove Friend"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}

export default FriendCard;

