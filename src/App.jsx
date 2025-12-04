import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import { supabase } from './services/supabase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email, password, isSignup) => {
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        // Check if email is already registered
        if (data?.user?.identities?.length === 0) {
          throw new Error('This email is already registered. Please login instead.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      <div className="main-content">
        <div className="welcome-section">
          <h1>Welcome to MBC Hackathon 2025</h1>
          {user ? (
            <div className="user-info">
              <p className="success-text">✓ You are logged in as <strong>{user.email}</strong></p>
              <div className="user-details">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Email Confirmed:</strong> {user.email_confirmed_at ? '✓ Yes' : '✗ No (check your email)'}</p>
                <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            <div className="login-prompt">
              <p>Please log in to continue</p>
              <p className="hint">Click the "Login" button in the top right corner to get started</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
