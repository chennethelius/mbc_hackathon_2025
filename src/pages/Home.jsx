import { Link } from 'react-router-dom';
import './Home.css';

function Home({ user, authenticated }) {
  return (
    <div className="home-page">
      <div className="hero-section">
        <h1>Dating Prediction Markets</h1>
        <p>Bet on your friends' love lives with USDC</p>
        {authenticated ? (
          <Link to="/markets" className="cta-button">
            View Markets
          </Link>
        ) : (
          <p className="login-prompt">Login to get started</p>
        )}
      </div>
    </div>
  );
}

export default Home;

