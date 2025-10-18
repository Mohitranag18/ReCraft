import { useState } from 'react';
import BlockchainExplorerLink from './BlockchainExplorerLink';

const ProductCard = ({ product, onPurchase, userWallet }) => {
  const [showDetails, setShowDetails] = useState(false);

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
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {product.price} {product.currency || 'ETH'}
              </p>
              <p className="text-xs text-gray-500">
                {product.views || 0} views
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-semibold hover:bg-gray-200 transition text-sm"
            >
              View Details
            </button>
            <button
              onClick={() => onPurchase(product)}
              disabled={!userWallet}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 text-sm"
            >
              {userWallet ? 'Buy Now' : 'Connect Wallet'}
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
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
                {product.price} {product.currency || 'ETH'}
              </p>
              <button
                onClick={() => {
                  onPurchase(product);
                  setShowDetails(false);
                }}
                disabled={!userWallet}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {userWallet ? 'Purchase Now' : 'Connect Wallet to Purchase'}
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

            {/* Blockchain Info */}
            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Blockchain Record</h3>
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
                  <BlockchainExplorerLink
                    transactionHash={product.transactionHash}
                    label="View on Blockchain Explorer"
                  />
                )}
              </div>
            </div>

            {/* Revenue Distribution Info */}
            <div className="mt-6 bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Revenue Distribution</h3>
              <div className="space-y-1 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>NGO/Artisan:</span>
                  <span className="font-semibold">70%</span>
                </div>
                <div className="flex justify-between">
                  <span>Source Institution:</span>
                  <span className="font-semibold">20%</span>
                </div>
                <div className="flex justify-between">
                  <span>Platform:</span>
                  <span className="font-semibold">10%</span>
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