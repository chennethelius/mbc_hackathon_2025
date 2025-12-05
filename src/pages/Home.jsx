import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home({ user, authenticated }) {
  const navigate = useNavigate();

  if (!authenticated) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <h1>Dating Prediction Markets</h1>
          <p>Bet on your friends' love lives with USDC</p>
          <p className="login-prompt">Login to get started</p>
        </div>
      </div>
    );
  }

  // Redirect authenticated users to markets
  navigate('/markets');
  return null;
}

export default Home;

