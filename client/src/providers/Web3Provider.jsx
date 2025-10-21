/**
 * Web3Provider for ReCraft with Wagmi + ConnectKit
 * File: client/src/providers/Web3Provider.jsx
 */

import { WagmiProvider, createConfig, http } from 'wagmi';
import { 
  mainnet, 
  sepolia,
  optimismSepolia,
  arbitrumSepolia,
  baseSepolia 
} from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { NexusProvider } from './NexusProvider';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';

// Create Wagmi config with Sepolia testnets
const config = createConfig(
  getDefaultConfig({
    // Chains we support (all Sepolia testnets + mainnet for future)
    chains: [
      sepolia,           // Ethereum Sepolia (our main chain)
      optimismSepolia,   // For cross-chain bridging
      arbitrumSepolia,   // For cross-chain bridging
      baseSepolia,       // For cross-chain bridging
      mainnet,           // For future mainnet deployment
    ],
    
    transports: {
      [sepolia.id]: http(),
      [optimismSepolia.id]: http(),
      [arbitrumSepolia.id]: http(),
      [baseSepolia.id]: http(),
      [mainnet.id]: http(),
    },

    // WalletConnect Project ID (get free at https://cloud.walletconnect.com/)
    walletConnectProjectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',

    // App Info
    appName: 'ReCraft',
    appDescription: 'Sustainable Upcycling Platform',
    appUrl: 'https://recraft.app', // Update with your URL
    appIcon: 'https://recraft.app/logo.png', // Update with your logo
  })
);

// Create React Query client
const queryClient = new QueryClient();

// Internal provider that wraps everything with Nexus
const InternalProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const { isConnected: accountConnected } = useAccount();

  useEffect(() => {
    setIsConnected(accountConnected);
  }, [accountConnected]);

  return (
    <ConnectKitProvider
      theme="auto"
      onConnect={() => setIsConnected(true)}
      onDisconnect={() => setIsConnected(false)}
    >
      <NexusProvider isConnected={isConnected}>
        {children}
      </NexusProvider>
    </ConnectKitProvider>
  );
};

// Main Web3Provider export
export const Web3Provider = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <InternalProvider>{children}</InternalProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};