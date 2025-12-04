import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { syncWalletToSupabase } from '../services/userSync';
import PrivyLogin from '../components/PrivyLogin';
import SendTransaction from '../components/SendTransaction';
import './Wallet.css';

export default function Wallet() {
  const { ready, authenticated, user, logout, createWallet } = usePrivy();
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);

  // Check for wallet in user's linked accounts
  useEffect(() => {
    if (user?.linkedAccounts) {
      console.log('All linked accounts:', user.linkedAccounts);
      
      // Only match actual wallet types, not email accounts
      const wallet = user.linkedAccounts.find(
        account => {
          const isWallet = (
            account.type === 'wallet' ||
            account.type === 'smart_wallet' ||
            account.walletClientType === 'privy'
          );
          console.log('Checking account:', account.type, 'isWallet:', isWallet);
          return isWallet;
        }
      );
      
      setWalletInfo(wallet);
      console.log('Wallet Page - Final Wallet Info:', wallet);
    }
  }, [user]);

  if (!ready) {
    return (
      <div className="wallet-page">
        <div className="loading">Loading Privy...</div>
      </div>
    );
  }

  const handleCreateWallet = async () => {
    setCreatingWallet(true);
    try {
      console.log('💼 Creating wallet via Privy...');
      await createWallet();
      
      // Wait a moment for Privy to update the user object
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get the wallet address from the updated user object
      const walletAccount = user?.linkedAccounts?.find(
        account => account.type === 'wallet' || account.type === 'smart_wallet' || account.walletClientType === 'privy'
      );
      
      if (walletAccount?.address) {
        console.log('💼 Syncing wallet to Supabase...', walletAccount.address);
        const syncResult = await syncWalletToSupabase(user.id, walletAccount.address);
        
        if (syncResult.success) {
          console.log('✅ Wallet created and synced successfully!');
          setWalletInfo(walletAccount);
          // Reload to ensure all data is fresh
          setTimeout(() => window.location.reload(), 500);
        } else {
          throw new Error('Failed to sync wallet to Supabase: ' + syncResult.error);
        }
      } else {
        console.log('⚠️ Wallet created but address not found, reloading...');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Error creating wallet:', error);
      alert('Failed to create wallet: ' + error.message);
      setCreatingWallet(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="wallet-page">
        <div className="wallet-container">
          <h1>Privy Wallet</h1>
          <p className="subtitle">Login with email to access your embedded wallet</p>
          <PrivyLogin />
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-container">
        <h1>Privy Wallet</h1>
        
        <div className="user-info">
          <h2>Welcome!</h2>
          <div className="info-card">
            <div className="info-row">
              <span className="label">Email:</span>
              <span className="value">{user?.email?.address || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">User ID:</span>
              <span className="value">{user?.id || 'N/A'}</span>
            </div>
            <div className="info-row">
              <span className="label">Total Accounts:</span>
              <span className="value">{user?.linkedAccounts?.length || 0}</span>
            </div>
            {walletInfo && (
              <div className="info-row">
                <span className="label">Wallet Address:</span>
                <span className="value wallet-address">{walletInfo.address}</span>
              </div>
            )}
          </div>

          {!walletInfo && (
            <div className="wallet-warning">
              <p>💼 No embedded wallet found.</p>
              <p style={{fontSize: '0.9rem', marginTop: '0.5rem', color: '#666'}}>
                Create your embedded wallet to start sending transactions and interacting with the blockchain.
              </p>
              <button 
                onClick={handleCreateWallet} 
                className="create-wallet-btn"
                disabled={creatingWallet}
              >
                {creatingWallet ? '🔄 Creating Wallet...' : '✨ Create Wallet'}
              </button>
            </div>
          )}
          
          <button onClick={logout} className="logout-btn">
            Logout from Privy
          </button>
        </div>

        {walletInfo && (
          <div className="wallet-actions">
            <SendTransaction />
            
            <div className="info-box">
              <h3>🎉 Embedded Wallet Active!</h3>
              <p>
                Your embedded wallet has been created and synced to the database.
                You can now send transactions, sign messages, and interact with blockchain applications.
              </p>
              <div className="features">
                <div className="feature">✅ Manual wallet creation</div>
                <div className="feature">✅ Secure key management</div>
                <div className="feature">✅ Transaction signing</div>
                <div className="feature">✅ Multi-chain support</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

