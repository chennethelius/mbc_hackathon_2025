import './ProfileCard.css';

function ProfileCard({ profile, compact = false }) {
  if (!profile) {
    return (
      <div className={`profile-card ${compact ? 'profile-card-compact' : ''}`}>
        <p>No profile information available</p>
      </div>
    );
  }

  // Get profile image - prefer avatar_url, then photos[0]
  const profileImage = profile.avatar_url || profile.photos?.[0] || null;
  const displayName = profile.display_name || profile.username || 'Unknown User';
  const age = profile.age || null;
  const university = profile.university || null;
  const interests = profile.interests || [];

  return (
    <div className={`profile-card ${compact ? 'profile-card-compact' : ''}`}>
      {!compact && (
        <div className="profile-card-header">
          <div className="profile-card-avatar">
            {profileImage ? (
              <img src={profileImage} alt={displayName} />
            ) : (
              <div className="profile-card-avatar-placeholder">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="profile-card-name">{displayName}</h3>
        </div>
      )}
      
      {compact && (
        <div className="profile-card-header-compact">
          <div className="profile-card-avatar-compact">
            {profileImage ? (
              <img src={profileImage} alt={displayName} />
            ) : (
              <div className="profile-card-avatar-placeholder-compact">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="profile-card-name-compact">{displayName}</h3>
        </div>
      )}

      <div className="profile-card-details">
        <div className="profile-card-detail">
          <span className="detail-label">Age:</span>
          <span className="detail-value">{age || '-'}</span>
        </div>

        <div className="profile-card-detail">
          <span className="detail-label">University:</span>
          <span className="detail-value">{university || '-'}</span>
        </div>

        <div className="profile-card-detail profile-card-interests">
          <span className="detail-label">Interests:</span>
          {interests && interests.length > 0 ? (
            <div className="interests-list">
              {interests.map((interest, index) => (
                <span key={index} className="interest-tag">
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <span className="detail-value">-</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileCard;

