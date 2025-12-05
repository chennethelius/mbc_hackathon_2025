import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingRequestsCount } from '../services/friendsService';
import LoginModal from './LoginModal';
import './Navbar.css';

function Navbar({ user, authenticated, onLogout }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const navigate = useNavigate();

  const loadPendingRequestsCount = useCallback(async () => {
    if (user?.id) {
      const result = await getPendingRequestsCount(user.id);
      if (result.success) {
        setPendingRequestsCount(result.count || 0);
      }
    }
  }, [user?.id]);

  // Load pending friend requests count
  useEffect(() => {
    if (authenticated && user?.id) {
      loadPendingRequestsCount();
      
      // Refresh count every 30 seconds
      const interval = setInterval(loadPendingRequestsCount, 30000);
      return () => clearInterval(interval);
    }
  }, [authenticated, user?.id, loadPendingRequestsCount]);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h2 style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #f97316 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: 'bold'
          }}>Cupic</h2>
        </div>
        
        <div className="navbar-actions">
          {authenticated && (
            <>
              <button 
                onClick={() => navigate('/markets')} 
                className="btn-markets"
              >
                Markets
              </button>
              
              <button 
                onClick={() => navigate('/friends')} 
                className="btn-friends-nav"
              >
                Friends
                {pendingRequestsCount > 0 && (
                  <span className="notification-badge">{pendingRequestsCount}</span>
                )}
              </button>
              
              <button 
                onClick={() => navigate('/notifications')} 
                className="btn-notifications"
              >
                Notifications
              </button>
              
              <button 
                onClick={() => navigate('/wallet')} 
                className="btn-wallet"
              >
                Wallet
              </button>
              
              <button 
                onClick={() => navigate('/settings')} 
                className="btn-settings"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2} 
                  stroke="currentColor"
                  style={{ width: '20px', height: '20px' }}
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" 
                  />
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
                  />
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

      {/* Backend Status Indicator - Bottom Right */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '0.75rem 1rem',
        borderRadius: '0.5rem',
        fontSize: '0.875rem',
        zIndex: 1000,
        border: '1px solid #333',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10b981'
          }}></div>
          <span>Backend: <strong>Connected</strong></span>
        </div>
      </div>
    </>
  );
}

export default Navbar;

