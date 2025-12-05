import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePublicClient, useWalletClient } from 'wagmi';
import CreateMarket from '../components/CreateMarket';

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
  }
];

export default function Markets() {
  const { authenticated, user } = usePrivy();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [resolvingMarket, setResolvingMarket] = useState(null);

  useEffect(() => {
    if (authenticated && publicClient) {
      loadMarkets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, publicClient]);

  async function handleResolve(market, outcome) {
    if (!walletClient) {
      alert('Please connect your wallet');
      return;
    }

    try {
      setResolvingMarket(market.address);
      
      const hash = await walletClient.writeContract({
        address: market.address,
        abi: DATE_MARKET_ABI,
        functionName: 'resolve',
        args: [outcome]
      });

      alert(`Market resolved! Transaction: ${hash}`);
      await loadMarkets(); // Refresh markets
    } catch (error) {
      console.error('Error resolving market:', error);
      alert('Failed to resolve market: ' + error.message);
    } finally {
      setResolvingMarket(null);
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

      // Fetch each market's details
      const marketPromises = [];
      for (let i = 0; i < Number(count); i++) {
        marketPromises.push(loadMarketDetails(i));
      }

      const marketsData = await Promise.all(marketPromises);
      setMarkets(marketsData);
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

    // Get market details
    const [title, creator, friend1, friend2, resolutionTime, totalYesPool, totalNoPool, resolved, outcome] = await Promise.all([
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'title' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'creator' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'friend1' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'friend2' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'resolutionTime' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'totalYesPool' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'totalNoPool' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'resolved' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'outcome' }).catch(() => false)
    ]);

    const totalPool = Number(totalYesPool) + Number(totalNoPool);
    const yesOdds = totalPool > 0 ? Math.round((Number(totalYesPool) / totalPool) * 100) : 50;
    const resolutionDate = new Date(Number(resolutionTime) * 1000);
    const canResolve = Date.now() >= resolutionDate.getTime() && !resolved;

    return {
      address: marketAddress,
      title,
      creator,
      friend1,
      friend2,
      resolutionTime: resolutionDate,
      totalYesPool: Number(totalYesPool) / 1e6, // USDC has 6 decimals
      totalNoPool: Number(totalNoPool) / 1e6,
      yesOdds,
      noOdds: 100 - yesOdds,
      resolved,
      outcome,
      canResolve
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
          <h1 className="text-3xl font-bold">Dating Prediction Markets</h1>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Market
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading markets...</p>
          </div>
        ) : markets.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No markets yet!</p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
              Create the First Market
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {markets.map((market) => {
              const isCreator = user?.wallet?.address?.toLowerCase() === market.creator?.toLowerCase();
              const isPastResolution = Date.now() >= market.resolutionTime.getTime();
              
              return (
                <div key={market.address} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">{market.title}</h3>
                      <p className="text-sm text-gray-500">
                        Resolves: {market.resolutionTime.toLocaleDateString()} at {market.resolutionTime.toLocaleTimeString()}
                      </p>
                      {isCreator && (
                        <p className="text-xs text-blue-600 font-medium mt-1">
                          You created this market
                        </p>
                      )}
                    </div>
                    {market.resolved ? (
                      <div className="text-right">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                          Resolved
                        </span>
                        <p className="text-sm text-gray-600 mt-2">
                          Outcome: <span className="font-bold">{market.outcome ? 'YES' : 'NO'}</span>
                        </p>
                      </div>
                    ) : isPastResolution ? (
                      <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                        Awaiting Resolution
                      </span>
                    ) : (
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">YES Pool</p>
                      <p className="text-2xl font-bold text-green-600">{market.totalYesPool.toFixed(2)} USDC</p>
                      <p className="text-sm text-gray-500">{market.yesOdds}% odds</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-1">NO Pool</p>
                      <p className="text-2xl font-bold text-red-600">{market.totalNoPool.toFixed(2)} USDC</p>
                      <p className="text-sm text-gray-500">{market.noOdds}% odds</p>
                    </div>
                  </div>

                  {/* Resolution controls for creator */}
                  {isCreator && market.canResolve && !market.resolved && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-3">
                        ⏰ Time to resolve this market! Choose the outcome:
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(market, true)}
                          disabled={resolvingMarket === market.address}
                          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolvingMarket === market.address ? 'Resolving...' : 'Resolve YES ✓'}
                        </button>
                        <button
                          onClick={() => handleResolve(market, false)}
                          disabled={resolvingMarket === market.address}
                          className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {resolvingMarket === market.address ? 'Resolving...' : 'Resolve NO ✗'}
                        </button>
                      </div>
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
