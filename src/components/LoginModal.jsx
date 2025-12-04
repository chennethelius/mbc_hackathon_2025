import { useState } from 'react';
import './LoginModal.css';

function LoginModal({ onClose, onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);

  const isValidEduEmail = email.trim() === '' || email.toLowerCase().endsWith('.edu');
  const showEmailError = emailTouched && email.trim() !== '' && !email.toLowerCase().endsWith('.edu');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Validate .edu email
    if (!email.toLowerCase().endsWith('.edu')) {
      setError('Please use a valid .edu email address');
      setLoading(false);
      return;
    }

    try {
      await onLogin(email, password, isSignup, firstName, lastName);
      onClose();
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
          {isSignup && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Enter your first name"
                  autoComplete="given-name"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Enter your last name"
                  autoComplete="family-name"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setEmailTouched(true)}
              required
              placeholder="Enter your .edu email"
              autoComplete="email"
              className={showEmailError ? 'input-error' : ''}
            />
            <small className="form-hint">Must be a valid .edu email address</small>
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
              setFirstName('');
              setLastName('');
              setError('');
              setSuccessMessage('');
              setEmailTouched(false);
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

