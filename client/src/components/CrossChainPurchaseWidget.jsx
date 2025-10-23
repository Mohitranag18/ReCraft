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
      <div className="bg-gradient-to-r from-orange-50 to-purple-50 rounded-lg p-4 border border-orange-200">
        <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
          🌉 Cross-Chain Payment with ETH
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
            Bridge & Pay
          </span>
        </h4>
        <p className="text-xs text-gray-600 mb-3">
          Pay with ETH from another chain. Your ETH will be bridged to Sepolia and automatically used to purchase this product.
        </p>

        {/* Chain Selection */}
        <div className="space-y-2 mb-3">
          <label className="text-sm font-semibold text-gray-700">Select Source Chain</label>
          <div className="grid grid-cols-1 gap-2">
            {availableChains.map((chain) => (
              <button
                key={chain.id}
                onClick={() => setSelectedChain(chain.id)}
                disabled={!nexusReady}
                className={`p-3 rounded-lg border-2 transition text-left ${
                  selectedChain === chain.id
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 flex items-center gap-2">
                    <span className="text-xl">{chain.icon}</span>
                    {chain.name}
                  </span>
                  {selectedChain === chain.id && (
                    <span className="text-orange-500">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        {selectedChain && (
          <div className="space-y-2 mb-3">
            <label className="text-sm font-semibold text-gray-700">
              Amount in ETH (Product Price: {product.price} ETH)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                placeholder="Enter ETH amount"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                disabled={!nexusReady || isExecuting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                ETH
              </div>
            </div>
            {ethBalance && parseFloat(ethBalance) > 0 && (
              <p className="text-xs text-gray-600">
                Available: {ethBalance} ETH
              </p>
            )}
            <button
              onClick={() => setBridgeAmount(product.price.toString())}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Use exact product price
            </button>
          </div>
        )}

        {/* Simulation Loading */}
        {isSimulating && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-700">Simulating transaction...</span>
            </div>
          </div>
        )}

        {/* Simulation Results */}
        {simulation && !isSimulating && (
          <div className="space-y-2 mb-3">
            {simulation.error || simulation.executeSimulation?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-semibold">⚠️ Simulation Failed</p>
                <p className="text-xs text-red-600 mt-1">
                  {simulation.executeSimulation?.error || simulation.error}
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  💡 Tip: If issues persist, try using the direct "Pay with ETH" button instead.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 font-semibold mb-2">✓ Ready to Purchase</p>
                <div className="space-y-1 text-xs text-gray-700">
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
                  <div className="flex justify-between border-t pt-1 mt-1 font-semibold">
                    <span>Total Cost:</span>
                    <span className="text-green-600">
                      {simulation.totalEstimatedCost?.total 
                        ? parseFloat(simulation.totalEstimatedCost.total).toFixed(6)
                        : bridgeAmount} ETH
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 mt-2">
                  💡 You need enough ETH to cover: product price + bridge fee + gas
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && !isSimulating && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="text-sm text-red-700">{error}</p>
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
          className="w-full bg-gradient-to-r from-orange-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-gray-700">
          <strong>How it works:</strong>
        </p>
        <ol className="text-xs text-gray-600 mt-2 space-y-1 list-decimal list-inside">
          <li>Select source chain (where your ETH is)</li>
          <li>Enter amount (must be ≥ product price)</li>
          <li>Click "Bridge ETH & Purchase"</li>
          <li>Your ETH bridges to Sepolia automatically</li>
          <li>Product purchase executes with bridged ETH</li>
          <li>Done! Product is yours 🎉</li>
        </ol>
        <p className="text-xs text-orange-600 mt-2">
          ⚠️ Make sure you have enough ETH for: product price + bridge fees + gas
        </p>
        <p className="text-xs text-blue-600 mt-2">
          💡 Updated to use @avail-project/nexus-core@0.0.2-beta.7 pattern
        </p>
      </div>
    </div>
  );
};

export default CrossChainPurchaseWidget;