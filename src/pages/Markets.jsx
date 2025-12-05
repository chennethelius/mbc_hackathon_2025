import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePublicClient, useWalletClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import CreateMarket from '../components/CreateMarket';
import { supabase } from '../services/supabase';

// Countdown timer component
function CountdownTimer({ targetTime }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    function updateCountdown() {
      const now = Date.now();
      const target = new Date(targetTime).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft('⏰ Ready to resolve!');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return <span>{timeLeft}</span>;
}

const MARKET_FACTORY_ADDRESS = '0xCa897F235F88316f03D34ecCC7701a4dA4a36895';
const MARKET_FACTORY_ABI = [
  {
    "inputs": [],
    "name": "getMarketCount",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256"}],
    "name": "allMarkets",
    "outputs": [{"type": "address"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const DATE_MARKET_ABI = [
  {
    "inputs": [],
    "name": "title",
    "outputs": [{"type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creator",
    "outputs": [{"type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "friend1",
    "outputs": [{"type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "friend2",
    "outputs": [{"type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resolutionTime",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalYesPool",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalNoPool",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "resolved",
    "outputs": [{"type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "outcome",
    "outputs": [{"type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "_outcome", "type": "bool"}],
    "name": "resolve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getResolutionStatus",
    "outputs": [
      {"name": "friend1HasVoted", "type": "bool"},
      {"name": "friend2HasVoted", "type": "bool"},
      {"name": "friend1VoteValue", "type": "bool"},
      {"name": "friend2VoteValue", "type": "bool"},
      {"name": "isResolved", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

export default function Markets() {
  const { authenticated, user, sendTransaction } = usePrivy();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resolvingMarket, setResolvingMarket] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(Date.now());

  useEffect(() => {
    if (authenticated && publicClient) {
      loadMarkets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, publicClient]);

  // Auto-refresh markets every 10 seconds to catch new creations
  useEffect(() => {
    if (!authenticated || !publicClient) return;
    
    const interval = setInterval(() => {
      console.log('Auto-refreshing markets...');
      loadMarkets();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, publicClient]);

  async function handleResolve(market, outcome) {
    try {
      setResolvingMarket(market.address);
      
      // Try Privy sendTransaction first (for embedded wallets)
      if (sendTransaction) {
        const data = encodeFunctionData({
          abi: DATE_MARKET_ABI,
          functionName: 'resolve',
          args: [outcome]
        });
        
        const hash = await sendTransaction({
          to: market.address,
          data
        });
        
        alert(`Market resolved! Transaction: ${hash}`);
        await loadMarkets();
        return;
      }

      // Fallback to walletClient
      if (!walletClient) {
        alert('Please connect your wallet');
        return;
      }

      const hash = await walletClient.writeContract({
        address: market.address,
        abi: DATE_MARKET_ABI,
        functionName: 'resolve',
        args: [outcome]
      });

      alert(`Market resolved! Transaction: ${hash}`);
      await loadMarkets();
    } catch (error) {
      console.error('Error resolving market:', error);
      alert('Failed to resolve market: ' + error.message);
    } finally {
      setResolvingMarket(null);
    }
  }

  async function getUserNameByWallet(walletAddress) {
    try {
      const { data: wallet } = await supabase
        .from('wallets')
        .select('user_id')
        .eq('wallet_address', walletAddress)
        .single();
      
      if (!wallet) return walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, full_name, username, email')
        .eq('id', wallet.user_id)
        .single();
      
      return profile?.display_name || profile?.full_name || profile?.username || profile?.email?.split('@')[0] || walletAddress.slice(0, 6) + '...';
    } catch {
      return walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4);
    }
  }

  async function loadMarkets() {
    try {
      setLoading(true);
      
      // Get total number of markets
      const count = await publicClient.readContract({
        address: MARKET_FACTORY_ADDRESS,
        abi: MARKET_FACTORY_ABI,
        functionName: 'getMarketCount'
      });

      console.log(`Found ${count} total markets`);

      // Fetch each market's details
      const marketPromises = [];
      for (let i = 0; i < Number(count); i++) {
        marketPromises.push(loadMarketDetails(i));
      }

      const marketsData = await Promise.all(marketPromises);
      setMarkets(marketsData);
      setLastUpdateTime(Date.now());
      
      console.log('Markets loaded:', marketsData);
    } catch (error) {
      console.error('Error loading markets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMarketDetails(index) {
    // Get market address
    const marketAddress = await publicClient.readContract({
      address: MARKET_FACTORY_ADDRESS,
      abi: MARKET_FACTORY_ABI,
      functionName: 'allMarkets',
      args: [BigInt(index)]
    });

    // Get market details including resolution status
    const [title, creator, friend1, friend2, resolutionTime, totalYesPool, totalNoPool, resolved, outcome, resolutionStatus] = await Promise.all([
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'title' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'creator' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'friend1' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'friend2' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'resolutionTime' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'totalYesPool' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'totalNoPool' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'resolved' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'outcome' }).catch(() => false),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'getResolutionStatus' }).catch(() => [false, false, false, false, false])
    ]);

    const totalPool = Number(totalYesPool) + Number(totalNoPool);
    const yesOdds = totalPool > 0 ? Math.round((Number(totalYesPool) / totalPool) * 100) : 50;
    
    // Fetch names for friend1 and friend2
    const [friend1Name, friend2Name] = await Promise.all([
      getUserNameByWallet(friend1),
      getUserNameByWallet(friend2)
    ]);
    
    const resolutionDate = new Date(Number(resolutionTime) * 1000);
    const canResolve = Date.now() >= resolutionDate.getTime() && !resolved;
    
    const [friend1HasVoted, friend2HasVoted, friend1Vote, friend2Vote] = resolutionStatus;
    const votesCount = (friend1HasVoted ? 1 : 0) + (friend2HasVoted ? 1 : 0);

    return {
      address: marketAddress,
      title,
      creator,
      friend1,
      friend2,
      friend1Name,
      friend2Name,
      resolutionTime: resolutionDate,
      totalYesPool: Number(totalYesPool) / 1e6, // USDC has 6 decimals
      totalNoPool: Number(totalNoPool) / 1e6,
      yesOdds,
      noOdds: 100 - yesOdds,
      resolved,
      outcome,
      canResolve,
      friend1HasVoted,
      friend2HasVoted,
      friend1Vote,
      friend2Vote,
      votesCount
    };
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please login to view markets</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dating Prediction Markets</h1>
            <p className="text-sm text-gray-500 mt-1">
              Last updated: {new Date(lastUpdateTime).toLocaleTimeString()} • Auto-refreshes every 10s
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => loadMarkets()}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              🔄 Refresh
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Create Bet
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading markets...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No bets yet!</p>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Create the First Bet
            </button>
          </div>
        ) : (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            {markets.map((market) => {
              const isCreator = user?.wallet?.address?.toLowerCase() === market.creator?.toLowerCase();
              const isFriend1 = user?.wallet?.address?.toLowerCase() === market.friend1?.toLowerCase();
              const isFriend2 = user?.wallet?.address?.toLowerCase() === market.friend2?.toLowerCase();
              const canVote = (isFriend1 || isFriend2) && market.canResolve && !market.resolved;
              const hasVoted = (isFriend1 && market.friend1HasVoted) || (isFriend2 && market.friend2HasVoted);
              const isPastResolution = Date.now() >= market.resolutionTime.getTime();
              
              return (
                <div key={market.address} style={{
                  background: 'linear-gradient(135deg, #fafafa 0%, #ffffff 100%)',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  padding: '1rem',
                  marginBottom: '0.75rem',
                  border: '2px solid #e5e7eb',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Compact header stripe */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #a855f7 0%, #ec4899 50%, #fb923c 100%)'
                  }}></div>

                  <div style={{ position: 'relative', marginTop: '0.25rem' }}>
                    {/* Compact Title Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#111827', margin: 0, flex: 1 }}>
                        {market.title}
                      </h3>
                      {market.resolved ? (
                        <span style={{
                          background: '#dcfce7',
                          color: '#166534',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          ✓ {market.outcome ? 'YES' : 'NO'}
                        </span>
                      ) : isPastResolution ? (
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {market.votesCount}/2
                        </span>
                      ) : (
                        <span style={{
                          background: '#dbeafe',
                          color: '#1e40af',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          ACTIVE
                        </span>
                      )}
                    </div>

                    {/* Compact Parties & Pools */}
                    <div style={{ marginBottom: '0.5rem' }}>
                      {/* Participants */}
                      <div style={{ background: '#faf5ff', padding: '0.5rem', borderRadius: '6px', border: '1px solid #e9d5ff', marginBottom: '0.5rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#6b21a8', fontWeight: 'bold', marginBottom: '0.25rem' }}>💑 PARTICIPANTS</div>
                        <div style={{ fontSize: '0.75rem', color: '#1f2937', fontWeight: '600' }}>
                          {market.friend1Name} {isFriend1 && '(You)'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#1f2937', fontWeight: '600' }}>
                          {market.friend2Name} {isFriend2 && '(You)'}
                        </div>
                        {(market.friend1HasVoted || market.friend2HasVoted) && (
                          <div style={{ fontSize: '0.65rem', color: '#15803d', marginTop: '0.25rem' }}>
                            {market.friend1HasVoted && `✓ ${market.friend1Name.split(' ')[0]}: ${market.friend1Vote ? 'YES' : 'NO'}`}
                            {market.friend1HasVoted && market.friend2HasVoted && ' | '}
                            {market.friend2HasVoted && `✓ ${market.friend2Name.split(' ')[0]}: ${market.friend2Vote ? 'YES' : 'NO'}`}
                          </div>
                        )}
                      </div>

                      {/* Pools */}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div style={{ flex: 1, background: '#f0fdf4', padding: '0.5rem', borderRadius: '6px', border: '1px solid #86efac' }}>
                          <div style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 'bold' }}>YES</div>
                          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#15803d' }}>{market.totalYesPool.toFixed(1)}</div>
                          <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{market.yesOdds}%</div>
                        </div>
                        <div style={{ flex: 1, background: '#fef2f2', padding: '0.5rem', borderRadius: '6px', border: '1px solid #fca5a5' }}>
                          <div style={{ fontSize: '0.65rem', color: '#b91c1c', fontWeight: 'bold' }}>NO</div>
                          <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#b91c1c' }}>{market.totalNoPool.toFixed(1)}</div>
                          <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{market.noOdds}%</div>
                        </div>
                      </div>
                    </div>

                    {/* Compact Time & Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#6b7280' }}>
                      <div>
                        ⏰ <CountdownTimer targetTime={market.resolutionTime} />
                      </div>
                      {isCreator && <div style={{ fontSize: '0.65rem', color: '#1d4ed8' }}>📝 You created</div>}
                    </div>
                  </div>

                  {/* Resolution controls for the two people in the date */}
                  {canVote && !hasVoted && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-1">
                        ⏰ Time to vote on the outcome!
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        {market.votesCount === 0 && '0/2 votes - Both people in the date must vote and agree'}
                        {market.votesCount === 1 && `1/2 votes - ${market.friend1HasVoted ? 'Friend 1' : 'Friend 2'} voted ${market.friend1HasVoted ? (market.friend1Vote ? 'YES' : 'NO') : (market.friend2Vote ? 'YES' : 'NO')}. You must vote the same to resolve!`}
                        {market.votesCount === 2 && '2/2 votes received'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(market, true)}
                          disabled={resolvingMarket === market.address}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolvingMarket === market.address ? 'Voting...' : 'Vote YES ✓'}
                        </button>
                        <button
                          onClick={() => handleResolve(market, false)}
                          disabled={resolvingMarket === market.address}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolvingMarket === market.address ? 'Voting...' : 'Vote NO ✗'}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {hasVoted && !market.resolved && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-700">
                        ✅ You voted: <strong>{(isFriend1 && market.friend1Vote) || (isFriend2 && market.friend2Vote) ? 'YES' : 'NO'}</strong>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Waiting for the other person to vote... ({market.votesCount}/2)
                      </p>
                    </div>
                  )}

                  {/* Betting controls for active markets */}
                  {!market.resolved && !isPastResolution && (
                    <div className="flex justify-end space-x-2">
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium">
                        Bet YES
                      </button>
                      <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium">
                        Bet NO
                      </button>
                    </div>
                  )}

                  {/* Claim winnings for resolved markets */}
                  {market.resolved && (
                    <div className="flex justify-end">
                      <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 font-medium">
                        Claim Winnings
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <CreateMarket 
            onClose={() => setShowCreateModal(false)}
            onSuccess={loadMarkets}
          />
        )}
      </div>
    </div>
  );
}
