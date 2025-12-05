import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginModal from '../components/LoginModal';
import './Home.css';

function Home({ user, authenticated }) {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  if (!authenticated) {
    return (
      <div className="home-page">
        {/* Animated pastel background */}
        <div className="animated-bg">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="blob blob-3"></div>
          <div className="blob blob-4"></div>
          <div className="blob blob-5"></div>
        </div>

        {/* Hero Section */}
        <div className="hero-content">
          <div className="hero-header">
            <h1 className="hero-title">💘 Dating Prediction Markets</h1>
            <p className="hero-subtitle">
              Bet on your friends' love lives with USDC on Base
            </p>
            <button className="cta-button" onClick={() => setShowLoginModal(true)}>
              Get Started 🚀
            </button>
          </div>

          {/* Feature Panels */}
          <div className="feature-panels">
            <div className="feature-card card-1">
              <div className="feature-icon">📊</div>
              <h3>Create Prediction Markets</h3>
              <p>
                Think your friends are going to date? Create a market and let everyone bet on the outcome with real USDC.
              </p>
            </div>

            <div className="feature-card card-2">
              <div className="feature-icon">💰</div>
              <h3>Bet & Win USDC</h3>
              <p>
                Put your money where your mouth is. Bet YES or NO on dating predictions and win USDC when markets resolve.
              </p>
            </div>

            <div className="feature-card card-3">
              <div className="feature-icon">👥</div>
              <h3>Connect with Friends</h3>
              <p>
                Add friends, share photo galleries, and keep track of everyone's dating drama in one place.
              </p>
            </div>

            <div className="feature-card card-4">
              <div className="feature-icon">⛓️</div>
              <h3>Built on Base</h3>
              <p>
                Powered by smart contracts on Base Sepolia. Your bets are transparent, secure, and on-chain.
              </p>
            </div>

            <div className="feature-card card-5">
              <div className="feature-icon">🎯</div>
              <h3>Fair Resolution</h3>
              <p>
                Market creators resolve outcomes after the deadline. Winners automatically claim their share of the pool.
              </p>
            </div>

            <div className="feature-card card-6">
              <div className="feature-icon">📸</div>
              <h3>Share Moments</h3>
              <p>
                Upload photos, build your profile, and document the relationships you're betting on.
              </p>
            </div>
          </div>

          {/* Footer CTA */}
          <div className="footer-cta">
            <h2>Ready to predict the future? 🔮</h2>
            <button className="cta-button secondary" onClick={() => setShowLoginModal(true)}>
              Login to Start Betting
            </button>
          </div>
        </div>

        {/* Login Modal */}
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
      </div>
    );
  }

  // Redirect authenticated users to markets
  navigate('/markets');
  return null;
}

export default Home;

