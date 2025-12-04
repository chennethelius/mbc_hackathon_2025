import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Settings.css';

function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const navigate = useNavigate();

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'account', label: 'Account' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'privacy', label: 'Privacy' },
  ];

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
                <p className="placeholder-text">Profile settings coming soon...</p>
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

