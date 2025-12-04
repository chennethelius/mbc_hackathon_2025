import { useState } from 'react';
import './LoginModal.css';

function LoginModal({ onClose, onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await onLogin(email, password, isSignup);
      
      if (isSignup) {
        setSuccessMessage('Account created! Please check your email for confirmation.');
        setEmail('');
        setPassword('');
        // Don't close modal so user can see the success message
      } else {
        onClose();
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              minLength="6"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
            {isSignup && (
              <small className="form-hint">Password must be at least 6 characters</small>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? 'Loading...' : (isSignup ? 'Sign Up' : 'Login')}
          </button>
        </form>

        <div className="toggle-mode">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}
          <button 
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError('');
              setSuccessMessage('');
            }}
            className="btn-link"
          >
            {isSignup ? 'Login' : 'Sign Up'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginModal;

