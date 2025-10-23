/**
 * ProductCard Component with Cross-chain Purchase via Bridge Execute
 * File: client/src/components/ProductCard.jsx
 */

import { useState } from 'react';
import BlockchainExplorerLink from './BlockchainExplorerLink';
import CrossChainPurchaseWidget from './CrossChainPurchaseWidget'; //for bridge and execute feature
import AvailBridgeWidget from './AvailBridgeWidget';

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
    setShowPaymentOptions(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
        {/* Product Image Placeholder */}
        <div className="h-48 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
          <div className="text-white text-center">
            <svg
              className="w-20 h-20 mx-auto mb-2 opacity-80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <p className="text-sm font-semibold uppercase tracking-wide">
              {product.productType}
            </p>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
            {product.productName}
          </h3>
          
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {product.description}
            </p>
          )}

          {/* Traceability Info */}
          <div className="space-y-1 mb-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold">NGO:</span>
              <span className="truncate">{product.ngoId?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Source:</span>
              <span className="truncate">{product.institutionId?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Material:</span>
              <span className="capitalize">{product.donationId?.materialType}</span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-3">
            <p className="text-2xl font-bold text-blue-600">
              {product.price} ETH
            </p>
            <p className="text-sm text-gray-500">
              ≈ ${(product.price * 2000).toFixed(2)} USD
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {product.views || 0} views
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
            >
              Details
            </button>
            <button
              onClick={handlePurchaseClick}
              disabled={!userWallet}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 text-sm"
            >
              {userWallet ? 'Buy' : 'Connect'}
            </button>
          </div>

          {/* Sponsor Badges */}
          <div className="mt-3 flex gap-2 flex-wrap">
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              💳 PYUSD
            </span>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              🌉 Cross-chain
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              🔍 Blockscout
            </span>
          </div>
        </div>
      </div>

      {/* Payment Options Modal */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Choose Payment Method</h3>
              <button
                onClick={() => setShowPaymentOptions(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Select how you'd like to pay for <strong>{product.productName}</strong>
            </p>

            <div className="space-y-3">
              {/* ETH Payment */}
              <button
                onClick={() => {
                  onPurchaseETH(product);
                  setShowPaymentOptions(false);
                }}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-lg hover:from-purple-600 hover:to-blue-600 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-bold text-lg">Pay with ETH</p>
                    <p className="text-sm opacity-90">{product.price} ETH on Ethereum Sepolia</p>
                  </div>
                  <div className="text-3xl">⟠</div>
                </div>
              </button>

              {/* PYUSD Payment */}
              <button
                onClick={() => {
                  onPurchasePYUSD(product);
                  setShowPaymentOptions(false);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-lg hover:from-blue-600 hover:to-green-600 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-bold text-lg">Pay with PYUSD</p>
                    <p className="text-sm opacity-90">≈ ${(product.price * 2000).toFixed(2)} PYUSD</p>
                    <p className="text-xs opacity-75 mt-1">PayPal USD Stablecoin</p>
                  </div>
                  <div className="text-3xl">💵</div>
                </div>
              </button>

              {/* Cross-chain Purchase Widget for bridge and execute feature */}
              <div className="border-t pt-3">
                <p className="text-sm text-gray-600 mb-3 font-semibold">
                  🌉 Or pay with ETH from another chain:
                </p>
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

              {/* Avail Bridge Widget */}
              {/* <div className="border-t pt-3">
                <AvailBridgeWidget 
                  product={product}
                  onBridgeComplete={(result) => {
                    setShowPaymentOptions(false);
                    // After a successful bridge, automatically trigger the ETH purchase.
                    alert('Bridge successful! Now proceeding with the purchase on Sepolia...');
                    onPurchaseETH(product);
                  }}
                />
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal - Same as before */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {product.productName}
              </h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Product Image Placeholder */}
            <div className="h-64 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center mb-6">
              <div className="text-white text-center">
                <svg
                  className="w-32 h-32 mx-auto mb-3 opacity-80"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <p className="text-lg font-semibold uppercase tracking-wide">
                  {product.productType}
                </p>
              </div>
            </div>

            {/* Price and Purchase */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <p className="text-3xl font-bold text-blue-600 mb-2">
                {product.price} ETH
              </p>
              <p className="text-gray-600 mb-3">
                ≈ ${(product.price * 2000).toFixed(2)} USD or pay with PYUSD/Cross-chain
              </p>
              <button
                onClick={handlePurchaseClick}
                disabled={!userWallet}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {userWallet ? 'Choose Payment Method' : 'Connect Wallet to Purchase'}
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {/* Traceability */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Traceability & Transparency</h3>
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Source Institution</p>
                  <p className="text-gray-800">{product.institutionId?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">
                    {product.institutionId?.type}
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Crafted By</p>
                  <p className="text-gray-800">{product.ngoId?.name}</p>
                  {product.artisanName && (
                    <p className="text-sm text-gray-600">Artisan: {product.artisanName}</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Original Material</p>
                  <p className="text-gray-800 capitalize">
                    {product.donationId?.materialType}
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: {product.donationId?.quantity} units
                  </p>
                </div>
              </div>
            </div>

            {/* Blockchain Info with Blockscout */}
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <span>🔗 Blockchain Record</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  Verified on Blockscout
                </span>
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Product ID:</span>
                  <span className="ml-2 text-gray-600">#{product.blockchainId}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Donation ID:</span>
                  <span className="ml-2 text-gray-600">#{product.donationBlockchainId}</span>
                </div>
                {product.transactionHash && (
                  <div className="mt-2">
                    <BlockchainExplorerLink
                      transactionHash={product.transactionHash}
                      label="View on Blockscout Explorer"
                      network={import.meta.env.VITE_NETWORK || 'localhost'}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Payment Methods Supported */}
            <div className="bg-green-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">💳 Supported Payment Methods</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    ⟠
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Ethereum (ETH)</p>
                    <p className="text-xs text-gray-600">Native blockchain currency on Sepolia</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    💵
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">PayPal USD (PYUSD)</p>
                    <p className="text-xs text-gray-600">Stablecoin by PayPal • 1 PYUSD = $1 USD</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    🌉
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Cross-chain via Avail Nexus</p>
                    <p className="text-xs text-gray-600">
                      Bridge & Pay from Optimism, Arbitrum, or Base Sepolia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Distribution Info */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">💰 Revenue Distribution</h3>
              <p className="text-xs text-gray-600 mb-3">
                Automatically distributed via smart contract
              </p>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>NGO/Artisan:</span>
                  <span className="font-semibold text-green-600">70% ({(product.price * 0.7).toFixed(4)} ETH)</span>
                </div>
                <div className="flex justify-between">
                  <span>Source Institution:</span>
                  <span className="font-semibold text-blue-600">20% ({(product.price * 0.2).toFixed(4)} ETH)</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="font-semibold text-gray-600">10% ({(product.price * 0.1).toFixed(4)} ETH)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductCard;
