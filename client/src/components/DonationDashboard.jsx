import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const DonationDashboard = () => {
  const { id } = useParams();
  const [donation, setDonation] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonationData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/donations/${id}`);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-lg">Loading donation details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-400">
        <p className="text-lg">{error}</p>
      </div>
    );
  }

  if (!donation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-300">
        <p className="text-lg">Donation not found.</p>
      </div>
    );
  }

  const getEtherscanLink = (hashOrAddress, isAddress = false) => {
    const network = import.meta.env.VITE_NETWORK || 'sepolia'; // Assuming VITE_NETWORK is set in .env
    const type = isAddress ? 'address' : 'tx';
    return `https://${network}.etherscan.io/${type}/${hashOrAddress}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6 md:p-8">
        <h1 className="text-4xl font-bold text-green-400 mb-8 text-center">Donation Dashboard</h1>

        {/* Donation Info Section */}
        <section className="mb-10">
          <h2 className="text-3xl font-semibold text-white mb-6 border-b border-gray-700 pb-3">Donation Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
            <p><strong>Donation ID:</strong> {donation._id}</p>
            <p><strong>Blockchain ID:</strong> {donation.blockchainId}</p>
            <p><strong>Material Type:</strong> {donation.materialType}</p>
            <p><strong>Quantity:</strong> {donation.quantity} {donation.unit}</p>
            <p><strong>Description:</strong> {donation.description}</p>
            <p><strong>Status:</strong> <span className={`font-bold ${donation.status === 'Sold' ? 'text-green-500' : 'text-yellow-500'}`}>{donation.status}</span></p>
            <p>
              <strong>Institution Wallet:</strong>{' '}
              <a
                href={getEtherscanLink(donation.institutionWallet, true)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {donation.institutionWallet}
              </a>
            </p>
            <p>
              <strong>NGO Wallet:</strong>{' '}
              <a
                href={getEtherscanLink(donation.ngoWallet, true)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                {donation.ngoWallet}
              </a>
            </p>
            <p><strong>Created At:</strong> {new Date(donation.createdAt.$date ? donation.createdAt.$date.$numberLong : donation.createdAt).toLocaleString()}</p>
            {donation.acceptedAt && (
              <p><strong>Accepted At:</strong> {new Date(donation.acceptedAt.$date ? donation.acceptedAt.$date.$numberLong : donation.acceptedAt).toLocaleString()}</p>
            )}
            {donation.transactionHash && (
              <p>
                <strong>Transaction Hash:</strong>{' '}
                <a
                  href={getEtherscanLink(donation.transactionHash)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {donation.transactionHash.substring(0, 10)}...{donation.transactionHash.substring(donation.transactionHash.length - 8)}
                </a>
              </p>
            )}
          </div>
        </section>

        {/* Product Info Section */}
        <section>
          <h2 className="text-3xl font-semibold text-white mb-6 border-b border-gray-700 pb-3">Product Information</h2>
          {product ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-lg">
              <p><strong>Product Name:</strong> {product.productName}</p>
              <p><strong>Product Type:</strong> {product.productType}</p>
              <p><strong>Description:</strong> {product.description}</p>
              <p><strong>Price:</strong> {product.price} {product.currency}</p>
              <p><strong>Artisan Name:</strong> {product.artisanName}</p>
              <p>
                <strong>NGO Wallet:</strong>{' '}
                <a
                  href={getEtherscanLink(product.ngoWallet, true)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  {product.ngoWallet}
                </a>
              </p>
              {product.artisanWallet && (
                <p>
                  <strong>Artisan Wallet:</strong>{' '}
                  <a
                    href={getEtherscanLink(product.artisanWallet, true)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {product.artisanWallet}
                  </a>
                </p>
              )}
              <p><strong>Sold:</strong> {product.sold ? 'Yes' : 'No'}</p>
              {product.sold && (
                <>
                  <p><strong>Sold At:</strong> {new Date(product.soldAt.$date ? product.soldAt.$date.$numberLong : product.soldAt).toLocaleString()}</p>
                  {product.revenue && (
                    <div className="col-span-1 md:col-span-2 mt-4 p-4 bg-gray-700 rounded-lg">
                      <h3 className="text-xl font-semibold mb-2">Revenue Share:</h3>
                      <p><strong>NGO Share:</strong> {product.revenue.ngoShare} {product.currency}</p>
                      <p><strong>Institution Share:</strong> {product.revenue.institutionShare} {product.currency}</p>
                      <p><strong>Platform Share:</strong> {product.revenue.platformShare} {product.currency}</p>
                      <p><strong>Total Revenue:</strong> {product.revenue.total} {product.currency}</p>
                    </div>
                  )}
                </>
              )}
              {product.transactionHash && (
                <p>
                  <strong>Transaction Hash:</strong>{' '}
                  <a
                    href={getEtherscanLink(product.transactionHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:underline"
                  >
                    {product.transactionHash.substring(0, 10)}...{product.transactionHash.substring(product.transactionHash.length - 8)}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="text-xl text-gray-400 italic">No product has been crafted with this donation yet.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default DonationDashboard;
