import './Home.css';

function Home({ user, authenticated }) {
  // Get embedded wallet info - check multiple wallet types
  const embeddedWallet = user?.linkedAccounts?.find(
    account => account.type === 'wallet' || account.walletClientType === 'privy'
  );
  
  // Also check for any wallet with an address
  const anyWallet = user?.linkedAccounts?.find(
    account => account.type?.includes('wallet') || account.address
  );
  
  const wallet = embeddedWallet || anyWallet;

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h1>Welcome to MBC Hackathon 2025</h1>
        {authenticated && user ? (
          <div className="user-info">
            <p className="success-text">✓ You are logged in as <strong>{user.email?.address || 'User'}</strong></p>
            <div className="user-details">
              <p><strong>Email:</strong> {user.email?.address || 'N/A'}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>Account Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
              {wallet && (
                <>
                  <p><strong>🎉 Embedded Wallet:</strong> Created!</p>
                  <p><strong>Wallet Address:</strong> <code>{wallet.address}</code></p>
                  <p className="hint">Your wallet was automatically created when you logged in!</p>
                </>
              )}
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

