import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { usePublicClient } from 'wagmi';
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
  }
];

export default function Markets() {
  const { authenticated } = usePrivy();
  const publicClient = usePublicClient();
  const [markets, setMarkets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (authenticated && publicClient) {
      loadMarkets();
    }
  }, [authenticated, publicClient]);

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
    const [title, friend1, friend2, resolutionTime, totalYesPool, totalNoPool, resolved] = await Promise.all([
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'title' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'friend1' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'friend2' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'resolutionTime' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'totalYesPool' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'totalNoPool' }),
      publicClient.readContract({ address: marketAddress, abi: DATE_MARKET_ABI, functionName: 'resolved' })
    ]);

    const totalPool = Number(totalYesPool) + Number(totalNoPool);
    const yesOdds = totalPool > 0 ? Math.round((Number(totalYesPool) / totalPool) * 100) : 50;

    return {
      address: marketAddress,
      title,
      friend1,
      friend2,
      resolutionTime: new Date(Number(resolutionTime) * 1000),
      totalYesPool: Number(totalYesPool) / 1e6, // USDC has 6 decimals
      totalNoPool: Number(totalNoPool) / 1e6,
      yesOdds,
      noOdds: 100 - yesOdds,
      resolved
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
            {markets.map((market) => (
              <div key={market.address} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{market.title}</h3>
                    <p className="text-sm text-gray-500">
                      Resolves: {market.resolutionTime.toLocaleDateString()}
                    </p>
                  </div>
                  {market.resolved && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      Resolved
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

                <div className="flex justify-end space-x-2">
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Bet YES
                  </button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                    Bet NO
                  </button>
                </div>
              </div>
            ))}
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
