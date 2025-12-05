import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePublicClient, useWalletClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import CreateMarket from '../components/CreateMarket';
import { supabase } from '../services/supabase';
import './Markets.css';

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

const MARKET_FACTORY_ADDRESS = '0x200aC27d73eDd6E469C842b7EFb60CFcf9059773';
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
  },
  {
    "inputs": [{"name": "position", "type": "bool"}, {"name": "amount", "type": "uint256"}],
    "name": "placeBet",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimWinnings",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "usdcToken",
    "outputs": [{"type": "address"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "", "type": "address"}],
    "name": "canBet",
    "outputs": [{"type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const USDC_ABI = [
  {
    "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
    "name": "approve",
    "outputs": [{"type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"type": "uint256"}],
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
  const [bettingMarket, setBettingMarket] = useState(null);

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

  async function handlePlaceBet(market, position) {
    const amount = prompt(`Enter bet amount in USDC (you have ${position ? 'YES' : 'NO'}):`, '10');
    if (!amount || isNaN(amount) || Number(amount) <= 0) return;

    try {
      setBettingMarket(market.address);
      const amountInDecimals = BigInt(Math.floor(Number(amount) * 1e6)); // USDC has 6 decimals

      // Get USDC contract address from market
      const usdcAddress = await publicClient.readContract({
        address: market.address,
        abi: DATE_MARKET_ABI,
        functionName: 'usdcToken'
      });

      // First, approve USDC spending
      if (sendTransaction) {
        const approveData = encodeFunctionData({
          abi: USDC_ABI,
          functionName: 'approve',
          args: [market.address, amountInDecimals]
        });
        
        const approveHash = await sendTransaction({
          to: usdcAddress,
          data: approveData
        });
        
        console.log('Approval transaction:', approveHash);
        
        // Wait a bit for approval to confirm
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Now place the bet
        const betData = encodeFunctionData({
          abi: DATE_MARKET_ABI,
          functionName: 'placeBet',
          args: [position, amountInDecimals]
        });
        
        const betHash = await sendTransaction({
          to: market.address,
          data: betData
        });
        
        // Record bet in database
        try {
          await fetch('http://localhost:3001/api/bets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user?.id,
              contract_address: market.address,
              wallet_address: user?.wallet?.address,
              position,
              amount: Number(amount),
              transaction_hash: betHash
            })
          });
        } catch (dbError) {
          console.error('Failed to record bet in database:', dbError);
        }
        
        alert(`Bet placed! Transaction: ${betHash}`);
        await loadMarkets();
        return;
      }

      // Fallback to walletClient
      if (!walletClient) {
        alert('Please connect your wallet');
        return;
      }

      // Approve USDC
      const approveHash = await walletClient.writeContract({
        address: usdcAddress,
        abi: USDC_ABI,
        functionName: 'approve',
        args: [market.address, amountInDecimals]
      });

      console.log('Approval transaction:', approveHash);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Place bet
      const betHash = await walletClient.writeContract({
        address: market.address,
        abi: DATE_MARKET_ABI,
        functionName: 'placeBet',
        args: [position, amountInDecimals]
      });

      console.log('Bet transaction:', betHash);
      
      // Record bet in database
      try {
        await fetch('http://localhost:3001/api/bets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user?.id,
            contract_address: market.address,
            wallet_address: user?.wallet?.address,
            position,
            amount: Number(amount),
            transaction_hash: betHash
          })
        });
      } catch (dbError) {
        console.error('Failed to record bet in database:', dbError);
      }

      alert(`Bet placed! Transaction: ${betHash}`);
      await loadMarkets();
    } catch (error) {
      console.error('Error placing bet:', error);
      alert('Failed to place bet: ' + error.message);
    } finally {
      setBettingMarket(null);
    }
  }

  async function handleClaimWinnings(market) {
    try {
      setBettingMarket(market.address);
      
      if (sendTransaction) {
        const data = encodeFunctionData({
          abi: DATE_MARKET_ABI,
          functionName: 'claimWinnings',
          args: []
        });
        
        const hash = await sendTransaction({
          to: market.address,
          data
        });
        
        alert(`Winnings claimed! Transaction: ${hash}`);
        await loadMarkets();
        return;
      }

      if (!walletClient) {
        alert('Please connect your wallet');
        return;
      }

      const hash = await walletClient.writeContract({
        address: market.address,
        abi: DATE_MARKET_ABI,
        functionName: 'claimWinnings'
      });

      alert(`Winnings claimed! Transaction: ${hash}`);
      await loadMarkets();
    } catch (error) {
      console.error('Error claiming winnings:', error);
      alert('Failed to claim winnings: ' + error.message);
    } finally {
      setBettingMarket(null);
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
      <div className="markets-page-loading">
        <div className="loading-spinner">Please login to view markets</div>
      </div>
    );
  }

  return (
    <div className="markets-page">
      <div className="markets-container">
        <div className="markets-header">
          <div className="markets-header-left">
            <h1>Dating Prediction Markets</h1>
            <p className="markets-header-subtitle">
              Last updated: {new Date(lastUpdateTime).toLocaleTimeString()} • Auto-refreshes every 10s
            </p>
          </div>
          <div className="markets-header-actions">
            <button 
              onClick={() => loadMarkets()}
              className="btn-refresh"
            >
              🔄 Refresh
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="btn-create"
            >
              + Create Bet
            </button>
          </div>
        </div>

        <div className="markets-content">
          {loading ? (
            <div className="loading-state">
              Loading markets...
            </div>
          ) : markets.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">💑</div>
              <h3>No bets yet!</h3>
              <p>Create the first prediction market and start betting on dates!</p>
              <button 
                onClick={() => setShowCreateModal(true)}
                className="btn-create"
              >
                Create the First Bet
              </button>
            </div>
          ) : (
            <div className="markets-list">
              {markets.map((market) => {
                const isCreator = user?.wallet?.address?.toLowerCase() === market.creator?.toLowerCase();
                const isFriend1 = user?.wallet?.address?.toLowerCase() === market.friend1?.toLowerCase();
                const isFriend2 = user?.wallet?.address?.toLowerCase() === market.friend2?.toLowerCase();
                const canVote = (isFriend1 || isFriend2) && market.canResolve && !market.resolved;
                const hasVoted = (isFriend1 && market.friend1HasVoted) || (isFriend2 && market.friend2HasVoted);
                const isPastResolution = Date.now() >= market.resolutionTime.getTime();
                
                return (
                <div key={market.address} className="market-card">
                  <div className="market-card-header-stripe"></div>
                  
                  <div className="market-card-content">
                    <div className="market-card-header">
                      <h3 className="market-title">{market.title}</h3>
                      {market.resolved ? (
                        <span className="market-status-badge market-status-resolved">
                          ✓ {market.outcome ? 'YES' : 'NO'}
                        </span>
                      ) : isPastResolution ? (
                        <span className="market-status-badge market-status-pending">
                          {market.votesCount}/2
                        </span>
                      ) : (
                        <span className="market-status-badge market-status-active">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="market-participants">
                      <div className="participants-label">💑 PARTICIPANTS</div>
                      <div className="participant-name">
                        {market.friend1Name} {isFriend1 && '(You)'}
                      </div>
                      <div className="participant-name">
                        {market.friend2Name} {isFriend2 && '(You)'}
                      </div>
                      {(market.friend1HasVoted || market.friend2HasVoted) && (
                        <div className="participant-votes">
                          {market.friend1HasVoted && `✓ ${market.friend1Name.split(' ')[0]}: ${market.friend1Vote ? 'YES' : 'NO'}`}
                          {market.friend1HasVoted && market.friend2HasVoted && ' | '}
                          {market.friend2HasVoted && `✓ ${market.friend2Name.split(' ')[0]}: ${market.friend2Vote ? 'YES' : 'NO'}`}
                        </div>
                      )}
                    </div>

                    <div className="market-pools">
                      <div className="pool-card pool-yes">
                        <div className="pool-label pool-label-yes">YES</div>
                        <div className="pool-amount pool-amount-yes">{market.totalYesPool.toFixed(1)}</div>
                        <div className="pool-odds">{market.yesOdds}%</div>
                      </div>
                      <div className="pool-card pool-no">
                        <div className="pool-label pool-label-no">NO</div>
                        <div className="pool-amount pool-amount-no">{market.totalNoPool.toFixed(1)}</div>
                        <div className="pool-odds">{market.noOdds}%</div>
                      </div>
                    </div>

                    <div className="market-footer">
                      <div className="countdown-timer">
                        ⏰ <CountdownTimer targetTime={market.resolutionTime} />
                      </div>
                      {isCreator && <div className="creator-badge">📝 You created</div>}
                    </div>
                  </div>

                  <div className="market-actions">
                    {/* Resolution controls for the two people in the date */}
                    {canVote && !hasVoted && (
                      <div className="voting-section">
                        <p className="voting-section-title">
                          ⏰ Time to vote on the outcome!
                        </p>
                        <p className="voting-section-description">
                          {market.votesCount === 0 && '0/2 votes - Both people in the date must vote and agree'}
                          {market.votesCount === 1 && `1/2 votes - ${market.friend1HasVoted ? 'Friend 1' : 'Friend 2'} voted ${market.friend1HasVoted ? (market.friend1Vote ? 'YES' : 'NO') : (market.friend2Vote ? 'YES' : 'NO')}. You must vote the same to resolve!`}
                          {market.votesCount === 2 && '2/2 votes received'}
                        </p>
                        <div className="voting-buttons">
                          <button
                            onClick={() => handleResolve(market, true)}
                            disabled={resolvingMarket === market.address}
                            className="btn-vote btn-vote-yes"
                          >
                            {resolvingMarket === market.address ? 'Voting...' : 'Vote YES ✓'}
                          </button>
                          <button
                            onClick={() => handleResolve(market, false)}
                            disabled={resolvingMarket === market.address}
                            className="btn-vote btn-vote-no"
                          >
                            {resolvingMarket === market.address ? 'Voting...' : 'Vote NO ✗'}
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {hasVoted && !market.resolved && (
                      <div className="voted-section">
                        <p className="voted-section-text">
                          ✅ You voted: <strong>{(isFriend1 && market.friend1Vote) || (isFriend2 && market.friend2Vote) ? 'YES' : 'NO'}</strong>
                        </p>
                        <p className="voted-section-waiting">
                          Waiting for the other person to vote... ({market.votesCount}/2)
                        </p>
                      </div>
                    )}

                    {/* Betting controls for active markets */}
                    {!market.resolved && !isPastResolution && (
                      <div className="betting-actions">
                        <button 
                          className="btn-bet btn-bet-yes"
                          onClick={() => handlePlaceBet(market, true)}
                          disabled={bettingMarket === market.address}
                        >
                          {bettingMarket === market.address ? 'Processing...' : 'Bet YES'}
                        </button>
                        <button 
                          className="btn-bet btn-bet-no"
                          onClick={() => handlePlaceBet(market, false)}
                          disabled={bettingMarket === market.address}
                        >
                          {bettingMarket === market.address ? 'Processing...' : 'Bet NO'}
                        </button>
                      </div>
                    )}

                    {/* Claim winnings for resolved markets */}
                    {market.resolved && (
                      <div className="betting-actions">
                        <button 
                          className="btn-claim"
                          onClick={() => handleClaimWinnings(market)}
                          disabled={bettingMarket === market.address}
                        >
                          {bettingMarket === market.address ? 'Processing...' : 'Claim Winnings'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <CreateMarket 
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadMarkets}
        />
      )}
    </div>
  );
}
