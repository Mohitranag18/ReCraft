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
    priceETH: '',
    pricePYUSD: '',
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

      const tx = await contract.acceptDonation(donation.blockchainId);
      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

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

  // Auto-calculate PYUSD price based on ETH price (1 ETH ≈ $2000)
  const handleETHPriceChange = (ethPrice) => {
    setProductForm({
      ...productForm,
      priceETH: ethPrice,
      pricePYUSD: ethPrice ? (parseFloat(ethPrice) * 2000).toFixed(2) : ''
    });
  };

  const handlePYUSDPriceChange = (pyusdPrice) => {
    setProductForm({
      ...productForm,
      pricePYUSD: pyusdPrice,
      priceETH: pyusdPrice ? (parseFloat(pyusdPrice) / 2000).toFixed(6) : ''
    });
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

      // Convert prices
      const priceInWei = ethers.parseEther(productForm.priceETH);
      
      // CRITICAL: PYUSD has 6 decimals, store as-is (already in USD)
      const priceInPYUSD = ethers.parseUnits(productForm.pricePYUSD, 6);
      
      console.log('Creating product:');
      console.log('- ETH price:', productForm.priceETH, 'ETH');
      console.log('- PYUSD price:', productForm.pricePYUSD, 'PYUSD');
      console.log('- Price in Wei:', priceInWei.toString());
      console.log('- Price in PYUSD units:', priceInPYUSD.toString());

      // Create product on blockchain with both prices
      const tx = await contract.createProduct(
        selectedDonation.blockchainId,
        productForm.productName,
        productForm.productType,
        priceInWei,
        priceInPYUSD,
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
          priceETH: parseFloat(productForm.priceETH),
          pricePYUSD: parseFloat(productForm.pricePYUSD),
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
        priceETH: '',
        pricePYUSD: '',
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
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">
                NGO Dashboard
              </h1>
              <p className="text-gray-400 flex items-center gap-2 text-sm">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-xs bg-gray-700/50 border border-gray-600 text-gray-300 px-3 py-1.5 rounded-full font-semibold">
              💳 PYUSD Enabled
            </span>
            <span className="text-xs bg-gray-700/50 border border-gray-600 text-gray-300 px-3 py-1.5 rounded-full font-semibold">
              🌉 Cross-chain Ready
            </span>
            <span className="text-xs bg-gray-700/50 border border-gray-600 text-gray-300 px-3 py-1.5 rounded-full font-semibold">
              🔍 Etherscan Verified
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-800/50 p-1 rounded-lg border border-gray-700/50">
          <button
            onClick={() => setActiveTab('available')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${
              activeTab === 'available'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            Available Donations <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">{availableDonations.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('accepted')}
            className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${
              activeTab === 'accepted'
                ? 'bg-green-600 text-white'
                : 'text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            My Donations <span className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">{myDonations.length}</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 shadow-lg">
          {activeTab === 'available' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableDonations.map((donation) => (
                <div key={donation._id} className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
                  <h3 className="font-bold text-lg text-white capitalize mb-2">{donation.materialType}</h3>
                  <p className="text-gray-400 mb-3 text-sm">Quantity: {donation.quantity} {donation.unit}</p>
                  <p className="text-xs text-gray-500 mb-4">From: {donation.institutionId?.name || 'Unknown'}</p>
                  <button
                    onClick={() => handleAcceptDonation(donation)}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
                  >
                    Accept Donation
                  </button>
                </div>
              ))}
              {availableDonations.length === 0 && <p className="text-gray-500 col-span-3 text-center py-8">No available donations.</p>}
            </div>
          )}

          {activeTab === 'accepted' && (
            <div className="space-y-4">
              {myDonations.map((donation) => (
                <div key={donation._id} className="bg-gray-700/50 border border-gray-600 rounded-xl p-5 flex justify-between items-center hover:border-green-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/10">
                  <div>
                    <h3 className="font-bold text-lg text-white capitalize">{donation.materialType} - {donation.quantity} {donation.unit}</h3>
                    <p className="text-sm text-gray-400">From: {donation.institutionId?.name}</p>
                    <p className="text-sm text-green-400 font-semibold">Status: {donation.status}</p>
                  </div>
                  {donation.status === 'Accepted' && (
                    <button
                      onClick={() => { setSelectedDonation(donation); setShowProductForm(true); }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                    >
                      Create Product
                    </button>
                  )}
                </div>
              ))}
              {myDonations.length === 0 && <p className="text-gray-500 text-center py-8">No accepted donations yet.</p>}
            </div>
          )}
        </div>

        {/* Product Creation Modal */}
        {showProductForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-white">
                  Create Product
                </h2>
                <button onClick={() => setShowProductForm(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleCreateProduct} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Product Name</label>
                    <input type="text" value={productForm.productName} onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Product Type</label>
                    <select value={productForm.productType} onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white" required>
                      <option className='bg-gray-900' value="decor">Décor</option>
                      <option className='bg-gray-900' value="frame">Frame</option>
                      <option className='bg-gray-900' value="lamp">Lamp</option>
                      <option className='bg-gray-900' value="basket">Basket</option>
                      <option className='bg-gray-900' value="coaster">Coaster</option>
                      <option className='bg-gray-900' value="notebook">Notebook</option>
                      <option className='bg-gray-900' value="gift-box">Gift Box</option>
                      <option className='bg-gray-900' value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Price in ETH</label>
                    <input type="number" step="0.001" value={productForm.priceETH} onChange={(e) => handleETHPriceChange(e.target.value)} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Price in PYUSD</label>
                    <input type="number" step="0.01" value={productForm.pricePYUSD} onChange={(e) => handlePYUSDPriceChange(e.target.value)} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white" required />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Prices are auto-synchronized. 1 ETH ≈ 2000 PYUSD</p>
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Description</label>
                  <textarea value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white" rows="3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Artisan Name</label>
                    <input type="text" value={productForm.artisanName} onChange={(e) => setProductForm({ ...productForm, artisanName: e.target.value })} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Artisan Wallet (Optional)</label>
                    <input type="text" value={productForm.artisanWallet} onChange={(e) => setProductForm({ ...productForm, artisanWallet: e.target.value })} className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white" placeholder="Leave blank for NGO wallet" />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="submit" disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-lg disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Product'}
                  </button>
                  <button type="button" onClick={() => setShowProductForm(false)} className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg font-semibold">
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
