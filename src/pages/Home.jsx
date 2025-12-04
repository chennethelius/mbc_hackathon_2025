import './Home.css';

function Home({ user }) {
  return (
    <div className="home-page">
      <div className="welcome-section">
        <h1>Welcome to MBC Hackathon 2025</h1>
        {user ? (
          <div className="user-info">
            <p className="success-text">✓ You are logged in as <strong>{user.user_metadata?.full_name || user.email}</strong></p>
            <div className="user-details">
              {user.user_metadata?.full_name && (
                <>
                  <p><strong>Name:</strong> {user.user_metadata.full_name}</p>
                  {user.user_metadata?.first_name && user.user_metadata?.last_name && (
                    <p><strong>First Name:</strong> {user.user_metadata.first_name} | <strong>Last Name:</strong> {user.user_metadata.last_name}</p>
                  )}
                </>
              )}
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="login-prompt">
            <p>Please log in to continue</p>
            <p className="hint">Click the "Login" button in the top right corner to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;

