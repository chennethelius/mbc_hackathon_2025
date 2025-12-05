import { useState, useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import { getFriends } from '../services/friendsService';

const MARKET_FACTORY_ADDRESS = '0xCa897F235F88316f03D34ecCC7701a4dA4a36895';
const MARKET_FACTORY_ABI = [
  {
    "inputs": [
      {"name": "_friend1", "type": "address"},
      {"name": "_friend2", "type": "address"},
      {"name": "_title", "type": "string"},
      {"name": "_resolutionTime", "type": "uint256"}
    ],
    "name": "createMarket",
    "outputs": [{"type": "address"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function CreateMarket({ onClose, onSuccess }) {
  const { data: walletClient } = useWalletClient();
  const { user, sendTransaction } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState([]);
  const [formData, setFormData] = useState({
    friend1Id: '',
    friend2Id: '',
    title: '',
    timeValue: 7,
    timeUnit: 'days' // 'seconds', 'minutes', 'hours', 'days'
  });

  useEffect(() => {
    async function loadFriends() {
      try {
        const currentUser = {
          id: user?.id || 'me',
          wallet_address: user?.wallet?.address || '',
          display_name: 'Me (You)'
        };

        const res = await getFriends(user?.id);
        console.log('Friends API response:', res);
        
        if (!res || !res.success) {
          setFriends([currentUser]);
          return;
        }

        // `getFriends` returns items with `profile` nested
        const apiFriends = (res.friends || []).map(item => {
          console.log('Processing friend item:', item);
          const profile = item.profile || {};
          const wallet = profile.wallet_address;
          
          return {
            id: profile.id,
            wallet_address: wallet || '',
            display_name: profile.display_name || profile.full_name || profile.username || profile.email || 'Friend',
            email: profile.email,
            hasWallet: !!wallet
          };
        });

        console.log('Processed friends:', [currentUser, ...apiFriends]);
        setFriends([currentUser, ...apiFriends]);
      } catch (error) {
        console.error('Error loading friends:', error);
        setFriends([{
          id: user?.id || 'me',
          wallet_address: user?.wallet?.address || '',
          display_name: 'Me (You)'
        }]);
      }
    }

    if (user?.id) {
      loadFriends();
    }
  }, [user]);

  async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('Form submitted, walletClient:', walletClient);
    console.log('User wallet:', user?.wallet);
    console.log('Form data:', formData);
    console.log('Friends list:', friends);

    try {
      setLoading(true);

      // Get wallet addresses from selected friends
      const friend1 = friends.find(f => f.id === formData.friend1Id);
      const friend2 = friends.find(f => f.id === formData.friend2Id);

      console.log('Friend1:', friend1);
      console.log('Friend2:', friend2);

      if (!friend1 || !friend2) {
        alert('Please select both friends');
        setLoading(false);
        return;
      }

      if (!friend1.wallet_address || !friend2.wallet_address) {
        alert('Selected friends must have wallet addresses');
        setLoading(false);
        return;
      }

      // Calculate resolution time based on selected unit
      const timeMultipliers = {
        seconds: 1,
        minutes: 60,
        hours: 60 * 60,
        days: 24 * 60 * 60
      };
      const secondsToAdd = formData.timeValue * timeMultipliers[formData.timeUnit];
      const resolutionTime = Math.floor(Date.now() / 1000) + secondsToAdd;

      console.log('Creating market with:', {
        address: MARKET_FACTORY_ADDRESS,
        friend1: friend1.wallet_address,
        friend2: friend2.wallet_address,
        title: formData.title,
        resolutionTime,
        currentTime: Math.floor(Date.now() / 1000)
      });

      // Try using Privy's sendTransaction if walletClient is not available
      if (!walletClient && sendTransaction) {
        console.log('Using Privy sendTransaction with proper encoding');
        
        // Properly encode the function call using viem
        const data = encodeFunctionData({
          abi: MARKET_FACTORY_ABI,
          functionName: 'createMarket',
          args: [
            friend1.wallet_address,
            friend2.wallet_address,
            formData.title,
            BigInt(resolutionTime)
          ]
        });
        
        console.log('Encoded data:', data);
        
        const txHash = await sendTransaction({
          to: MARKET_FACTORY_ADDRESS,
          data
        });
        
        console.log('Transaction hash:', txHash);
        alert('Market created! Transaction: ' + txHash);
        onSuccess?.();
        onClose();
        return;
      }

      if (!walletClient) {
        alert('Please connect your wallet first. Try refreshing the page.');
        setLoading(false);
        return;
      }

      // Call createMarket using wagmi
      const hash = await walletClient.writeContract({
        address: MARKET_FACTORY_ADDRESS,
        abi: MARKET_FACTORY_ABI,
        functionName: 'createMarket',
        args: [
          friend1.wallet_address,
          friend2.wallet_address,
          formData.title,
          BigInt(resolutionTime)
        ]
      });

      console.log('Transaction hash:', hash);
      alert('Market created! Transaction: ' + hash);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating market:', error);
      alert('Failed to create market: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '12px',
        maxWidth: '500px',
        width: '90%'
      }}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 'bold' }}>Create Bet</h2>
        
        {!walletClient && (
          <div style={{
            background: '#fef3c7',
            border: '1px solid #fbbf24',
            borderRadius: '6px',
            padding: '0.75rem',
            marginBottom: '1rem',
            fontSize: '0.9rem',
            color: '#92400e'
          }}>
            ⚠️ Wallet may not be fully connected. If the button doesn't work, try refreshing the page.
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#f3f4f6', borderRadius: '6px', fontSize: '0.85rem' }}>
            <strong>Debug Info:</strong> {friends.length} friends loaded
            {friends.map(f => (
              <div key={f.id} style={{fontSize: '0.75rem', marginTop: '0.25rem'}}>
                • {f.display_name}: {f.wallet_address ? f.wallet_address.slice(0,10)+'...' : '❌ NO WALLET'}
              </div>
            ))}
          </div>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Market Question
            </label>
            <input
              type="text"
              placeholder="Will Max and Sarah go on a date?"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Friend 1
            </label>
            <select
              value={formData.friend1Id}
              onChange={(e) => setFormData({ ...formData, friend1Id: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="">Select friend...</option>
              {friends.map(friend => (
                <option key={friend.id} value={friend.id} disabled={!friend.wallet_address}>
                  {friend.display_name || friend.wallet_address?.slice(0, 6) + '...' + friend.wallet_address?.slice(-4)}
                  {!friend.wallet_address && ' (No wallet)'}
                </option>
              ))}
            </select>
            {formData.friend1Id && friends.find(f => f.id === formData.friend1Id)?.wallet_address === '' && (
              <p style={{marginTop: '0.5rem', fontSize: '0.85rem', color: '#dc2626'}}>
                ⚠️ This friend doesn't have a wallet address. They need to log in first.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Friend 2
            </label>
            <select
              value={formData.friend2Id}
              onChange={(e) => setFormData({ ...formData, friend2Id: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '1rem'
              }}
            >
              <option value="">Select friend...</option>
              {friends.filter(f => f.id !== formData.friend1Id).map(friend => (
                <option key={friend.id} value={friend.id} disabled={!friend.wallet_address}>
                  {friend.display_name || friend.wallet_address?.slice(0, 6) + '...' + friend.wallet_address?.slice(-4)}
                  {!friend.wallet_address && ' (No wallet)'}
                </option>
              ))}
            </select>
            {formData.friend2Id && friends.find(f => f.id === formData.friend2Id)?.wallet_address === '' && (
              <p style={{marginTop: '0.5rem', fontSize: '0.85rem', color: '#dc2626'}}>
                ⚠️ This friend doesn't have a wallet address. They need to log in first.
              </p>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Market Duration
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="number"
                min="1"
                value={formData.timeValue}
                onChange={(e) => setFormData({ ...formData, timeValue: parseInt(e.target.value) || 1 })}
                required
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              />
              <select
                value={formData.timeUnit}
                onChange={(e) => setFormData({ ...formData, timeUnit: e.target.value })}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem'
                }}
              >
                <option value="seconds">Seconds ⚡</option>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
              💡 Use seconds/minutes for quick testing
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                background: 'white',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '0.75rem',
                border: 'none',
                borderRadius: '6px',
                background: loading ? '#9ca3af' : '#3b82f6',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: 600
              }}
            >
              {loading ? 'Creating...' : 'Create Market'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
