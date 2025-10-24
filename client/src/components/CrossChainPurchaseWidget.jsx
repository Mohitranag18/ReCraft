/**
 * CrossChainPurchaseWidget - Bridge ETH and Execute Purchase
 * File: client/src/components/CrossChainPurchaseWidget.jsx
 * 
 * UPDATED: Using @avail-project/nexus-core@0.0.2-beta.7 pattern
 * - value as hex string at root level
 * - buildFunctionParams returns only functionParams (no value)
 * - No tokenApproval for native ETH
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useNexus } from '../providers/NexusProvider';
import { useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { SUPPORTED_CHAINS } from '@avail-project/nexus-core';

const CrossChainPurchaseWidget = ({ 
  product, 
  contractAddress, 
  contractABI,
  onPurchaseComplete,
  nexusReady 
}) => {
  const { nexusSdk } = useNexus();
  const { address } = useAccount();

  const [selectedChain, setSelectedChain] = useState(null);
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [simulation, setSimulation] = useState(null);
  const [error, setError] = useState(null);
  const [balances, setBalances] = useState([]);

  // Available chains for cross-chain payment
  const availableChains = [
    { id: SUPPORTED_CHAINS.OPTIMISM_SEPOLIA, name: 'Optimism Sepolia', icon: '🔴' },
    { id: SUPPORTED_CHAINS.ARBITRUM_SEPOLIA, name: 'Arbitrum Sepolia', icon: '🔵' },
    { id: SUPPORTED_CHAINS.BASE_SEPOLIA, name: 'Base Sepolia', icon: '🔷' },
  ];

  // Fetch balances
  const fetchBalances = useCallback(async () => {
    if (!nexusSdk || !nexusReady) return;

    try {
      const balance = await nexusSdk.getUnifiedBalances();
      setBalances(balance);
      console.log('Fetched balances:', balance);
    } catch (error) {
      console.error('Error fetching balances:', error);
    }
  }, [nexusSdk, nexusReady]);

  useEffect(() => {
    if (nexusReady) {
      fetchBalances();
    }
  }, [nexusReady, fetchBalances]);

  // Get ETH balance for selected chain
  const ethBalance = useMemo(() => {
    if (!balances.length) return '0';
    const ethToken = balances.find((token) => token.symbol === 'ETH');
    return ethToken?.balance || '0';
  }, [balances]);

  // Build execute parameters for purchase with ETH
  const buildPurchaseParams = useCallback(() => {
    if (!address || !product) return null;

    const priceInEth = product.price.toString();              // e.g. "0.004"
    const wei = parseEther(priceInEth);                       // bigint
    const valueHex = `0x${wei.toString(16)}`;                 // hex for RPC

    const executeParams = {
      contractAddress,
      contractAbi: contractABI,
      functionName: 'purchaseProductWithETH',
      buildFunctionParams: (_token, _amount, _chainId, _user) => ({
        functionParams: [product.blockchainId],
      }),
      value: valueHex,            // ok to set here (SDK will use callback value first)
      // DO NOT set tokenApproval for ETH; omit it entirely
    };

    console.log('Built execute params (updated pattern):', {
      contractAddress: executeParams.contractAddress,
      functionName: executeParams.functionName,
      value: executeParams.value,
      hasCallback: typeof executeParams.buildFunctionParams === 'function',
      keysPresent: Object.keys(executeParams),
    });

    return executeParams;
  }, [address, product, contractAddress, contractABI]);

  // Simulate bridge and execute
  const simulateCrossChainPurchase = useCallback(async () => {
    if (!nexusSdk || !selectedChain || !bridgeAmount) {
      return;
    }

    try {
      setError(null);
      setIsSimulating(true);
      setSimulation(null);

      const executeParams = buildPurchaseParams();
      if (!executeParams) {
        throw new Error('Failed to build purchase parameters');
      }

      // Validate amounts
      const bridgeAmountNum = parseFloat(bridgeAmount);
      const productPrice = parseFloat(product.price);
      
      if (bridgeAmountNum < productPrice) {
        throw new Error(`Bridge amount (${bridgeAmount} ETH) must be at least ${product.price} ETH`);
      }

      const params = {
        token: 'ETH',
        amount: bridgeAmount,
        fromChainId: selectedChain,
        toChainId: SUPPORTED_CHAINS.SEPOLIA,
        execute: executeParams,
      };

      console.log('🔍 Simulating with params:', params);

      const result = await nexusSdk.simulateBridgeAndExecute(params);
      console.log('✅ Simulation result:', result);

      setSimulation(result);

      if (!result.success) {
        setError(result.error || 'Simulation failed');
      } else if (result.executeSimulation?.error) {
        setError(`Execute simulation failed: ${result.executeSimulation.error}`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Simulation failed';
      setError(errorMessage);
      console.error('❌ Simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  }, [nexusSdk, selectedChain, bridgeAmount, buildPurchaseParams, product.price]);

  // Execute cross-chain purchase
  const executeCrossChainPurchase = useCallback(async () => {
    if (!nexusSdk || !selectedChain || !bridgeAmount) {
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);

      const executeParams = buildPurchaseParams();
      if (!executeParams) {
        throw new Error('Failed to build purchase parameters');
      }

      const params = {
        token: 'ETH',
        amount: bridgeAmount,
        fromChainId: selectedChain,
        toChainId: SUPPORTED_CHAINS.SEPOLIA,
        execute: executeParams,
        waitForReceipt: true,
        receiptTimeout: 300000,
      };

      console.log('🚀 Executing with params:', params);

      const result = await nexusSdk.bridgeAndExecute(params);
      console.log('✅ Bridge and execute completed:', result);

      if (result.success) {
        alert('🎉 Cross-chain purchase successful! Product purchased with bridged ETH.');
        if (onPurchaseComplete) {
          onPurchaseComplete(result);
        }
      } else {
        const errorMsg = result.error || 'Purchase failed';
        setError(errorMsg);
        alert('❌ Purchase failed: ' + errorMsg);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Purchase failed';
      setError(errorMessage);
      console.error('❌ Purchase error:', err);
      alert('❌ Purchase failed: ' + errorMessage);
    } finally {
      setIsExecuting(false);
    }
  }, [nexusSdk, selectedChain, bridgeAmount, buildPurchaseParams, onPurchaseComplete]);

  // Auto-simulate when parameters change
  useEffect(() => {
    if (bridgeAmount && parseFloat(bridgeAmount) > 0 && selectedChain) {
      const timer = setTimeout(() => {
        simulateCrossChainPurchase();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [bridgeAmount, selectedChain, simulateCrossChainPurchase]);

  // Auto-fill product price
  useEffect(() => {
    if (product && product.price) {
      setBridgeAmount(product.price.toString());
    }
  }, [product]);

  return (
    <div className="space-y-4">
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5 shadow-lg">
        <h4 className="font-bold text-white mb-3 text-lg">
          🌉 Cross-Chain Payment with ETH
        </h4>
        <p className="text-xs text-gray-400 mb-3">
          Pay with ETH from another chain. Your ETH will be bridged to Sepolia and automatically used to purchase this product.
        </p>

        {/* Chain Selection */}
        <div className="space-y-3 mb-4">
          <label className="text-sm font-semibold text-gray-400">
            1. Select Source Chain
          </label>
          <div className="grid grid-cols-1 gap-3">
            {availableChains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedChain(chain.id)}
                disabled={!nexusReady}
                className={`p-3 rounded-lg border transition-all duration-300 text-left ${
                  selectedChain === chain.id
                    ? 'border-green-500 bg-green-900/30 text-green-300'
                    : 'border-gray-700 bg-gray-900/50 text-gray-300 hover:bg-gray-700/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold flex items-center gap-2">
                    <span className="text-xl">{chain.icon}</span>
                    <span>{chain.name}</span>
                  </span>
                  {selectedChain === chain.id && (
                    <span className="text-green-400 text-xl">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        {selectedChain && (
          <div className="space-y-3 mb-4">
            <label className="text-sm font-semibold text-gray-400">
              2. Amount in ETH
              <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-1 rounded-full ml-2">
                Price: {product.price} ETH
              </span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                placeholder="Enter ETH amount"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                disabled={!nexusReady || isExecuting}
                className="w-full px-4 py-3 pr-16 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-800"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-500">
                ETH
              </div>
            </div>
            {ethBalance && parseFloat(ethBalance) > 0 && (
              <p className="text-xs text-gray-500">
                Available: {ethBalance} ETH
              </p>
            )}
            <button
              onClick={() => setBridgeAmount(product.price.toString())}
              className="text-xs text-green-400 hover:text-green-300"
            >
              Use exact product price
            </button>
          </div>
        )}

        {/* Simulation Loading */}
        {isSimulating && (
          <div className="bg-gray-700/50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
              <span className="text-sm text-gray-300">Simulating transaction...</span>
            </div>
          </div>
        )}

        {/* Simulation Results */}
        {simulation && !isSimulating && (
          <div className="space-y-2 mb-3">
            {simulation.error || simulation.executeSimulation?.error ? (
              <div className="bg-red-900/50 border border-red-500/30 rounded-lg p-3">
                <p className="text-sm text-red-300 font-semibold">⚠️ Simulation Failed</p>
                <p className="text-xs text-red-400 mt-1">
                  {simulation.executeSimulation?.error || simulation.error}
                </p>
              </div>
            ) : (
              <div className="bg-green-900/50 border border-green-500/30 rounded-lg p-3">
                <p className="text-sm text-green-300 font-semibold mb-2">✓ Ready to Purchase</p>
                <div className="space-y-1 text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span>Product Price:</span>
                    <span className="font-medium">{product.price} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bridge Fee:</span>
                    <span className="font-medium">
                      {simulation.totalEstimatedCost?.breakdown?.bridge || '0'} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Execute Gas:</span>
                    <span className="font-medium">
                      {simulation.totalEstimatedCost?.breakdown?.execute 
                        ? parseFloat(simulation.totalEstimatedCost.breakdown.execute).toFixed(6)
                        : '0'} ETH
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-1 mt-1 font-semibold">
                    <span>Total Cost:</span>
                    <span className="text-green-400">
                      {simulation.totalEstimatedCost?.total 
                        ? parseFloat(simulation.totalEstimatedCost.total).toFixed(6)
                        : bridgeAmount} ETH
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && !isSimulating && (
          <div className="bg-red-900/50 border border-red-500/30 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={executeCrossChainPurchase}
          disabled={
            !nexusReady ||
            !selectedChain ||
            !bridgeAmount ||
            parseFloat(bridgeAmount) <= 0 ||
            parseFloat(bridgeAmount) < product.price ||
            isExecuting ||
            isSimulating ||
            (simulation && (simulation.error || simulation.executeSimulation?.error))
          }
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExecuting ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processing...
            </span>
          ) : !nexusReady ? (
            'Initializing Nexus...'
          ) : !selectedChain ? (
            'Select Source Chain'
          ) : !bridgeAmount || parseFloat(bridgeAmount) <= 0 ? (
            'Enter Amount'
          ) : parseFloat(bridgeAmount) < product.price ? (
            `Min. ${product.price} ETH Required`
          ) : (
            '🌉 Bridge ETH & Purchase'
          )}
        </button>

        <p className="text-xs text-gray-500 mt-2 text-center">
          This will bridge your ETH to Sepolia and automatically purchase the product
        </p>
      </div>

      {/* Info Box */}
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-5">
        <p className="font-bold text-white mb-2">How it works:</p>
        <ol className="text-xs text-gray-400 mt-2 space-y-1 list-decimal list-inside">
          <li>Select source chain (where your ETH is)</li>
          <li>Enter amount (must be ≥ product price)</li>
          <li>Click "Bridge ETH & Purchase"</li>
          <li>Your ETH bridges to Sepolia automatically</li>
          <li>Product purchase executes with bridged ETH</li>
          <li>Done! Product is yours 🎉</li>
        </ol>
        <p className="text-xs text-red-400 mt-2">
          ⚠️ Make sure you have enough ETH for: product price + bridge fees + gas
        </p>
      </div>
    </div>
  );
};

export default CrossChainPurchaseWidget;
