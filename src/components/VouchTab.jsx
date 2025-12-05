import { useState } from 'react';
import VouchForOthers from './VouchForOthers';
import VouchProfile from './VouchProfile';
import './VouchTab.css';

function VouchTab({ userId }) {
  const [activeSubTab, setActiveSubTab] = useState('vouch-others');

  const subTabs = [
    { id: 'vouch-others', label: 'Vouch for Others', icon: '🎯' },
    { id: 'vouch-profile', label: 'Your Vouch Profile', icon: '⭐' }
  ];

  return (
    <div className="vouch-tab">
      <div className="vouch-tab-header">
        <h2>Vouch System</h2>
        <p className="vouch-tab-description">
          Vouch for your friends and build your reputation
        </p>
      </div>

      <div className="vouch-sub-tabs">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            className={`vouch-sub-tab-button ${activeSubTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveSubTab(tab.id)}
          >
            <span className="vouch-sub-tab-icon">{tab.icon}</span>
            <span className="vouch-sub-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="vouch-sub-tab-content">
        {activeSubTab === 'vouch-others' && <VouchForOthers userId={userId} />}
        {activeSubTab === 'vouch-profile' && <VouchProfile userId={userId} />}
      </div>
    </div>
  );
}

export default VouchTab;

