import { useState, useEffect } from 'react';
import { useWalletClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';

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
  const { user } = usePrivy();
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
        console.log('Loading friends for user:', user?.id);
        console.log('User wallet address:', user?.wallet?.address);
        
        // Add current user to the list
        const currentUser = {
          id: user?.id || 'me',
          wallet_address: user?.wallet?.address || '',
          display_name: 'Me'
        };

        // Fetch friends from backend
        const response = await fetch(`http://localhost:3001/api/friends/${user?.id}`);
        console.log('Friends API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Friends API data:', data);
          
          // Map the API response to our expected format
          const apiFriends = (data.friends || []).map(f => ({
            id: f.friend?.id || f.id,
            wallet_address: f.friend?.wallet_address || f.wallet_address || '0x0000000000000000000000000000000000000000',
            display_name: f.friend?.full_name || f.friend?.email || f.full_name || f.email || 'Friend'
          }));
          
          console.log('Mapped friends:', apiFriends);
          setFriends([currentUser, ...apiFriends]);
        } else {
          console.log('API response not ok, using only current user');
          setFriends([currentUser]);
        }
      } catch (error) {
        console.error('Error loading friends:', error);
        // Fallback to just current user
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
    if (!walletClient) return;

    try {
      setLoading(true);

      // Get wallet addresses from selected friends
      const friend1 = friends.find(f => f.id === formData.friend1Id);
      const friend2 = friends.find(f => f.id === formData.friend2Id);

      if (!friend1 || !friend2) {
        alert('Please select both friends');
        return;
      }

      // Calculate resolution time (days from now)
      const resolutionTime = Math.floor(Date.now() / 1000) + (formData.days * 24 * 60 * 60);

      // Call createMarket
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
                background: '#3b82f6',
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
