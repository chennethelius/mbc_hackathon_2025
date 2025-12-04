import { useNavigate } from 'react-router-dom';
import './ProfilePrompt.css';

function ProfilePrompt({ onDismiss }) {
  const navigate = useNavigate();

  const handleComplete = () => {
    onDismiss();
    navigate('/settings?tab=profile');
  };

  return (
    <div className="modal-overlay" onClick={onDismiss}>
      <div className="profile-prompt" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-icon">👤</div>
        <h2>Complete Your Profile</h2>
        <p>Take a moment to set up your profile and personalize your experience.</p>
        <div className="prompt-actions">
          <button className="btn-complete" onClick={handleComplete}>
            Complete Profile
          </button>
          <button className="btn-later" onClick={onDismiss}>
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProfilePrompt;

