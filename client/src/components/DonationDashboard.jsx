import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const DonationDashboard = () => {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';


  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${VITE_API_URL}/api/donations/${id}`);
        setDonation(response.data.donation);
        setProduct(response.data.product);
      } catch (err) {
        console.error('Error fetching donation data:', err);
        setError('Failed to load donation data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDonationData();
    }
  }, [id]);

  const getEtherscanLink = (hashOrAddress, isAddress = false) => {
    const network = import.meta.env.VITE_NETWORK || 'sepolia';
    const type = isAddress ? 'address' : 'tx';
    return `https://${network}.etherscan.io/${type}/${hashOrAddress}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const date = new Date(dateValue.$date ? dateValue.$date.$numberLong : dateValue);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWalletAddress = (address) => {
    if (!address) return 'N/A';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Sold': 'bg-green-500',
      'Pending': 'bg-yellow-500',
      'Available': 'bg-blue-500',
      'Accepted': 'bg-purple-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getCurrency = (paymentMethod) => {
    return paymentMethod === 'PYUSD' ? 'PYUSD' : 'ETH';
  };

  const InfoRow = ({ label, value, link, isAddress, fullWidth = false }) => (
    <div className={`${fullWidth ? 'col-span-2' : ''}`}>
      <dt className="text-sm font-medium text-gray-400 mb-1">{label}</dt>
      <dd className="text-base text-white">
        {link ? (
          <a
            href={getEtherscanLink(link, isAddress)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 transition-colors font-mono break-all inline-flex items-center gap-2"
          >
            {value}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-300">Loading donation details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-6 max-w-md">
          <p className="text-lg font-semibold mb-2 text-red-400">Error</p>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md text-center">
          <p className="text-lg text-gray-300">Donation not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-400 mb-2">Donation Explorer</h1>
          <p className="text-gray-400">Track your donation journey from source to product</p>
        </div>

        {/* Journey Timeline */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Transaction Journey</h2>
          <div className="relative">
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-gray-700"></div>
            <div 
              className="absolute top-8 left-0 h-0.5 bg-green-500 transition-all duration-500"
              style={{ 
                width: product?.sold ? '100%' : product ? '66%' : donation.acceptedAt ? '33%' : '0%' 
              }}
            ></div>
            
            <div className="relative grid grid-cols-4 gap-4">
              {/* Donated */}
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 relative z-10">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-white mb-1">Donated</p>
                <p className="text-xs text-gray-400">{formatDate(donation.createdAt)}</p>
              </div>

              {/* Accepted */}
              <div className="text-center">
                <div className={`w-16 h-16 ${donation.acceptedAt ? 'bg-green-500' : 'bg-gray-700'} rounded-full flex items-center justify-center mx-auto mb-3 relative z-10 transition-colors`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold mb-1 ${donation.acceptedAt ? 'text-white' : 'text-gray-500'}`}>Accepted</p>
                <p className="text-xs text-gray-400">{donation.acceptedAt ? formatDate(donation.acceptedAt) : 'Pending'}</p>
              </div>

              {/* Crafted */}
              <div className="text-center">
                <div className={`w-16 h-16 ${product ? 'bg-green-500' : 'bg-gray-700'} rounded-full flex items-center justify-center mx-auto mb-3 relative z-10 transition-colors`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold mb-1 ${product ? 'text-white' : 'text-gray-500'}`}>Crafted</p>
                <p className="text-xs text-gray-400">{product ? formatDate(product.createdAt) : 'Not yet'}</p>
              </div>

              {/* Sold */}
              <div className="text-center">
                <div className={`w-16 h-16 ${product?.sold ? 'bg-green-500' : 'bg-gray-700'} rounded-full flex items-center justify-center mx-auto mb-3 relative z-10 transition-colors`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className={`text-sm font-semibold mb-1 ${product?.sold ? 'text-white' : 'text-gray-500'}`}>Sold</p>
                <p className="text-xs text-gray-400">{product?.sold ? formatDate(product.soldAt) : 'Not yet'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Information */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 mb-8 overflow-hidden">
          <div className="bg-gray-750 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Donation Information</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(donation.status)} text-white`}>
              {donation.status}
            </span>
          </div>
          
          <div className="p-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoRow label="Blockchain ID" value={`#${donation.blockchainId?.$numberInt || donation.blockchainId}`} />
              <InfoRow label="Material Type" value={donation.materialType} />
              <InfoRow 
                label="Quantity" 
                value={`${donation.quantity?.$numberInt || donation.quantity} ${donation.unit}`} 
              />
              <InfoRow label="Created At" value={formatDate(donation.createdAt)} />
              {donation.acceptedAt && (
                <InfoRow label="Accepted At" value={formatDate(donation.acceptedAt)} />
              )}
              <InfoRow label="Description" value={donation.description} fullWidth={true} />
            </dl>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Blockchain Details</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow 
                  label="Transaction Hash" 
                  value={donation.transactionHash ? `${donation.transactionHash.substring(0, 10)}...${donation.transactionHash.substring(donation.transactionHash.length - 8)}` : 'N/A'}
                  link={donation.transactionHash}
                />
                {donation.blockNumber && (
                  <InfoRow 
                    label="Block Number" 
                    value={`#${donation.blockNumber?.$numberInt || donation.blockNumber}`} 
                  />
                )}
              </dl>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Wallet Addresses</h3>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoRow 
                  label="Institution Wallet" 
                  value={formatWalletAddress(donation.institutionWallet)}
                  link={donation.institutionWallet}
                  isAddress={true}
                />
                {donation.ngoWallet && (
                  <InfoRow 
                    label="NGO Wallet" 
                    value={formatWalletAddress(donation.ngoWallet)}
                    link={donation.ngoWallet}
                    isAddress={true}
                  />
                )}
              </dl>
            </div>
          </div>
        </div>

        {/* Product Information */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gray-750 border-b border-gray-700 px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Product Information</h2>
            {product && (
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${product.sold ? 'bg-green-500' : 'bg-blue-500'} text-white`}>
                {product.sold ? 'Sold' : 'Available'}
              </span>
            )}
          </div>
          
          <div className="p-6">
            {product ? (
              <>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InfoRow label="Blockchain ID" value={`#${product.blockchainId?.$numberInt || product.blockchainId}`} />
                  <InfoRow 
                    label="Linked Donation ID" 
                    value={`#${product.donationBlockchainId?.$numberInt || product.donationBlockchainId}`} 
                  />
                  <InfoRow label="Product Name" value={product.productName} />
                  <InfoRow label="Product Type" value={product.productType} />
                  <InfoRow label="Artisan Name" value={product.artisanName || 'N/A'} />
                  <InfoRow label="Description" value={product.description} fullWidth={true} />
                </dl>

                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Price in ETH</p>
                      <p className="text-xl font-bold text-white">{product.priceETH?.$numberDouble || product.priceETH} ETH</p>
                    </div>
                    <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                      <p className="text-sm text-gray-400 mb-1">Price in PYUSD</p>
                      <p className="text-xl font-bold text-white">{product.pricePYUSD?.$numberInt || product.pricePYUSD} PYUSD</p>
                    </div>
                  </div>
                </div>

                {product.sold && (
                  <>
                    <div className="mt-8 pt-6 border-t border-gray-700">
                      <h3 className="text-lg font-semibold text-white mb-4">Sale Details</h3>
                      <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoRow label="Sold At" value={formatDate(product.soldAt)} />
                        <InfoRow 
                          label="Payment Method" 
                          value={
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-900/30 text-green-400 border border-green-700">
                              {product.paymentMethod || 'ETH'}
                            </span>
                          } 
                        />
                        <InfoRow 
                          label="Buyer Wallet" 
                          value={formatWalletAddress(product.buyerWallet)}
                          link={product.buyerWallet}
                          isAddress={true}
                        />
                      </dl>
                    </div>

                    {product.revenue && (
                      <div className="mt-8 pt-6 border-t border-gray-700">
                        <h3 className="text-lg font-semibold text-white mb-4">Revenue Distribution</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">NGO (70%)</p>
                            <p className="text-lg font-bold text-green-400">
                              {product.revenue.ngoShare?.$numberInt || product.revenue.ngoShare} {getCurrency(product.paymentMethod)}
                            </p>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Institution (20%)</p>
                            <p className="text-lg font-bold text-blue-400">
                              {product.revenue.institutionShare?.$numberInt || product.revenue.institutionShare} {getCurrency(product.paymentMethod)}
                            </p>
                          </div>
                          <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                            <p className="text-xs text-gray-400 mb-1">Platform (10%)</p>
                            <p className="text-lg font-bold text-purple-400">
                              {product.revenue.platformShare?.$numberInt || product.revenue.platformShare} {getCurrency(product.paymentMethod)}
                            </p>
                          </div>
                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                            <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
                            <p className="text-lg font-bold text-white">
                              {product.revenue.total?.$numberInt || product.revenue.total} {getCurrency(product.paymentMethod)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Blockchain Details</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow 
                      label="Transaction Hash" 
                      value={product.transactionHash ? `${product.transactionHash.substring(0, 10)}...${product.transactionHash.substring(product.transactionHash.length - 8)}` : 'N/A'}
                      link={product.transactionHash}
                    />
                    {product.blockNumber && (
                      <InfoRow 
                        label="Block Number" 
                        value={`#${product.blockNumber?.$numberInt || product.blockNumber}`} 
                      />
                    )}
                  </dl>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Wallet Addresses</h3>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoRow 
                      label="NGO Wallet" 
                      value={formatWalletAddress(product.ngoWallet)}
                      link={product.ngoWallet}
                      isAddress={true}
                    />
                    {product.artisanWallet && (
                      <InfoRow 
                        label="Artisan Wallet" 
                        value={formatWalletAddress(product.artisanWallet)}
                        link={product.artisanWallet}
                        isAddress={true}
                      />
                    )}
                    <InfoRow 
                      label="Institution Wallet" 
                      value={formatWalletAddress(product.institutionWallet)}
                      link={product.institutionWallet}
                      isAddress={true}
                    />
                  </dl>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-700/30 rounded-lg flex items-center justify-center mx-auto mb-4 border border-gray-600">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-xl text-gray-400 mb-2">No Product Yet</p>
                <p className="text-sm text-gray-500">This donation hasn't been crafted into a product yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDashboard;