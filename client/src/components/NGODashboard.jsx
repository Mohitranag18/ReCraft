import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

const NGODashboard = ({ contractAddress, contractABI }) => {
  const [availableDonations, setAvailableDonations] = useState([]);
  const [myDonations, setMyDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('available');
  const [showProductForm, setShowProductForm] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [account, setAccount] = useState('');
  const [token, setToken] = useState('');
  const [productForm, setProductForm] = useState({
    productName: '',
    productType: 'decor',
    description: '',
    price: '',
    artisanName: '',
    artisanWallet: ''
  });

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedAccount = localStorage.getItem('walletAddress');
    if (storedToken) setToken(storedToken);
    if (storedAccount) setAccount(storedAccount);
    
    if (storedToken) {
      fetchAvailableDonations(storedToken);
      fetchMyDonations(storedToken);
    }
  }, []);

  const fetchAvailableDonations = async (authToken) => {
    try {
      const response = await axios.get('http://localhost:5000/api/ngos/donations/available', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setAvailableDonations(response.data);
    } catch (error) {
      console.error('Error fetching available donations:', error);
    }
  };

  const fetchMyDonations = async (authToken) => {
    try {
      const response = await axios.get('http://localhost:5000/api/ngos/donations', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setMyDonations(response.data);
    } catch (error) {
      console.error('Error fetching my donations:', error);
    }
  };

  const handleAcceptDonation = async (donation) => {
    setLoading(true);
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Accept donation on blockchain
      const tx = await contract.acceptDonation(donation.blockchainId);
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Update backend
      await axios.patch(
        `http://localhost:5000/api/ngos/donations/${donation._id}/accept`,
        {
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Donation accepted successfully!');
      fetchAvailableDonations(token);
      fetchMyDonations(token);
    } catch (error) {
      console.error('Error accepting donation:', error);
      alert('Failed to accept donation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Convert price to wei
      const priceInWei = ethers.parseEther(productForm.price);

      // Create product on blockchain
      const tx = await contract.createProduct(
        selectedDonation.blockchainId,
        productForm.productName,
        productForm.productType,
        priceInWei,
        productForm.artisanWallet || account
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Extract product ID from events
      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log)?.name === 'ProductCreated';
        } catch {
          return false;
        }
      });

      let productId = 0;
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        productId = Number(parsedEvent.args.productId);
      }

      // Save to backend
      await axios.post(
        'http://localhost:5000/api/products',
        {
          blockchainId: productId,
          donationId: selectedDonation._id,
          donationBlockchainId: selectedDonation.blockchainId,
          productName: productForm.productName,
          productType: productForm.productType,
          description: productForm.description,
          price: parseFloat(productForm.price),
          artisanWallet: productForm.artisanWallet || account,
          artisanName: productForm.artisanName,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Product created successfully!');
      setShowProductForm(false);
      setProductForm({
        productName: '',
        productType: 'decor',
        description: '',
        price: '',
        artisanName: '',
        artisanWallet: ''
      });
      fetchMyDonations(token);
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">NGO Dashboard</h1>
          <p className="text-gray-600">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('available')}
              className={`flex-1 py-4 px-6 font-semibold ${
                activeTab === 'available'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Available Donations ({availableDonations.length})
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`flex-1 py-4 px-6 font-semibold ${
                activeTab === 'accepted'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              My Donations ({myDonations.length})
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'available' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableDonations.map((donation) => (
                  <div key={donation._id} className="border rounded-lg p-4 hover:shadow-md transition">
                    <h3 className="font-semibold text-lg text-gray-800 capitalize mb-2">
                      {donation.materialType}
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Quantity: {donation.quantity} {donation.unit}
                    </p>
                    <p className="text-sm text-gray-500 mb-3">
                      From: {donation.institutionId?.name || 'Unknown'}
                    </p>
                    {donation.description && (
                      <p className="text-sm text-gray-600 mb-3">{donation.description}</p>
                    )}
                    <button
                      onClick={() => handleAcceptDonation(donation)}
                      disabled={loading}
                      className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                    >
                      Accept Donation
                    </button>
                  </div>
                ))}
                {availableDonations.length === 0 && (
                  <p className="text-gray-500 col-span-3 text-center py-8">
                    No available donations at the moment
                  </p>
                )}
              </div>
            )}

            {activeTab === 'accepted' && (
              <div className="space-y-4">
                {myDonations.map((donation) => (
                  <div key={donation._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-800 capitalize">
                          {donation.materialType} - {donation.quantity} {donation.unit}
                        </h3>
                        <p className="text-sm text-gray-600">
                          From: {donation.institutionId?.name}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Status: <span className="font-semibold">{donation.status}</span>
                        </p>
                      </div>
                      {donation.status === 'Accepted' && (
                        <button
                          onClick={() => {
                            setSelectedDonation(donation);
                            setShowProductForm(true);
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                          Create Product
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {myDonations.length === 0 && (
                  <p className="text-gray-500 text-center py-8">
                    No accepted donations yet
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Product Creation Modal */}
        {showProductForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Create Product</h2>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={productForm.productName}
                    onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type
                  </label>
                  <select
                    value={productForm.productType}
                    onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="decor">Décor</option>
                    <option value="frame">Frame</option>
                    <option value="lamp">Lamp</option>
                    <option value="basket">Basket</option>
                    <option value="coaster">Coaster</option>
                    <option value="notebook">Notebook</option>
                    <option value="gift-box">Gift Box</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (in ETH/PYUSD)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artisan Name
                  </label>
                  <input
                    type="text"
                    value={productForm.artisanName}
                    onChange={(e) => setProductForm({ ...productForm, artisanName: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artisan Wallet (Optional)
                  </label>
                  <input
                    type="text"
                    value={productForm.artisanWallet}
                    onChange={(e) => setProductForm({ ...productForm, artisanWallet: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave blank to use NGO wallet"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
                  >
                    {loading ? 'Creating...' : 'Create Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NGODashboard;