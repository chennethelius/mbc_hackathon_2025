import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { updateUserProfile, fetchUserProfile, syncWalletToSupabase } from '../services/userSync';
import { uploadImage, addPhotoToGallery, removePhotoFromGallery } from '../services/storageService';
import { supabase } from '../services/supabase';
import ImageUpload from '../components/ImageUpload';
import PhotoGallery from '../components/PhotoGallery';
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
    avatar_url: '',
    photos: [],
    age: '',
    gender: '',
    interested_in: '',
    height: '',
    interests: [],
    looking_for: '',
    occupation: '',
    company: '',
    education_level: ''
  });
  const [loading, setLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
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
        console.log('🔄 Loading profile for user:', privyUser.id);
        const result = await fetchUserProfile(privyUser.id);
        
        if (result.success && result.user?.profiles) {
          const profile = result.user.profiles;
          console.log('✅ Profile loaded from DB:', profile);
          console.log('📸 Photos array:', profile.photos);
          console.log('📸 Profile picture (photos[0]):', profile.photos?.[0]);
          
          setProfileData({
            username: profile.username || '',
            display_name: profile.display_name || '',
            university: profile.university || '',
            grade: profile.grade || '',
            location: profile.location || '',
            bio: profile.bio || '',
            avatar_url: profile.avatar_url || '',
            photos: profile.photos || [],
            age: profile.age || '',
            gender: profile.gender || '',
            interested_in: profile.interested_in || '',
            height: profile.height || '',
            interests: profile.interests || [],
            looking_for: profile.looking_for || '',
            occupation: profile.occupation || '',
            company: profile.company || '',
            education_level: profile.education_level || ''
          });
        } else {
          console.log('❌ No profile data found yet for user');
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

      // Convert interests string to array if it's a string
      const interestsArray = typeof profileData.interests === 'string'
        ? profileData.interests.split(',').map(i => i.trim()).filter(i => i)
        : profileData.interests;

      // Save profile using userSync service
      const result = await updateUserProfile(privyUser.id, {
        email: privyUser.email?.address,
        username: profileData.username,
        display_name: profileData.display_name,
        university: profileData.university,
        grade: profileData.grade,
        location: profileData.location,
        bio: profileData.bio,
        photos: profileData.photos,
        age: profileData.age ? parseInt(profileData.age) : null,
        gender: profileData.gender,
        interested_in: profileData.interested_in,
        height: profileData.height,
        interests: interestsArray,
        looking_for: profileData.looking_for,
        occupation: profileData.occupation,
        company: profileData.company,
        education_level: profileData.education_level
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

  // Handle profile picture upload - uses photos[0] as profile picture
  const handleProfilePictureUpload = async (file) => {
    setUploadingImage(true);
    setSaveMessage('');
    
    try {
      console.log('📤 Uploading profile picture...');
      const uploadResult = await uploadImage(file, privyUser.id, 'profile');
      
      if (uploadResult.success) {
        console.log('✅ Image uploaded to storage:', uploadResult.url);
        
        // Get current photos array
        const currentPhotos = profileData.photos || [];
        console.log('📸 Current photos array:', currentPhotos);
        
        // If there's already a profile picture (first item), replace it
        // Otherwise, add it as first item
        const updatedPhotos = currentPhotos.length > 0 
          ? [uploadResult.url, ...currentPhotos.slice(1)]  // Replace first photo
          : [uploadResult.url, ...currentPhotos];          // Add as first photo
        
        console.log('📸 Updated photos array:', updatedPhotos);
        console.log('💾 Saving to database...');
        
        // Save directly to database using photos array (same as gallery)
        const { data, error } = await supabase
          .from('profiles')
          .update({ photos: updatedPhotos })
          .eq('id', privyUser.id)
          .select();
        
        if (!error) {
          console.log('✅ Saved to database!', data);
          setProfileData(prev => ({ ...prev, photos: updatedPhotos }));
          setSaveMessage('Profile picture updated successfully!');
          setTimeout(() => setSaveMessage(''), 3000);
        } else {
          console.error('❌ Database error:', error);
          setSaveMessage('Error saving profile picture: ' + error.message);
        }
      } else {
        console.error('❌ Upload error:', uploadResult.error);
        setSaveMessage('Error uploading image: ' + uploadResult.error);
      }
    } catch (error) {
      console.error('❌ Exception:', error);
      setSaveMessage('Error uploading image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle gallery photo upload - adds to photos array after profile picture
  const handleGalleryPhotoUpload = async (file) => {
    setUploadingImage(true);
    setSaveMessage('');
    
    try {
      const uploadResult = await uploadImage(file, privyUser.id, 'gallery');
      
      if (uploadResult.success) {
        // Add new photo to the end of photos array
        const currentPhotos = profileData.photos || [];
        const updatedPhotos = [...currentPhotos, uploadResult.url];
        
        // Save directly to database
        const { error } = await supabase
          .from('profiles')
          .update({ photos: updatedPhotos })
          .eq('id', privyUser.id);
        
        if (!error) {
          setProfileData(prev => ({ ...prev, photos: updatedPhotos }));
          setSaveMessage('Photo added to gallery!');
          setTimeout(() => setSaveMessage(''), 3000);
        } else {
          setSaveMessage('Error adding photo: ' + error.message);
        }
      } else {
        setSaveMessage('Error uploading photo: ' + uploadResult.error);
      }
    } catch (error) {
      setSaveMessage('Error uploading photo: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle removing photo from gallery
  const handleRemoveGalleryPhoto = async (photoUrl) => {
    setSaveMessage('');
    
    try {
      const currentPhotos = profileData.photos || [];
      const updatedPhotos = currentPhotos.filter(url => url !== photoUrl);
      
      // Save directly to database
      const { error } = await supabase
        .from('profiles')
        .update({ photos: updatedPhotos })
        .eq('id', privyUser.id);
      
      if (!error) {
        setProfileData(prev => ({ ...prev, photos: updatedPhotos }));
        setSaveMessage('Photo removed from gallery!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Error removing photo: ' + error.message);
      }
    } catch (error) {
      setSaveMessage('Error removing photo: ' + error.message);
    }
  };

  // Handle interests change - just update directly without splitting
  const handleInterestsChange = (value) => {
    setProfileData(prev => ({ ...prev, interests: value }));
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
                  
                  {/* Profile Picture Upload - uses first photo in array */}
                  <ImageUpload
                    currentImage={profileData.photos?.[0] || ''}
                    onImageUpload={handleProfilePictureUpload}
                    uploading={uploadingImage}
                    label="Profile Picture"
                  />

                  {/* Photo Gallery - starts from photos[1] since photos[0] is profile pic */}
                  <PhotoGallery
                    photos={profileData.photos?.slice(1) || []}
                    onAddPhoto={handleGalleryPhotoUpload}
                    onRemovePhoto={handleRemoveGalleryPhoto}
                    uploading={uploadingImage}
                    maxPhotos={5}
                  />

                  <div className="form-section-divider">
                    <h3>Basic Information</h3>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="username">Username *</label>
                      <input
                        type="text"
                        id="username"
                        value={profileData.username}
                        onChange={(e) => handleProfileChange('username', e.target.value)}
                        placeholder="johndoe123"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="display_name">Display Name *</label>
                      <input
                        type="text"
                        id="display_name"
                        value={profileData.display_name}
                        onChange={(e) => handleProfileChange('display_name', e.target.value)}
                        placeholder="John Doe"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="age">Age</label>
                      <input
                        type="number"
                        id="age"
                        value={profileData.age}
                        onChange={(e) => handleProfileChange('age', e.target.value)}
                        placeholder="25"
                        min="18"
                        max="100"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="gender">Gender</label>
                      <select
                        id="gender"
                        value={profileData.gender}
                        onChange={(e) => handleProfileChange('gender', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="interested_in">Interested In</label>
                      <select
                        id="interested_in"
                        value={profileData.interested_in}
                        onChange={(e) => handleProfileChange('interested_in', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Select preference</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Everyone">Everyone</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="height">Height</label>
                      <input
                        type="text"
                        id="height"
                        value={profileData.height}
                        onChange={(e) => handleProfileChange('height', e.target.value)}
                        placeholder="e.g., 5'10'' or 178cm"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-section-divider">
                    <h3>Education & Career</h3>
                  </div>

                  <div className="form-group">
                    <label htmlFor="university">University</label>
                    <input
                      type="text"
                      id="university"
                      value={profileData.university}
                      onChange={(e) => handleProfileChange('university', e.target.value)}
                      placeholder="University of Michigan"
                      className="form-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="grade">Year in College</label>
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
                      <label htmlFor="education_level">Education Level</label>
                      <select
                        id="education_level"
                        value={profileData.education_level}
                        onChange={(e) => handleProfileChange('education_level', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Select education</option>
                        <option value="High School">High School</option>
                        <option value="Some College">Some College</option>
                        <option value="Bachelor's">Bachelor's Degree</option>
                        <option value="Master's">Master's Degree</option>
                        <option value="PhD">PhD</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="occupation">Occupation</label>
                      <input
                        type="text"
                        id="occupation"
                        value={profileData.occupation}
                        onChange={(e) => handleProfileChange('occupation', e.target.value)}
                        placeholder="Software Engineer"
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="company">Company / Organization</label>
                      <input
                        type="text"
                        id="company"
                        value={profileData.company}
                        onChange={(e) => handleProfileChange('company', e.target.value)}
                        placeholder="Tech Company Inc."
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-section-divider">
                    <h3>About You</h3>
                  </div>

                  <div className="form-group">
                    <label htmlFor="location">Location</label>
                    <input
                      type="text"
                      id="location"
                      value={profileData.location}
                      onChange={(e) => handleProfileChange('location', e.target.value)}
                      placeholder="Ann Arbor, MI"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="looking_for">What are you looking for?</label>
                    <select
                      id="looking_for"
                      value={profileData.looking_for}
                      onChange={(e) => handleProfileChange('looking_for', e.target.value)}
                      className="form-input"
                    >
                      <option value="">Select an option</option>
                      <option value="relationship">Long-term relationship</option>
                      <option value="casual">Casual dating</option>
                      <option value="friends">New friends</option>
                      <option value="unsure">Not sure yet</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="interests">Interests & Hobbies</label>
                    <input
                      type="text"
                      id="interests"
                      value={Array.isArray(profileData.interests) ? profileData.interests.join(', ') : profileData.interests}
                      onChange={(e) => handleInterestsChange(e.target.value)}
                      placeholder="e.g., hiking, photography, cooking, gaming"
                      className="form-input"
                    />
                    <span className="field-hint">Separate interests with commas</span>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bio">Bio</label>
                    <textarea
                      id="bio"
                      value={profileData.bio}
                      onChange={(e) => handleProfileChange('bio', e.target.value)}
                      placeholder="Tell us a bit about yourself... What makes you unique? What are you passionate about?"
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
                      disabled={loading || uploadingImage}
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
                        <button onClick={() => navigate('/wallet')} className="btn-wallet-link">
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
                        className="btn-wallet-link"
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

