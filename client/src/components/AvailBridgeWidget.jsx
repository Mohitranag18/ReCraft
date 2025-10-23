/**
 * Avail Bridge Widget for ReCraft
 * Allows users to bridge ETH from any Sepolia testnet
 * File: client/src/components/AvailBridgeWidget.jsx
 */

import { useState, useEffect, useCallback } from 'react';
import { useNexus } from '../providers/NexusProvider';

const SEPOLIA_CHAINS = {
  11155111: 'Ethereum Sepolia',
  11155420: 'Optimism Sepolia',
  421614: 'Arbitrum Sepolia',
  84532: 'Base Sepolia'
};

const AvailBridgeWidget = ({ product, onBridgeComplete }) => {
  const { nexusSdk, isInitialized, allowanceModal, intentModal, setAllowanceModal, setIntentModal } = useNexus();
  
  const [showModal, setShowModal] = useState(false);
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [sourceChain, setSourceChain] = useState(11155420); // Default: Optimism Sepolia
  const [isBridging, setIsBridging] = useState(false);
  const [balances, setBalances] = useState([]);
  const [simulation, setSimulation] = useState(null);
  const [error, setError] = useState(null);

  // Calculate ETH amount needed (convert from product price)
  const ethAmount = product?.price || 0.005;

  // Fetch available balances
  useEffect(() => {
    if (nexusSdk && isInitialized && showModal) {
      fetchBalances();
    }
  }, [nexusSdk, isInitialized, showModal]);

  const fetchBalances = async () => {
    try {
      const unifiedBalances = await nexusSdk.getUnifiedBalances();
      console.log('💰 Available balances:', unifiedBalances);
      setBalances(unifiedBalances);
    } catch (err) {
      console.error('Failed to fetch balances:', err);
    }
  };

  // Simulate bridge
  useEffect(() => {
    if (nexusSdk && bridgeAmount && parseFloat(bridgeAmount) > 0) {
      simulateBridge();
    }
  }, [nexusSdk, bridgeAmount, sourceChain]);

  const simulateBridge = async () => {
    try {
      const result = await nexusSdk.simulateBridge({
        chainId: 11155111, // Destination: Ethereum Sepolia
        token: 'ETH',
        amount: bridgeAmount
      });
      
      console.log('📊 Simulation:', result);
      setSimulation(result);
    } catch (err) {
      console.error('Simulation failed:', err);
      setSimulation(null);
    }
  };

  // Execute bridge
  const executeBridge = async () => {
    if (!nexusSdk || !bridgeAmount) return;

    try {
      setIsBridging(true);
      setError(null);

      console.log('🌉 Bridging ETH:', {
        from: SEPOLIA_CHAINS[sourceChain],
        to: 'Ethereum Sepolia',
        amount: bridgeAmount
      });

      const result = await nexusSdk.bridge({
        chainId: 11155111, // Destination: Ethereum Sepolia (where ReCraft contract is)
        token: 'ETH',
        amount: bridgeAmount
      });

      if (result.success) {
        alert('✅ Bridge successful! You can now purchase the product.');
        console.log('Bridge result:', result);
        setShowModal(false);
        if (onBridgeComplete) {
          onBridgeComplete(result);
        }
      } else {
        setError(result.error || 'Bridge failed');
      }
    } catch (err) {
      console.error('❌ Bridge failed:', err);
      setError(err.message || 'Failed to bridge tokens');
    } finally {
      setIsBridging(false);
    }
  };

  // Handle allowance modal
  const handleAllowance = (approve) => {
    if (allowanceModal) {
      if (approve) {
        allowanceModal.allow(['max']); // Approve maximum
      } else {
        allowanceModal.deny();
      }
      setAllowanceModal(null);
    }
  };

  // Handle intent modal
  const handleIntent = (approve) => {
    if (intentModal) {
      if (approve) {
        intentModal.allow();
      } else {
        intentModal.deny();
      }
      setIntentModal(null);
    }
  };

  if (!isInitialized) {
    return (
      <button
        disabled
        className="w-full bg-gray-400 text-white p-4 rounded-lg cursor-not-allowed"
      >
        <div className="text-left">
          <p className="font-bold text-lg">Initializing Bridge...</p>
          <p className="text-sm opacity-90">Please wait</p>
        </div>
      </button>
    );
  }

  return (
    <>
      {/* Bridge Button */}
      <button
        onClick={() => {
          setShowModal(true);
          setBridgeAmount(ethAmount.toString());
        }}
        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white p-4 rounded-lg hover:from-orange-600 hover:to-pink-600 transition"
      >
        <div className="flex items-center justify-between">
          <div className="text-left">
            <p className="font-bold text-lg">Bridge & Buy (Avail Nexus)</p>
            <p className="text-sm opacity-90">Cross-chain payment from any Sepolia</p>
            <p className="text-xs opacity-75 mt-1">
              Need {ethAmount} ETH on Ethereum Sepolia
            </p>
          </div>
          <div className="text-3xl">🌉</div>
        </div>
      </button>

      {/* Bridge Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Bridge ETH to Sepolia</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Product Info + Gas Fee Reminder */}
            <div className="mb-4 bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Product:</strong> {product?.productName}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Price:</strong> {ethAmount} ETH
              </p>

              <div className="mt-3 bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs p-3 rounded-md font-medium">
                ⚠️ <strong>Note:</strong> The product value shown above doesn’t include gas fees.
                We recommend adding a small extra amount (~0.001–0.002 ETH) to cover 
                transaction costs if your balance on Ethereum Sepolia is currently 0.
              </div>
            </div>


            {/* Source Chain Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bridge FROM (Source Chain)
              </label>
              <select
                value={sourceChain}
                onChange={(e) => setSourceChain(Number(e.target.value))}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {Object.entries(SEPOLIA_CHAINS).map(([chainId, name]) => (
                  <option key={chainId} value={chainId}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (ETH)
              </label>
              <input
                type="number"
                step="0.0001"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
                placeholder="0.0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Destination: Ethereum Sepolia (11155111)
              </p>
            </div>

            {/* Available Balances */}
            {balances.length > 0 && (
              <div className="mb-4 bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-semibold mb-2">Your Balances:</p>
                {balances.map((balance, idx) => (
                  <p key={idx} className="text-xs text-gray-600">
                    {balance.symbol}: {balance.balance} on Chain {balance.chainId}
                  </p>
                ))}
              </div>
            )}

            {/* Simulation */}
            {simulation && (
              <div className="mb-4 bg-purple-50 p-3 rounded-lg">
                <p className="text-sm font-semibold mb-2">📊 Bridge Estimate:</p>
                <p className="text-xs text-gray-600">
                  Estimated time: ~5-10 minutes
                </p>
                <p className="text-xs text-gray-600">
                  Gas fees: ~$0.50-1.00
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 p-3 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Bridge Button */}
            <button
              onClick={executeBridge}
              disabled={isBridging || !bridgeAmount || parseFloat(bridgeAmount) <= 0}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {isBridging ? 'Bridging...' : `Bridge ${bridgeAmount || '0'} ETH`}
            </button>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Powered by Avail Nexus SDK
            </p>
          </div>
        </div>
      )}

      {/* Allowance Modal */}
      {allowanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Token Approval Required</h3>
            <p className="text-gray-600 mb-4">
              This transaction requires token approval to proceed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleAllowance(true)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleAllowance(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Intent Modal */}
      {intentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Confirm Bridge</h3>
            <p className="text-gray-600 mb-4">
              Please confirm the bridge transaction details.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleIntent(true)}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Confirm
              </button>
              <button
                onClick={() => handleIntent(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AvailBridgeWidget;