import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = createConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http()
  }
});

const queryClient = new QueryClient();

export default function Providers({ children }) {
  return (
    <PrivyProvider
      appId="cmirwdt0y00zwl80c56vebnmo"
      clientId="client-WY6TPZvXVRedfRU4zXLVPrYSAsSPA3u5ydQSsLKWJzJHS"
      config={{
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
        loginMethods: ['email'],
        supportedChains: [baseSepolia],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

