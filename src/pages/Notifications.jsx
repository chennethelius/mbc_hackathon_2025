import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { getUserNotifications, markNotificationAsRead } from '../services/notificationService';
import ProfileCard from '../components/ProfileCard';
import './Notifications.css';

function Notifications() {
  const { ready, authenticated, user: privyUser } = usePrivy();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    if (ready && !authenticated) {
      // Redirect or show login message if needed
    }
  }, [ready, authenticated]);

  // Load notifications from backend
  useEffect(() => {
    const loadNotifications = async () => {
      if (authenticated && privyUser?.id) {
        setLoading(true);
        const result = await getUserNotifications(privyUser.id);
        if (result.success) {
          setNotifications(result.notifications || []);
        } else {
          console.error('Error loading notifications:', result.error);
        }
        setLoading(false);
      }
    };

    loadNotifications();
  }, [authenticated, privyUser?.id]);

  // Handle notification click - show profile if it's a match notification
  const handleNotificationClick = async (notification) => {
    // Mark as read
    if (!notification.read && notification.id) {
      await markNotificationAsRead(notification.id);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    // If it's a match notification with a related user profile, show it
    if (notification.type === 'match' && notification.related_user_profile) {
      setSelectedProfile(notification.related_user_profile);
      setShowProfilePopup(true);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Calculate remaining time until deadline
  const getTimeRemaining = (deadlineString) => {
    if (!deadlineString) return null;
    const deadline = new Date(deadlineString);
    const now = currentTime; // Use currentTime state to trigger updates
    const diffMs = deadline - now;
    
    if (diffMs <= 0) return 'Expired';
    
    const diffDays = Math.floor(diffMs / 86400000);
    const diffHours = Math.floor((diffMs % 86400000) / 3600000);
    const diffMins = Math.floor((diffMs % 3600000) / 60000);
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} remaining`;
    } else {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} remaining`;
    }
  };

  // Handle accept button (placeholder for now)
  const handleAccept = (e, notification) => {
    e.stopPropagation();
    console.log('Accept match:', notification.id);
    // TODO: Implement accept functionality
  };

  // Handle reject button (placeholder for now)
  const handleReject = (e, notification) => {
    e.stopPropagation();
    console.log('Reject match:', notification.id);
    // TODO: Implement reject functionality
  };

  // Check if user is the matcher (not the matched person)
  const isMatcher = (notification) => {
    return notification.matcher_id === privyUser?.id;
  };

  // Update timer every minute to keep it current
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  if (!ready) {
    return (
      <div className="notifications-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="notifications-page">
        <div className="notifications-container">
          <h1>Notifications</h1>
          <p>Please log in to view your notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <div className="notifications-container">
        <h1>Notifications & Updates</h1>
        
        {loading ? (
          <div className="loading">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔔</div>
            <h2>No notifications yet</h2>
            <p>You're all caught up! Check back later for updates.</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
                style={{ cursor: notification.type === 'match' ? 'pointer' : 'default' }}
              >
                <div className="notification-content">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  {notification.type === 'match' && notification.deadline && (
                    <div className="notification-deadline">
                      <span className="deadline-label">⏰</span>
                      <span className="deadline-time">{getTimeRemaining(notification.deadline)}</span>
                    </div>
                  )}
                  <span className="notification-time">{formatDate(notification.created_at)}</span>
                  {notification.type === 'match' && notification.related_user_profile && (
                    <div className="notification-hint">Click to view profile</div>
                  )}
                  {notification.type === 'match' && !isMatcher(notification) && notification.requires_response && (
                    <div className="notification-actions" onClick={(e) => e.stopPropagation()}>
                      <button 
                        className="accept-button"
                        onClick={(e) => handleAccept(e, notification)}
                      >
                        Accept ✓
                      </button>
                      <button 
                        className="reject-button"
                        onClick={(e) => handleReject(e, notification)}
                      >
                        Reject ✗
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Profile Popup Modal */}
      {showProfilePopup && selectedProfile && (
        <div className="info-popup-overlay" onClick={() => setShowProfilePopup(false)}>
          <div className="info-popup" onClick={(e) => e.stopPropagation()}>
            <button className="close-popup-btn" onClick={() => setShowProfilePopup(false)}>
              ×
            </button>
            <div className="info-popup-content">
              <ProfileCard profile={selectedProfile} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notifications;

