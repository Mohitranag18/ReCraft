/**
 * NexusProvider for ReCraft - Manages Avail Nexus SDK
 * File: client/src/providers/NexusProvider.jsx
 */

import { NexusSDK } from '@avail-project/nexus-core';
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useMemo, 
  useCallback 
} from 'react';
import { useAccount } from 'wagmi';

const NexusContext = createContext(undefined);

export const NexusProvider = ({ children, isConnected }) => {
  const [nexusSdk, setNexusSdk] = useState(undefined);
  const [isInitialized, setIsInitialized] = useState(false);
  const [allowanceModal, setAllowanceModal] = useState(null);
  const [intentModal, setIntentModal] = useState(null);

  const { connector } = useAccount();

  // Initialize Nexus SDK
  const initializeSDK = useCallback(async () => {
    if (isConnected && !nexusSdk && connector) {
      try {
        console.log('🚀 Initializing Avail Nexus SDK...');

        // Get provider from wagmi connector
        const provider = await connector.getProvider();

        if (!provider) {
          throw new Error('No EIP-1193 provider available');
        }

        // IMPORTANT: Set network to 'testnet' for Sepolia support!
        const isTestnet = import.meta.env.VITE_NETWORK === 'sepolia' || 
                          import.meta.env.VITE_ENABLE_TESTNET === 'true';

        const sdk = new NexusSDK({
          network: isTestnet ? 'testnet' : 'mainnet', // ← KEY: testnet mode!
          debug: true, // Enable debug logging
        });

        // Initialize SDK with provider
        await sdk.initialize(provider);
        setNexusSdk(sdk);

        console.log('✅ Nexus SDK initialized');
        console.log('📍 Supported chains:', sdk.utils.getSupportedChains());
        setIsInitialized(true);

        // Set up allowance hook (for token approvals)
        sdk.setOnAllowanceHook(async (data) => {
          console.log('🔐 Allowance required:', data);
          setAllowanceModal(data);
        });

        // Set up intent hook (for bridge confirmations)
        sdk.setOnIntentHook((data) => {
          console.log('📋 Intent created:', data);
          setIntentModal(data);
        });

      } catch (error) {
        console.error('❌ Failed to initialize Nexus SDK:', error);
        setIsInitialized(false);
      }
    }
  }, [isConnected, nexusSdk, connector]);

  // Cleanup SDK
  const cleanupSDK = useCallback(() => {
    if (nexusSdk) {
      console.log('🧹 Cleaning up Nexus SDK');
      nexusSdk.deinit();
      setNexusSdk(undefined);
      setIsInitialized(false);
    }
  }, [nexusSdk]);

  // Effect: Initialize or cleanup based on connection
  useEffect(() => {
    if (!isConnected) {
      cleanupSDK();
    } else {
      initializeSDK();
    }

    return () => {
      cleanupSDK();
    };
  }, [isConnected, cleanupSDK, initializeSDK]);

  // Context value
  const contextValue = useMemo(
    () => ({
      nexusSdk,
      isInitialized,
      allowanceModal,
      setAllowanceModal,
      intentModal,
      setIntentModal,
      cleanupSDK,
    }),
    [nexusSdk, isInitialized, allowanceModal, intentModal, cleanupSDK]
  );

  return (
    <NexusContext.Provider value={contextValue}>
      {children}
    </NexusContext.Provider>
  );
};

// Hook to use Nexus SDK
export const useNexus = () => {
  const context = useContext(NexusContext);
  if (context === undefined) {
    throw new Error('useNexus must be used within a NexusProvider');
  }
  return context;
};