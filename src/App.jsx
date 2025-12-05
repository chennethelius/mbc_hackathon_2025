import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import Navbar from './components/Navbar';
import ProfilePrompt from './components/ProfilePrompt';
import BackendStatus from './components/BackendStatus';
import Home from './pages/Home';
import Settings from './pages/Settings';
import Wallet from './pages/Wallet';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Markets from './pages/Markets';
import Contracts from './pages/Contracts';
import Notifications from './pages/Notifications';
import { syncPrivyUserToSupabase } from './services/userSync';
import './App.css';

function App() {
  const { ready, authenticated, user: privyUser, logout: privyLogout } = usePrivy();
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [userSynced, setUserSynced] = useState(false);
  const [syncError, setSyncError] = useState(null);

  // Sync Privy user to Supabase on authentication
  useEffect(() => {
    const syncUser = async () => {
      if (authenticated && privyUser && !userSynced) {
        console.log('🔄 Starting Privy → Supabase sync for user:', privyUser.id);
        setSyncError(null);
        
        const result = await syncPrivyUserToSupabase(privyUser);
        
        if (result.success) {
          console.log('✅ User synced successfully to Supabase');
          setUserSynced(true);
          
          // Show profile prompt for new users
          const hasSeenPrompt = localStorage.getItem(`profile_prompt_seen_${privyUser.id}`);
          if (!hasSeenPrompt) {
            setShowProfilePrompt(true);
          }
        } else {
          console.error('❌ Failed to sync user:', result.error);
          setSyncError(result.error);
          // Don't block the app if sync fails
          setUserSynced(true);
        }
      }
    };

    syncUser();
  }, [authenticated, privyUser, userSynced]);

  // Reset sync state on logout
  useEffect(() => {
    if (!authenticated) {
      setUserSynced(false);
      setSyncError(null);
    }
  }, [authenticated]);

  const handleLogout = async () => {
    try {
      await privyLogout();
      // Navigate to home after logout
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDismissPrompt = () => {
    setShowProfilePrompt(false);
    if (privyUser) {
      localStorage.setItem(`profile_prompt_seen_${privyUser.id}`, 'true');
    }
  };

  if (!ready) {
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
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <BackendStatus />
        <Navbar 
          user={privyUser} 
          authenticated={authenticated}
          onLogout={handleLogout}
        />
        
        <Routes>
          <Route path="/" element={<Home user={privyUser} authenticated={authenticated} />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/contracts" element={<Contracts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile/:userId" element={<Profile />} />
        </Routes>

        {showProfilePrompt && (
          <ProfilePrompt
            onDismiss={handleDismissPrompt}
          />
        )}

        {syncError && (
          <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '1rem',
            maxWidth: '300px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            <strong>⚠️ Sync Warning:</strong>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
              User data sync had issues. App may have limited functionality.
            </p>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;
