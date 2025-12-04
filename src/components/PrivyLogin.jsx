import { useState } from 'react';
import { useLoginWithEmail } from '@privy-io/react-auth';
import './PrivyLogin.css';

export default function PrivyLogin() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const { sendCode, loginWithCode } = useLoginWithEmail();

  const handleSendCode = async () => {
    try {
      await sendCode({ email });
      setCodeSent(true);
      alert('OTP sent to your email!');
    } catch (error) {
      console.error('Error sending code:', error);
      alert('Failed to send code. Please try again.');
    }
  };

  const handleLogin = async () => {
    try {
      await loginWithCode({ code });
      alert('Login successful!');
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Failed to login. Please check your code.');
    }
  };

  return (
    <div className="privy-login">
      <h2>Login with Email (Privy)</h2>
      <div className="login-form">
        <div className="input-group">
          <label>Email Address</label>
          <input 
            type="email"
            onChange={(e) => setEmail(e.currentTarget.value)} 
            value={email}
            placeholder="Enter your email"
            disabled={codeSent}
          />
          <button 
            onClick={handleSendCode}
            disabled={!email || codeSent}
          >
            {codeSent ? 'Code Sent!' : 'Send Code'}
          </button>
        </div>

        {codeSent && (
          <div className="input-group">
            <label>One-Time Code</label>
            <input 
              type="text"
              onChange={(e) => setCode(e.currentTarget.value)} 
              value={code}
              placeholder="Enter the code from your email"
            />
            <button 
              onClick={handleLogin}
              disabled={!code}
            >
              Login
            </button>
          </div>
        )}

        {codeSent && (
          <button 
            className="resend-btn"
            onClick={() => {
              setCodeSent(false);
              setCode('');
            }}
          >
            Use Different Email
          </button>
        )}
      </div>
    </div>
  );
}

