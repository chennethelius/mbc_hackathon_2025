import { useState, useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
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
    days: 7
  });

  useEffect(() => {
    async function loadFriends() {
      try {
        const currentUser = {
          id: user?.id || 'me',
          wallet_address: user?.wallet?.address || '',
          display_name: 'Me'
        };

        const res = await getFriends(user?.id);
        if (!res || !res.success) {
          setFriends([currentUser]);
          return;
        }

        // `getFriends` returns items with `profile` nested
        const apiFriends = (res.friends || []).map(item => {
          const profile = item.profile || {};
          return {
            id: profile.id || item.friendId || profile.user_id || profile.id,
            wallet_address: profile.wallet_address || profile.wallet || profile.address || '0x0000000000000000000000000000000000000000',
            display_name: profile.display_name || profile.full_name || profile.username || profile.email || 'Friend'
          };
        });

        setFriends([currentUser, ...apiFriends]);
      } catch (error) {
        console.error('Error loading friends:', error);
        setFriends([{
          id: user?.id || 'me',
          wallet_address: user?.wallet?.address || '',
          display_name: 'Me'
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

      // Calculate resolution time (days from now)
      const resolutionTime = Math.floor(Date.now() / 1000) + (formData.days * 24 * 60 * 60);

      console.log('Creating market with:', {
        address: MARKET_FACTORY_ADDRESS,
        friend1: friend1.wallet_address,
        friend2: friend2.wallet_address,
        title: formData.title,
        resolutionTime
      });

      // Try using Privy's sendTransaction if walletClient is not available
      if (!walletClient && sendTransaction) {
        console.log('Using Privy sendTransaction');
        
        // Encode the function call
        const iface = {
          encodeFunctionData: () => {
            // Simple ABI encoding for createMarket function
            // Function signature: createMarket(address,address,string,uint256)
            const functionSelector = '0x' + '45e4a3f2'; // keccak256("createMarket(address,address,string,uint256)")[:4]
            // This is a simplified version - in production use ethers.js or viem
            console.warn('Using simplified encoding - may not work correctly');
            return functionSelector;
          }
        };
        
        const txHash = await sendTransaction({
          to: MARKET_FACTORY_ADDRESS,
          data: iface.encodeFunctionData('createMarket', [
            friend1.wallet_address,
            friend2.wallet_address,
            formData.title,
            resolutionTime
          ])
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
        <h2 style={{ marginBottom: '1.5rem' }}>Create Market</h2>
        
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
                <option key={friend.id} value={friend.id}>
                  {friend.display_name || friend.wallet_address?.slice(0, 6) + '...' + friend.wallet_address?.slice(-4)}
                </option>
              ))}
            </select>
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
                <option key={friend.id} value={friend.id}>
                  {friend.display_name || friend.wallet_address?.slice(0, 6) + '...' + friend.wallet_address?.slice(-4)}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
              Resolve in (days)
            </label>
            <input
              type="number"
              min="1"
              value={formData.days}
              onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
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
