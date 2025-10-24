/**
 * ProductCard Component with Cross-chain Purchase via Bridge Execute
 * File: client/src/components/ProductCard.jsx
 */

import { useState } from 'react';
import BlockchainExplorerLink from './BlockchainExplorerLink';
import CrossChainPurchaseWidget from './CrossChainPurchaseWidget'; //for bridge and execute feature
import AvailBridgeWidget from './AvailBridgeWidget';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';

const ProductCard = ({ 
  product, 
  onPurchaseETH, 
  onPurchasePYUSD, 
  onCrossChainPurchase,
  contractAddress,
  contractABI,
  userWallet,
  isWalletConnected,
  nexusReady
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);

  const handlePurchaseClick = () => {
    if (!userWallet) {
      alert('Please connect your wallet first!');
      return;
    }
    setShowDetails(false);
    setShowPaymentOptions(true);
  };
  console.log("Rendering ProductCard for:", product);

  return (
    <>
      <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl overflow-hidden transition-all duration-300 hover:border-green-500/50 hover:shadow-2xl hover:shadow-green-500/10">
        {/* Product Image Placeholder */}
        <div className="h-48 bg-gray-700 flex items-center justify-center">
          <svg className="w-20 h-20 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-2 truncate">{product.productName}</h3>
          
          <div className="mb-4">
            <p className="text-2xl font-extrabold text-green-400">{product.priceETH} ETH</p>
            <p className="text-xs text-gray-400">≈ ${product.pricePYUSD.toFixed(2)} PYUSD</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-semibold text-sm transition-colors"
            >
              Details
            </button>
            <button
              onClick={handlePurchaseClick}
              disabled={!userWallet}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
            >
              {userWallet ? 'Buy Now' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* Payment Options Modal */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-white">Choose Payment Method</h3>
              <button onClick={() => setShowPaymentOptions(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <p className="text-gray-400 mb-6">Select how you'd like to pay for <strong>{product.productName}</strong></p>
            <div className="space-y-3">
              <button
                onClick={() => { onPurchaseETH(product); setShowPaymentOptions(false); }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors"
              >
                <p className="font-bold">Pay with ETH</p>
                <p className="text-sm text-gray-400">{product.priceETH} ETH on Ethereum Sepolia</p>
              </button>
              <button
                onClick={() => { onPurchasePYUSD(product); setShowPaymentOptions(false); }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white p-4 rounded-lg transition-colors"
              >
                <p className="font-bold">Pay with PYUSD</p>
                <p className="text-sm text-gray-400">≈ ${product.pricePYUSD.toFixed(2)} PYUSD</p>
              </button>
              <div className="border-t border-gray-700 pt-4">
                <CrossChainPurchaseWidget 
                  product={product}
                  contractAddress={contractAddress}
                  contractABI={contractABI}
                  onPurchaseComplete={(result) => {
                    setShowPaymentOptions(false);
                    if (onCrossChainPurchase) {
                      onCrossChainPurchase(product, result);
                    }
                  }}
                  nexusReady={nexusReady}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-white">{product.productName}</h2>
              <button onClick={() => setShowDetails(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>
            <div className="h-56 bg-gray-700 rounded-lg flex items-center justify-center mb-6">
              <svg className="w-24 h-24 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 mb-6">
              <p className="text-3xl font-bold text-green-400 mb-2">{product.priceETH} ETH</p>
              <p className="text-gray-400 mb-3">≈ ${product.pricePYUSD.toFixed(2)} PYUSD</p>
              <button
                onClick={handlePurchaseClick}
                disabled={!userWallet}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
              >
                {userWallet ? 'Choose Payment Method' : 'Connect Wallet to Purchase'}
              </button>
            </div>
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-white mb-2">Description</h3>
                <p className="text-gray-400">{product.description}</p>
              </div>
            )}
            <div className="mb-6">
              <h3 className="font-semibold text-white mb-3">Traceability</h3>
              <div className="space-y-3">
                <div className="bg-gray-900/50 rounded-lg p-3"><p className="text-sm font-semibold text-gray-300">Source:</p><p className="text-gray-400">{product.institutionId?.name}</p></div>
                <div className="bg-gray-900/50 rounded-lg p-3"><p className="text-sm font-semibold text-gray-300">Crafted By:</p><p className="text-gray-400">{product.ngoId?.name}</p></div>
                <div className="bg-gray-900/50 rounded-lg p-3"><p className="text-sm font-semibold text-gray-300">Material:</p><p className="text-gray-400 capitalize">{product.donationId?.materialType}</p></div>
              </div>
            </div>
            <div className="space-y-2 text-sm">
            <div>
              <span className="font-semibold text-gray-300">Product ID:</span>
              <span className="ml-2 text-gray-400">#{product.blockchainId}</span>
            </div>
            <div>
              <span className="font-semibold text-gray-300">Donation ID:</span>
              <span className="ml-2 text-gray-400">#{product.donationBlockchainId}</span>
            </div>
            {product.donationId && (
              <div className="mt-2">
                <Link 
                to={`http://localhost:5173/dashboard/${product.donationId._id}`} 
                className="text-green-400 hover:underline">
                  View Donation Details →
                </Link>
              </div>
            )}
          </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
