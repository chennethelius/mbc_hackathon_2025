import { useState } from 'react';
import LoginModal from './LoginModal';
import './Navbar.css';

function Navbar({ user, onLogin, onLogout }) {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <h2>MBC Hackathon 2025</h2>
        </div>
        <div className="navbar-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-email">Welcome, {user.user_metadata?.full_name || user.email}</span>
              <button onClick={onLogout} className="btn-logout">
                Logout
              </button>
            </div>
          ) : (
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
          onLogin={onLogin}
        />
      )}
    </>
  );
}

export default Navbar;

