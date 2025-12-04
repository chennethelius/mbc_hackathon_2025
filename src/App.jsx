import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProfilePrompt from './components/ProfilePrompt';
import Home from './pages/Home';
import Settings from './pages/Settings';
import { supabase } from './services/supabase';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      
      // Show profile prompt on sign in if user hasn't dismissed it before
      if (event === 'SIGNED_IN' && newUser) {
        const hasSeenPrompt = localStorage.getItem(`profile_prompt_seen_${newUser.id}`);
        if (!hasSeenPrompt) {
          setShowProfilePrompt(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email, password, isSignup, firstName, lastName) => {
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
              full_name: `${firstName} ${lastName}`,
            },
          },
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

  const handleDismissPrompt = () => {
    setShowProfilePrompt(false);
    if (user) {
      localStorage.setItem(`profile_prompt_seen_${user.id}`, 'true');
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
    <Router>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar 
          user={user} 
          onLogin={handleLogin} 
          onLogout={handleLogout}
        />
        
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>

        {showProfilePrompt && (
          <ProfilePrompt
            onDismiss={handleDismissPrompt}
          />
        )}
      </div>
    </Router>
  );
}

export default App;
