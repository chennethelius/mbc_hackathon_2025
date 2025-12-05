import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { supabase } from '../services/supabase';
import { getFriendshipStatus } from '../services/friendsService';
import './Profile.css';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { ready, authenticated, user: privyUser } = usePrivy();

  const [profile, setProfile] = useState(null);
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isOwnProfile = privyUser?.id === userId;

  useEffect(() => {
    if (ready && !authenticated) {
      navigate('/');
    }
  }, [ready, authenticated, navigate]);

  useEffect(() => {
    if (privyUser && userId) {
      loadProfile();
      if (!isOwnProfile) {
        checkFriendship();
      }
    }
  }, [privyUser, userId, isOwnProfile]);

  const loadProfile = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!data) {
        setError('Profile not found');
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const checkFriendship = async () => {
    const result = await getFriendshipStatus(privyUser.id, userId);
    if (result.success) {
      setFriendshipStatus(result.status);
    }
  };

  const canViewFullProfile = isOwnProfile || friendshipStatus === 'accepted';

  if (!ready || loading) {
    return (
      <div className="profile-page-loading">
        <div className="loading-spinner">Loading profile...</div>
      </div>
    );
  }

  if (!authenticated || !privyUser) {
    return null;
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <div className="error-message">
            <h2>{error}</h2>
            <button onClick={() => navigate(-1)} className="btn-back">
              ← Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const displayPhoto = profile.photos?.[0] || null;
  const galleryPhotos = profile.photos?.slice(1) || [];

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          {isOwnProfile && (
            <button className="btn-edit" onClick={() => navigate('/settings')}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        <div className="profile-content">
          {/* Profile Picture & Basic Info */}
          <div className="profile-main">
            <div className="profile-avatar-large">
              {displayPhoto ? (
                <img src={displayPhoto} alt={profile.display_name || profile.username || profile.email} />
              ) : (
                <div className="profile-avatar-placeholder">
                  {(profile.display_name || profile.username || profile.email || '?').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="profile-basic-info">
              <h1 className="profile-name">
                {profile.display_name || profile.username || profile.email || 'Unknown User'}
              </h1>
              {profile.username && <p className="profile-username">@{profile.username}</p>}
              {!profile.username && profile.email && <p className="profile-email">{profile.email}</p>}
              
              {!isOwnProfile && friendshipStatus && (
                <div className="friendship-badge">
                  {friendshipStatus === 'accepted' && <span className="badge-friends">✓ Friends</span>}
                  {friendshipStatus === 'pending' && <span className="badge-pending">⏱ Request Pending</span>}
                  {friendshipStatus === 'none' && <span className="badge-none">Not Friends</span>}
                </div>
              )}
            </div>
          </div>

          {/* Show limited info if not friends */}
          {!canViewFullProfile && (
            <div className="limited-profile">
              <div className="locked-message">
                <div className="lock-icon">🔒</div>
                <h3>Private Profile</h3>
                <p>Become friends to view {profile.display_name || profile.username || 'this user'}'s full profile</p>
              </div>
            </div>
          )}

          {/* Full Profile (only for friends or own profile) */}
          {canViewFullProfile && (
            <div className="profile-details">
              {/* Bio Section */}
              <div className="profile-section">
                <h2>About</h2>
                <p className="profile-bio">{profile.bio || <span className="empty-field">No bio added yet</span>}</p>
              </div>

              {/* Basic Info Grid */}
              <div className="profile-section">
                <h2>Basic Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Age</span>
                    <span className="info-value">{profile.age || <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gender</span>
                    <span className="info-value">{profile.gender || <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Height</span>
                    <span className="info-value">{profile.height || <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Location</span>
                    <span className="info-value">{profile.location ? `📍 ${profile.location}` : <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Interested In</span>
                    <span className="info-value">{profile.interested_in || <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Looking For</span>
                    <span className="info-value">{profile.looking_for || <span className="empty-field">—</span>}</span>
                  </div>
                </div>
              </div>

              {/* Education & Career */}
              <div className="profile-section">
                <h2>Education & Career</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">University</span>
                    <span className="info-value">{profile.university ? `🎓 ${profile.university}` : <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Year</span>
                    <span className="info-value">{profile.grade || <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Education Level</span>
                    <span className="info-value">{profile.education_level || <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Occupation</span>
                    <span className="info-value">{profile.occupation || <span className="empty-field">—</span>}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Company</span>
                    <span className="info-value">{profile.company || <span className="empty-field">—</span>}</span>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="profile-section">
                <h2>Interests & Hobbies</h2>
                {profile.interests && profile.interests.length > 0 ? (
                  <div className="interests-tags">
                    {profile.interests.map((interest, index) => (
                      <span key={index} className="interest-tag">
                        {interest}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="empty-field">No interests added yet</p>
                )}
              </div>

              {/* Photo Gallery */}
              <div className="profile-section">
                <h2>Photos</h2>
                {galleryPhotos.length > 0 ? (
                  <div className="photo-gallery-grid">
                    {galleryPhotos.map((photo, index) => (
                      <div key={index} className="gallery-photo">
                        <img src={photo} alt={`Photo ${index + 1}`} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-field">No additional photos</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Profile;

