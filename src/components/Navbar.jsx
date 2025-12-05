import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingRequestsCount } from '../services/friendsService';
import LoginModal from './LoginModal';
import './Navbar.css';

function Navbar({ user, authenticated, onLogout }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const navigate = useNavigate();

  // Load pending friend requests count
  useEffect(() => {
    if (authenticated && user?.id) {
      loadPendingRequestsCount();
      
      // Refresh count every 30 seconds
      const interval = setInterval(loadPendingRequestsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, user?.id]);

  const loadPendingRequestsCount = async () => {
    if (user?.id) {
      const result = await getPendingRequestsCount(user.id);
      if (result.success) {
        setPendingRequestsCount(result.count || 0);
      }
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h2>MBC Hackathon 2025</h2>
        </div>
        <div className="navbar-actions">
          {authenticated && (
            <>
              <button onClick={() => navigate('/friends')} className="btn-friends-nav">
                👥 Friends
                {pendingRequestsCount > 0 && (
                  <span className="notification-badge">{pendingRequestsCount}</span>
                )}
              </button>
              <button onClick={() => navigate('/wallet')} className="btn-wallet">
                💼 Wallet
              </button>
              <button onClick={() => navigate('/settings')} className="btn-settings" title="Settings">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
              <button onClick={onLogout} className="btn-logout">
                Log Out
              </button>
            </>
          )}
          {!authenticated && (
            <button 
              onClick={() => setShowLoginModal(true)} 
              className="btn-login"
            >
              Login
            </button>
          )}
        </div>
      </nav>

      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)}
        />
      )}
    </>
  );
}

export default Navbar;

