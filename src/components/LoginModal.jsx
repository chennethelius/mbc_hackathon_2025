import { useState } from 'react';
import { useLoginWithEmail } from '@privy-io/react-auth';
import './LoginModal.css';

function LoginModal({ onClose }) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  
  const { sendCode, loginWithCode } = useLoginWithEmail({
    onError: (error) => {
      console.error('Privy login error:', error);
      setError(error.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  });

  const isValidEduEmail = email.trim() === '' || email.toLowerCase().endsWith('.edu');
  const showEmailError = emailTouched && email.trim() !== '' && !email.toLowerCase().endsWith('.edu');

  const handleSendCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate .edu email
    if (!email.toLowerCase().endsWith('.edu')) {
      setError('Please use a valid .edu email address');
      setLoading(false);
      return;
    }

    try {
      await sendCode({ email });
      setCodeSent(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await loginWithCode({ code });
      // Privy will handle the auth state change
      onClose();
    } catch (err) {
      setError(err.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{codeSent ? 'Enter Verification Code' : 'Welcome!'}</h2>
          <button onClick={onClose} className="close-btn" aria-label="Close">&times;</button>
        </div>
        
        {!codeSent ? (
          <form onSubmit={handleSendCode}>
            <div className="login-description">
              <p className="login-title">🔐 Passwordless Email Login</p>
              <p className="login-subtitle">We'll send you a one-time code to log in or create your account automatically—no password needed!</p>
            </div>

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
              <small className={showEmailError ? 'form-hint error' : 'form-hint'}>
                {showEmailError ? '⚠️ Must be a valid .edu email address' : 'Must be a valid .edu email address'}
              </small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading || !email} className="btn-submit">
              {loading ? 'Sending...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                disabled
                className="input-disabled"
              />
            </div>

            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                placeholder="Enter the code from your email"
                autoComplete="one-time-code"
                autoFocus
              />
              <small className="form-hint">Check your email for the verification code</small>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" disabled={loading || !code} className="btn-submit">
              {loading ? 'Verifying...' : 'Login'}
            </button>

            <button 
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode('');
                setError('');
              }}
              className="btn-link"
            >
              ← Use different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginModal;

