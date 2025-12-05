import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import './Notifications.css';

function Notifications() {
  const { ready, authenticated, user: privyUser } = usePrivy();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && !authenticated) {
      // Redirect or show login message if needed
    }
  }, [ready, authenticated]);

  // Placeholder for loading notifications
  useEffect(() => {
    if (authenticated && privyUser?.id) {
      // TODO: Load notifications from backend
      setNotifications([]);
    }
  }, [authenticated, privyUser?.id]);

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
            {notifications.map((notification, index) => (
              <div key={index} className="notification-item">
                <div className="notification-content">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <span className="notification-time">{notification.time}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Notifications;

