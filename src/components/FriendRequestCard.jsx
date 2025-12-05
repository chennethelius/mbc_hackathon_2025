import './FriendRequestCard.css';

function FriendRequestCard({ request, onAccept, onReject, type = 'incoming' }) {
  const profile = request.profile || request;
  const displayPhoto = profile.photos?.[0] || null;

  return (
    <div className="friend-request-card">
      <div className="friend-request-avatar">
        {displayPhoto ? (
          <img src={displayPhoto} alt={profile.display_name || profile.username || profile.email} />
        ) : (
          <div className="friend-request-avatar-placeholder">
            {(profile.display_name || profile.username || profile.email || '?').charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      
      <div className="friend-request-info">
        <h3 className="friend-request-name">
          {profile.display_name || profile.username || profile.email || 'Unknown User'}
        </h3>
        {profile.username && <p className="friend-request-username">@{profile.username}</p>}
        {!profile.username && profile.email && <p className="friend-request-username">{profile.email}</p>}
        {profile.university && <p className="friend-request-detail">🎓 {profile.university}</p>}
        {profile.bio && <p className="friend-request-bio">{profile.bio.substring(0, 80)}{profile.bio.length > 80 ? '...' : ''}</p>}
        <p className="friend-request-time">
          {type === 'incoming' ? 'Sent' : 'Requested'} {new Date(request.created_at).toLocaleDateString()}
        </p>
      </div>
      
      <div className="friend-request-actions">
        {type === 'incoming' ? (
          <>
            <button 
              className="btn-accept"
              onClick={() => onAccept(request)}
            >
              ✓ Accept
            </button>
            <button 
              className="btn-reject"
              onClick={() => onReject(request)}
            >
              ✕ Reject
            </button>
          </>
        ) : (
          <button 
            className="btn-cancel"
            onClick={() => onReject(request)}
          >
            Cancel Request
          </button>
        )}
      </div>
    </div>
  );
}

export default FriendRequestCard;

