import { useState } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { usePrivy } from '@privy-io/react-auth';
import './Contracts.css';

const MARKET_FACTORY_ADDRESS = '0xCa897F235F88316f03D34ecCC7701a4dA4a36895';
const MOCK_USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Coinbase USDC - works with your existing balance!

// Test wallets
const TEST_WALLETS = [
  { name: 'Connor', address: '0xb7718695BbAD84974c89A266A428D2ADB67b691B' },
  { name: 'Max', address: '0x24A95C49E7DFd830C0cEe2D0a357553D548c4556' }
];

export default function Contracts() {
  const { authenticated, user, sendTransaction } = usePrivy();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [ethBalance, setEthBalance] = useState(null);
  const [testWalletBalances, setTestWalletBalances] = useState([]);
  const [loading, setLoading] = useState(false);

  const contracts = [
    {
      name: 'MarketFactory',
      address: MARKET_FACTORY_ADDRESS,
      description: 'Creates and manages DateMarket contracts',
      functions: [
        {
          name: 'createMarket',
          params: ['friend1 (address)', 'friend2 (address)', 'title (string)', 'resolutionTime (uint256)'],
          returns: 'Market address',
          description: 'Deploy a new prediction market for two friends'
        },
        {
          name: 'getMarketCount',
          params: [],
          returns: 'Number of markets',
          description: 'Get total number of created markets'
        },
        {
          name: 'getMarketsByCreator',
          params: ['creator (address)'],
          returns: 'Array of market addresses',
          description: 'Get all markets created by a specific address'
        },
        {
          name: 'getMarketForPair',
          params: ['friend1 (address)', 'friend2 (address)'],
          returns: 'Market address',
          description: 'Check if a market exists for a friend pair'
        }
      ]
    },
    {
      name: 'DateMarket',
      address: 'Deployed by MarketFactory',
      description: 'Individual prediction market for a dating outcome',
      functions: [
        {
          name: 'placeBet',
          params: ['position (bool: true=YES, false=NO)', 'amount (uint256)'],
          returns: 'void',
          description: 'Place a bet on YES or NO. Requires USDC approval first.'
        },
        {
          name: 'addSponsorship',
          params: ['amount (uint256)'],
          returns: 'void',
          description: 'Add USDC to boost the prize pool without taking a position'
        },
        {
          name: 'resolve',
          params: ['outcome (bool: true=YES, false=NO)'],
          returns: 'void',
          description: 'Resolve the market (only creator, after resolution time)'
        },
        {
          name: 'claimWinnings',
          params: [],
          returns: 'void',
          description: 'Claim your winnings if you bet on the winning outcome'
        }
      ]
    },
    {
      name: 'MockUSDC',
      address: MOCK_USDC_ADDRESS,
      description: 'Test USDC token with faucet (6 decimals)',
      functions: [
        {
          name: 'faucet',
          params: [],
          returns: 'void',
          description: '🎁 Get 1000 free test USDC! Anyone can call this.'
        },
        {
          name: 'approve',
          params: ['spender (address)', 'amount (uint256)'],
          returns: 'bool',
          description: 'Approve a contract to spend your USDC (needed before betting)'
        },
        {
          name: 'balanceOf',
          params: ['account (address)'],
          returns: 'uint256',
          description: 'Check USDC balance of an address'
        }
      ]
    }
  ];

  async function checkBalances() {
    if (!publicClient || !user?.wallet?.address) return;
    
    setLoading(true);
    try {
      // Check ETH balance
      const eth = await publicClient.getBalance({ 
        address: user.wallet.address 
      });
      setEthBalance(Number(eth) / 10**18);

      // Check USDC balance if address is set
      if (MOCK_USDC_ADDRESS && MOCK_USDC_ADDRESS !== '0x...') {
        console.log('Checking USDC balance for:', user.wallet.address);
        console.log('USDC contract:', MOCK_USDC_ADDRESS);
        
        const balanceData = '0x70a08231' + user.wallet.address.slice(2).padStart(64, '0');
        const result = await publicClient.call({
          to: MOCK_USDC_ADDRESS,
          data: balanceData
        });
        
        console.log('USDC balance result:', result);
        // Result could be in result.data or result directly
        const usdcHex = result.data || result;
        const usdcBal = parseInt(usdcHex, 16) / 10**6;
        console.log('USDC balance parsed:', usdcBal);
        setUsdcBalance(usdcBal);
      }
    } catch (error) {
      console.error('Error checking balances:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkTestWallets() {
    if (!publicClient) return;
    
    setLoading(true);
    try {
      const balances = await Promise.all(
        TEST_WALLETS.map(async (wallet) => {
          try {
            // Get ETH balance
            const ethBal = await publicClient.getBalance({ 
              address: wallet.address 
            });
            
            let usdcBal = 0;
            // Get USDC balance if address is set
            if (MOCK_USDC_ADDRESS && MOCK_USDC_ADDRESS !== '0x...') {
              console.log(`Checking USDC balance for ${wallet.name}:`, wallet.address);
              
              const balanceData = '0x70a08231' + wallet.address.slice(2).padStart(64, '0');
              const result = await publicClient.call({
                to: MOCK_USDC_ADDRESS,
                data: balanceData
              });
              
              console.log(`${wallet.name} USDC result:`, result);
              // Result could be in result.data or result directly
              const usdcHex = result.data || result;
              usdcBal = parseInt(usdcHex, 16) / 10**6;
              console.log(`${wallet.name} USDC balance:`, usdcBal);
            }
            
            return {
              ...wallet,
              eth: Number(ethBal) / 10**18,
              usdc: usdcBal
            };
          } catch (error) {
            console.error(`Error checking ${wallet.name}:`, error);
            return { ...wallet, eth: 0, usdc: 0, error: true };
          }
        })
      );
      
      setTestWalletBalances(balances);
    } catch (error) {
      console.error('Error checking test wallets:', error);
    } finally {
      setLoading(false);
    }
  }

  async function callFaucet() {
    if (!MOCK_USDC_ADDRESS || MOCK_USDC_ADDRESS === '0x...') {
      alert('MockUSDC address not set. Please deploy MockUSDC first.');
      return;
    }

    if (!authenticated) {
      alert('Please log in first');
      return;
    }

    setLoading(true);
    try {
      console.log('Calling faucet on MockUSDC:', MOCK_USDC_ADDRESS);
      console.log('walletClient available:', !!walletClient);
      console.log('sendTransaction available:', !!sendTransaction);
      
      let hash;
      
      if (walletClient) {
        // Try wagmi walletClient first
        hash = await walletClient.writeContract({
          address: MOCK_USDC_ADDRESS,
          abi: [{
            "inputs": [],
            "name": "faucet",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
          }],
          functionName: 'faucet'
        });
      } else if (sendTransaction) {
        // Use Privy's sendTransaction
        console.log('Using Privy sendTransaction');
        const faucetData = '0x1c2de51b'; // faucet() function selector
        
        const txReceipt = await sendTransaction({
          to: MOCK_USDC_ADDRESS,
          data: faucetData
        });
        
        hash = txReceipt.transactionHash || txReceipt;
      } else {
        throw new Error('No transaction method available. Try refreshing the page.');
      }

      alert(`Success! You'll receive 1000 USDC.\nTransaction: ${hash}`);
      
      // Refresh balance after a delay
      setTimeout(() => checkBalances(), 3000);
    } catch (error) {
      console.error('Faucet error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="contracts-page">
        <div className="login-prompt">
          <h2>📜 Smart Contracts</h2>
          <p>Login to interact with the contracts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contracts-page">
      <div className="contracts-header">
        <h1>📜 Smart Contracts</h1>
        <p>Explore and interact with the prediction market contracts</p>
      </div>

      <div className="contracts-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''} 
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button 
          className={activeTab === 'details' ? 'active' : ''} 
          onClick={() => setActiveTab('details')}
        >
          🔍 Contract Details
        </button>
        <button 
          className={activeTab === 'tools' ? 'active' : ''} 
          onClick={() => setActiveTab('tools')}
        >
          🛠️ Testing Tools
        </button>
        <button 
          className={activeTab === 'diagram' ? 'active' : ''} 
          onClick={() => setActiveTab('diagram')}
        >
          📊 Flow Diagram
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="overview-grid">
            {contracts.map((contract, idx) => (
              <div key={idx} className="contract-card">
                <h3>{contract.name}</h3>
                <p className="contract-description">{contract.description}</p>
                <div className="contract-address">
                  <strong>Address:</strong>
                  <code>{contract.address}</code>
                  {contract.address.startsWith('0x') && (
                    <a 
                      href={`https://sepolia.basescan.org/address/${contract.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="explorer-link"
                    >
                      View on Explorer →
                    </a>
                  )}
                </div>
                <div className="function-count">
                  {contract.functions.length} functions
                </div>
              </div>
            ))}
          </div>

          <div className="network-info">
            <h3>🌐 Network Information</h3>
            <ul>
              <li><strong>Network:</strong> Base Sepolia Testnet</li>
              <li><strong>Chain ID:</strong> 84532</li>
              <li><strong>Explorer:</strong> <a href="https://sepolia.basescan.org/" target="_blank" rel="noopener noreferrer">sepolia.basescan.org</a></li>
              <li><strong>RPC:</strong> https://sepolia.base.org</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="tab-content">
          {contracts.map((contract, idx) => (
            <div key={idx} className="contract-detail-section">
              <h2>{contract.name}</h2>
              <p>{contract.description}</p>
              <div className="contract-address">
                <code>{contract.address}</code>
              </div>
              
              <h3>Functions:</h3>
              <div className="functions-list">
                {contract.functions.map((func, fidx) => (
                  <div key={fidx} className="function-item">
                    <div className="function-header">
                      <code className="function-name">{func.name}</code>
                      {func.name === 'faucet' && <span className="badge free">FREE</span>}
                    </div>
                    <div className="function-params">
                      <strong>Parameters:</strong> {func.params.length > 0 ? func.params.join(', ') : 'none'}
                    </div>
                    <div className="function-returns">
                      <strong>Returns:</strong> {func.returns}
                    </div>
                    <div className="function-description">
                      {func.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'tools' && (
        <div className="tab-content">
          <div className="tools-section">
            <h2>🛠️ Testing & Development Tools</h2>
            
            <div className="tool-card">
              <h3>👥 Test Wallet Balances</h3>
              <p>Check Connor and Max's wallet balances on Base Sepolia</p>
              <button onClick={checkTestWallets} disabled={loading}>
                {loading ? 'Checking...' : '🔍 Check Test Wallets'}
              </button>
              
              {testWalletBalances.length > 0 && (
                <div className="test-wallets-grid">
                  {testWalletBalances.map((wallet, idx) => (
                    <div key={idx} className="test-wallet-card">
                      <h4>{wallet.name}</h4>
                      <div className="wallet-address-short">
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </div>
                      {wallet.error ? (
                        <div className="error-text">Error loading balance</div>
                      ) : (
                        <>
                          <div className="balance-row">
                            <span>ETH:</span>
                            <span className={wallet.eth < 0.001 ? 'low-balance' : ''}>
                              {wallet.eth.toFixed(6)} ETH
                            </span>
                          </div>
                          <div className="balance-row">
                            <span>USDC:</span>
                            <span>{wallet.usdc.toLocaleString()} USDC</span>
                          </div>
                          {wallet.eth < 0.001 && (
                            <div className="warning-text">⚠️ Low ETH - get gas from faucet</div>
                          )}
                        </>
                      )}
                      <a 
                        href={`https://sepolia.basescan.org/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-explorer"
                      >
                        View on Explorer →
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="tool-card">
              <h3>💰 Your Balances</h3>
              <button onClick={checkBalances} disabled={loading}>
                {loading ? 'Checking...' : 'Refresh Balances'}
              </button>
              
              {ethBalance !== null && (
                <div className="balance-display">
                  <div className="balance-item">
                    <span className="balance-label">ETH:</span>
                    <span className="balance-value">{ethBalance.toFixed(6)} ETH</span>
                  </div>
                  {usdcBalance !== null && (
                    <div className="balance-item">
                      <span className="balance-label">USDC:</span>
                      <span className="balance-value">{usdcBalance.toLocaleString()} USDC</span>
                    </div>
                  )}
                </div>
              )}

              <div className="wallet-info">
                <strong>Your Wallet:</strong>
                <code>{user?.wallet?.address || 'Not available'}</code>
              </div>
            </div>

            <div className="tool-card">
              <h3>🎁 Get Test USDC</h3>
              <p>Click to receive 1000 free test USDC from your MockUSDC faucet!</p>
              <button onClick={callFaucet} disabled={loading || !authenticated}>
                {loading ? 'Processing...' : '💰 Get 1000 USDC'}
              </button>
              {!authenticated && (
                <p className="warning">⚠️ Please log in first</p>
              )}
            </div>

            <div className="tool-card">
              <h3>⛽ Get Test ETH (for gas fees)</h3>
              <p>You need ETH for gas fees. Use these faucets:</p>
              <div className="important-note">
                <strong>✅ Yes - Fund with ETH for gas!</strong><br/>
                Both Connor and Max need Base Sepolia ETH to pay for transactions.
              </div>
              <div className="faucet-links">
                <a href="https://www.coinbase.com/faucets/base-ethereum-goerli-faucet" target="_blank" rel="noopener noreferrer" className="faucet-button">
                  Coinbase Faucet
                </a>
                <a href="https://faucet.quicknode.com/base/sepolia" target="_blank" rel="noopener noreferrer" className="faucet-button">
                  QuickNode Faucet
                </a>
              </div>
            </div>

            <div className="tool-card">
              <h3>💵 About USDC for Betting</h3>
              <div className="important-note">
                <strong>✅ Yes - Need USDC for betting!</strong><br/>
                The contracts use USDC (6 decimals) for all bets and payouts.
              </div>
              <p>Use the faucet button above to get 1000 test USDC, or deploy MockUSDC and call the faucet function.</p>
            </div>

            <div className="tool-card">
              <h3>🌐 Network: Base Sepolia</h3>
              <div className="network-details">
                <div><strong>Chain ID:</strong> 84532</div>
                <div><strong>RPC:</strong> https://sepolia.base.org</div>
                <div><strong>Explorer:</strong> https://sepolia.basescan.org/</div>
                <div><strong>Currency:</strong> ETH (for gas) + USDC (for betting)</div>
              </div>
            </div>

            <div className="tool-card">
              <h3>🔗 Useful Links</h3>
              <ul className="links-list">
                <li>
                  <a href={`https://sepolia.basescan.org/address/${MARKET_FACTORY_ADDRESS}`} target="_blank" rel="noopener noreferrer">
                    View MarketFactory on Explorer
                  </a>
                </li>
                <li>
                  <a href="https://sepolia.basescan.org/" target="_blank" rel="noopener noreferrer">
                    Base Sepolia Explorer
                  </a>
                </li>
                <li>
                  <a href="https://docs.base.org/" target="_blank" rel="noopener noreferrer">
                    Base Documentation
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'diagram' && (
        <div className="tab-content">
          <h2>📊 Contract Interaction Flow</h2>
          
          <div className="flow-diagram">
            <div className="flow-section">
              <h3>1️⃣ Market Creation</h3>
              <div className="flow-steps">
                <div className="flow-step">User → <code>MarketFactory.createMarket()</code></div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">MarketFactory deploys new <code>DateMarket</code></div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">Returns market address</div>
              </div>
            </div>

            <div className="flow-section">
              <h3>2️⃣ Placing Bets</h3>
              <div className="flow-steps">
                <div className="flow-step">User → <code>USDC.approve(marketAddress, amount)</code></div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">User → <code>DateMarket.placeBet(position, amount)</code></div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">DateMarket transfers USDC from user</div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">Bet recorded, pool updated</div>
              </div>
            </div>

            <div className="flow-section">
              <h3>3️⃣ Market Resolution</h3>
              <div className="flow-steps">
                <div className="flow-step">Wait until <code>resolutionTime</code></div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">Creator → <code>DateMarket.resolve(outcome)</code></div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">Market marked as resolved</div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">Winners can claim</div>
              </div>
            </div>

            <div className="flow-section">
              <h3>4️⃣ Claiming Winnings</h3>
              <div className="flow-steps">
                <div className="flow-step">Winner → <code>DateMarket.claimWinnings()</code></div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">Calculate payout (pari-mutuel formula)</div>
                <div className="flow-arrow">↓</div>
                <div className="flow-step">Transfer USDC to winner</div>
              </div>
              <div className="formula-box">
                <strong>Payout Formula:</strong>
                <code>payout = (userBet / winningPool) × totalPool</code>
              </div>
            </div>
          </div>

          <div className="architecture-diagram">
            <h3>🏗️ Contract Architecture</h3>
            <pre className="ascii-diagram">{`
┌─────────────────────────────────────────┐
│          MarketFactory                  │
│  - Creates DateMarket instances         │
│  - Tracks all markets                   │
│  - Prevents duplicate pairs             │
└──────────────┬──────────────────────────┘
               │ creates
               ↓
┌─────────────────────────────────────────┐
│           DateMarket                    │
│  - Manages betting pools (YES/NO)       │
│  - Handles bet placement                │
│  - Resolves outcomes                    │
│  - Distributes winnings                 │
└──────────────┬──────────────────────────┘
               │ uses
               ↓
┌─────────────────────────────────────────┐
│           MockUSDC (ERC20)              │
│  - Test token (6 decimals)              │
│  - Public faucet function               │
│  - Standard ERC20 interface             │
└─────────────────────────────────────────┘
            `}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
