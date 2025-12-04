import { PrivyProvider } from '@privy-io/react-auth';

export default function Providers({ children }) {
  return (
    <PrivyProvider
      appId="cmirwdt0y00zwl80c56vebnmo"
      clientId="client-WY6TPZvXVRedfRU4zXLVPrYSAsSPA3u5ydQSsLKWJzJHS"
      config={{
        // Customize the appearance
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
        },
        // Specify login methods
        loginMethods: ['email'],
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets'
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}

