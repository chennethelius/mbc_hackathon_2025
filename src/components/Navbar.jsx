import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPendingRequestsCount } from '../services/friendsService';
import LoginModal from './LoginModal';
import './Navbar.css';

function Navbar({ user, authenticated, onLogout }) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

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

  const tabs = [
    { id: 'markets', label: 'Markets', icon: '📊', path: '/markets' },
    { id: 'friends', label: 'Friends', icon: '👥', path: '/friends' },
    { id: 'contracts', label: 'Contracts', icon: '📜', path: '/contracts' },
    { id: 'wallet', label: 'Wallet', icon: '💰', path: '/wallet' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/settings' }
  ];

  const isActiveTab = (path) => {
    if (path === '/markets') {
      return location.pathname === '/' || location.pathname === '/markets';
    }
    if (path === '/contracts') {
      return location.pathname === '/contracts';
    }
    return location.pathname === path;
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h2>MBC Hackathon 2025</h2>
        </div>
        
        {/* Tab Navigation */}
        {authenticated && (
          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            flex: 1,
            marginLeft: '2rem'
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  background: isActiveTab(tab.path) ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  fontWeight: isActiveTab(tab.path) ? '600' : '400',
                  color: isActiveTab(tab.path) ? '#3b82f6' : '#6b7280',
                  borderRadius: '6px',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  if (!isActiveTab(tab.path)) {
                    e.target.style.background = 'rgba(107, 114, 128, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActiveTab(tab.path)) {
                    e.target.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ marginRight: '0.4rem' }}>{tab.icon}</span>
                {tab.label}
                {tab.id === 'friends' && pendingRequestsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '0.1rem 0.4rem',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    transform: 'translate(30%, -30%)'
                  }}>{pendingRequestsCount}</span>
                )}
              </button>
            ))}
          </div>
        )}
        
        <div className="navbar-actions">
          {authenticated && (
            <button onClick={onLogout} className="btn-logout">
              Log Out
            </button>
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

