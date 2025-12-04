import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
import './Settings.css';

function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    university: '',
    grade: '',
    location: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'account', label: 'Account' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
  ];

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setCheckingAuth(false);
      
      // Redirect to home if not logged in
      if (!user) {
        navigate('/');
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      // Clear profile data and redirect on logout
      if (!currentUser) {
        setProfileData({
          university: '',
          grade: '',
          location: '',
          bio: ''
        });
        navigate('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setProfileData({
            university: profile.university || '',
            grade: profile.grade || '',
            location: profile.location || '',
            bio: profile.bio || ''
          });
        }
      }
    };
    
    if (activeTab === 'profile' && user) {
      loadProfile();
    }
  }, [activeTab, user]);

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setSaveMessage('');
    
    try {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          university: profileData.university,
          grade: profileData.grade,
          location: profileData.location,
          bio: profileData.bio,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      setSaveMessage('Profile saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking authentication
  if (checkingAuth) {
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

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header-page">
          <h1>Settings</h1>
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Back to Home
          </button>
        </div>
        
        <div className="settings-content-page">
          <div className="settings-tabs-page">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-button-page ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="settings-panel-page">
            {activeTab === 'profile' && (
              <div className="tab-content-page">
                <h2>Profile Settings</h2>
                
                <form className="profile-form" onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                  <div className="form-group">
                    <label htmlFor="university">University</label>
                    <input
                      type="text"
                      id="university"
                      value={profileData.university}
                      onChange={(e) => handleProfileChange('university', e.target.value)}
                      placeholder="e.g., University of Michigan"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="grade">Grade / Year in College</label>
                    <select
                      id="grade"
                      value={profileData.grade}
                      onChange={(e) => handleProfileChange('grade', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select your year</option>
                      <option value="Freshman">Freshman</option>
                      <option value="Sophomore">Sophomore</option>
                      <option value="Junior">Junior</option>
                      <option value="Senior">Senior</option>
                      <option value="Graduate">Graduate</option>
                      <option value="PhD">PhD</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location / City</label>
                    <input
                      type="text"
                      id="location"
                      value={profileData.location}
                      onChange={(e) => handleProfileChange('location', e.target.value)}
                      placeholder="e.g., Ann Arbor, MI"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      placeholder="Tell us a bit about yourself..."
                      rows="5"
                      className="form-textarea"
                      maxLength="500"
                    />
                    <span className="char-count">{profileData.bio.length} / 500</span>
                  </div>

                  <div className="form-actions">
                    <button 
                      type="submit" 
                      className="btn-save"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                    {saveMessage && (
                      <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
                        {saveMessage}
                      </div>
                    )}
                  </div>
                </form>
              </div>
            )}
            
            {activeTab === 'account' && (
              <div className="tab-content-page">
                <h2>Account Settings</h2>
                <p className="placeholder-text">Account settings coming soon...</p>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div className="tab-content-page">
                <h2>Notification Settings</h2>
                <p className="placeholder-text">Notification settings coming soon...</p>
              </div>
            )}
            
            {activeTab === 'privacy' && (
              <div className="tab-content-page">
                <h2>Privacy Settings</h2>
                <p className="placeholder-text">Privacy settings coming soon...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;

