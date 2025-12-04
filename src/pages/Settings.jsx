import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { updateUserProfile, fetchUserProfile, syncWalletToSupabase } from '../services/userSync';
import './Settings.css';

function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const navigate = useNavigate();
  const { ready, authenticated, user: privyUser, createWallet } = usePrivy();
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    username: '',
    display_name: '',
    university: '',
    grade: '',
    location: '',
    bio: '',
    avatar_url: ''
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Wallet state
  const [walletInfo, setWalletInfo] = useState(null);
  const [creatingWallet, setCreatingWallet] = useState(false);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'account', label: 'Account' },
    { id: 'wallets', label: 'Wallets' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
  ];

  // Check authentication status with Privy
  useEffect(() => {
    if (ready && !authenticated) {
      navigate('/');
    }
  }, [ready, authenticated, navigate]);

  // Load user profile data using userSync service
  useEffect(() => {
    const loadProfile = async () => {
      if (privyUser) {
        const result = await fetchUserProfile(privyUser.id);
        
        if (result.success && result.user?.profiles) {
          const profile = result.user.profiles;
          setProfileData({
            username: profile.username || '',
            display_name: profile.display_name || '',
            university: profile.university || '',
            grade: profile.grade || '',
            location: profile.location || '',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || ''
          });
        } else {
          console.log('No profile data found yet for user');
        }
      }
    };
    
    if (activeTab === 'profile' && privyUser) {
      loadProfile();
    }
  }, [activeTab, privyUser]);

  // Check for wallet in user's linked accounts
  useEffect(() => {
    if (privyUser?.linkedAccounts) {
      console.log('Settings - All linked accounts:', privyUser.linkedAccounts);
      
      // Only match actual wallet types, not email accounts
      const wallet = privyUser.linkedAccounts.find(
        account => {
          const isWallet = (
            account.type === 'wallet' ||
            account.type === 'smart_wallet' ||
            account.walletClientType === 'privy'
          );
          return isWallet;
        }
      );
      
      setWalletInfo(wallet);
      console.log('Settings - Final Wallet Info:', wallet);
    }
  }, [privyUser]);

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
      if (!privyUser) throw new Error('Not authenticated');

      // Save profile using userSync service
      const result = await updateUserProfile(privyUser.id, {
        email: privyUser.email?.address,
        username: profileData.username,
        display_name: profileData.display_name,
        university: profileData.university,
        grade: profileData.grade,
        location: profileData.location,
        bio: profileData.bio,
        avatar_url: profileData.avatar_url
      });

      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSaveMessage('Profile saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWallet = async () => {
    setCreatingWallet(true);
    try {
      console.log('💼 Creating wallet via Privy...');
      await createWallet();
      
      // Wait a moment for Privy to update the user object
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get the wallet address from the updated user object
      const walletAccount = privyUser?.linkedAccounts?.find(
        account => account.type === 'wallet' || account.type === 'smart_wallet' || account.walletClientType === 'privy'
      );
      
      if (walletAccount?.address) {
        console.log('💼 Syncing wallet to Supabase...', walletAccount.address);
        const syncResult = await syncWalletToSupabase(privyUser.id, walletAccount.address);
        
        if (syncResult.success) {
          console.log('✅ Wallet created and synced successfully!');
          setWalletInfo(walletAccount);
          setSaveMessage('Wallet created successfully!');
          setTimeout(() => {
            setSaveMessage('');
            window.location.reload();
          }, 1500);
        } else {
          throw new Error('Failed to sync wallet to Supabase: ' + syncResult.error);
        }
      } else {
        console.log('⚠️ Wallet created but address not found, reloading...');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      setSaveMessage('Error creating wallet: ' + error.message);
      setCreatingWallet(false);
    }
  };

  // Show loading while Privy initializes
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

  // Don't render if not authenticated (will redirect)
  if (!authenticated || !privyUser) {
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
                    <label htmlFor="username">Username</label>
                    <input
                      type="text"
                      id="username"
                      value={profileData.username}
                      onChange={(e) => handleProfileChange('username', e.target.value)}
                      placeholder="e.g., johndoe123"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="display_name">Display Name</label>
                    <input
                      type="text"
                      id="display_name"
                      value={profileData.display_name}
                      onChange={(e) => handleProfileChange('display_name', e.target.value)}
                      placeholder="e.g., John Doe"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="avatar_url">Avatar URL</label>
                    <input
                      type="url"
                      id="avatar_url"
                      value={profileData.avatar_url}
                      onChange={(e) => handleProfileChange('avatar_url', e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="form-input"
                    />
                  </div>

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
                
                <div className="account-section">
                  <h3>Authentication</h3>
                  <div className="info-card">
                    <div className="info-row">
                      <span className="info-label">Email:</span>
                      <span className="info-value">{privyUser.email?.address || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">User ID:</span>
                      <span className="info-value user-id">{privyUser.id}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Account Created:</span>
                      <span className="info-value">{new Date(privyUser.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Login Method:</span>
                      <span className="info-value">Email (Privy)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'wallets' && (
              <div className="tab-content-page">
                <h2>Wallet Settings</h2>
                
                <div className="account-section">
                  <h3>Embedded Wallet</h3>
                  {walletInfo ? (
                    <div className="info-card wallet-card">
                      <div className="wallet-status success">
                        ✓ Wallet Active
                      </div>
                      <div className="info-row">
                        <span className="info-label">Wallet Address:</span>
                        <span className="info-value wallet-address">{walletInfo.address}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Wallet Type:</span>
                        <span className="info-value">Privy Embedded Wallet</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">Status:</span>
                        <span className="info-value" style={{color: '#10b981'}}>✓ Synced to Database</span>
                      </div>
                      <div className="wallet-actions">
                        <button onClick={() => navigate('/wallet')} className="btn-wallet">
                          View Wallet Details →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="info-card">
                      <div className="wallet-status pending">
                        <p style={{margin: 0, fontSize: '1.1rem'}}>💼 No wallet found</p>
                      </div>
                      <p style={{margin: '1rem 0', color: '#666'}}>
                        You don't have an embedded wallet yet. Create one to start interacting with blockchain applications.
                      </p>
                      <button 
                        onClick={handleCreateWallet} 
                        className="btn-wallet"
                        disabled={creatingWallet}
                      >
                        {creatingWallet ? '🔄 Creating Wallet...' : '✨ Create Wallet'}
                      </button>
                      {saveMessage && (
                        <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`} style={{marginTop: '1rem'}}>
                          {saveMessage}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="account-section">
                  <h3>About Embedded Wallets</h3>
                  <div className="info-card">
                    <p style={{marginBottom: '1rem'}}>
                      Embedded wallets are non-custodial wallets that are automatically managed by Privy.
                      They provide a seamless experience without needing browser extensions.
                    </p>
                    <div className="features" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                      <div className="feature">✅ No seed phrase to remember</div>
                      <div className="feature">✅ Secure key management</div>
                      <div className="feature">✅ Works on any device</div>
                      <div className="feature">✅ Multi-chain support</div>
                    </div>
                  </div>
                </div>
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

