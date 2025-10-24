import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import { switchToSepolia } from '../utils/network';

const InstitutionDashboard = ({ contractAddress, contractABI }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    materialType: 'paper',
    quantity: '',
    unit: 'sheets',
    description: ''
  });
  const [account, setAccount] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedAccount = localStorage.getItem('walletAddress');
    if (storedToken) setToken(storedToken);
    if (storedAccount) setAccount(storedAccount);
    
    if (storedToken) {
      fetchDonations(storedToken);
    }
  }, []);

  const fetchDonations = async (authToken) => {
    try {
      const response = await axios.get('http://localhost:5000/api/institutions/donations', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setDonations(response.data);
    } catch (error) {
      console.error('Error fetching donations:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = await switchToSepolia();
      if (!provider) {
        throw new Error('Failed to connect to Sepolia network.');
      }
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Create donation on blockchain
      const tx = await contract.createDonation(
        formData.materialType,
        parseInt(formData.quantity)
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Extract donation ID from events
      const event = receipt.logs.find(log => {
        try {
          return contract.interface.parseLog(log)?.name === 'DonationCreated';
        } catch {
          return false;
        }
      });

      let donationId = 0;
      if (event) {
        const parsedEvent = contract.interface.parseLog(event);
        donationId = Number(parsedEvent.args.donationId);
      }

      // Save to backend
      await axios.post(
        'http://localhost:5000/api/institutions/donations',
        {
          blockchainId: donationId,
          materialType: formData.materialType,
          quantity: parseInt(formData.quantity),
          unit: formData.unit,
          description: formData.description,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Donation created successfully!');
      setFormData({ materialType: 'paper', quantity: '', unit: 'sheets', description: '' });
      fetchDonations(token);
    } catch (error) {
      console.error('Error creating donation:', error);
      alert('Failed to create donation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPill = (status) => {
    const baseClasses = "px-3 py-1.5 rounded-full text-xs font-semibold";
    const statusClasses = {
      Available: 'bg-green-900/50 text-green-300 border border-green-500/30',
      Accepted: 'bg-blue-900/50 text-blue-300 border border-blue-500/30',
      Crafted: 'bg-purple-900/50 text-purple-300 border border-purple-500/30',
      Sold: 'bg-gray-700/50 text-gray-300 border border-gray-600'
    };
    return `${baseClasses} ${statusClasses[status] || statusClasses.Sold}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">
                Institution Dashboard
              </h1>
              <p className="text-gray-400 flex items-center gap-2 text-sm">
                Connected: {account.slice(0, 6)}...{account.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Create Donation Form */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 mb-8 shadow-lg">
          <h2 className="text-3xl font-bold text-white mb-6">
            Create a New Donation
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Material Type</label>
                <select
                  value={formData.materialType}
                  onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                  required
                >
                  <option className='bg-gray-900' value="paper">📄 Paper</option>
                  <option className='bg-gray-900' value="cardboard">📦 Cardboard</option>
                  <option className='bg-gray-900' value="notebooks">📓 Notebooks</option>
                  <option className='bg-gray-900' value="magazines">📰 Magazines</option>
                  <option className='bg-gray-900' value="newspapers">🗞️ Newspapers</option>
                  <option className='bg-gray-900' value="mixed">🔀 Mixed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Quantity</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                    placeholder="e.g., 100"
                    required
                    min="1"
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                  >
                    <option value="sheets">Sheets</option>
                    <option value="kg">Kg</option>
                    <option value="units">Units</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                rows="3"
                placeholder="Add details like quality, condition, etc."
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Donation...' : 'Create Donation'}
            </button>
          </form>
        </div>

        {/* Donations List */}
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-2xl p-6 shadow-lg">
          <h2 className="text-3xl font-bold text-white mb-6">
            My Donation History
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="p-3 text-sm font-semibold text-gray-300">ID</th>
                  <th className="p-3 text-sm font-semibold text-gray-300">Material</th>
                  <th className="p-3 text-sm font-semibold text-gray-300">Quantity</th>
                  <th className="p-3 text-sm font-semibold text-gray-300">Status</th>
                  <th className="p-3 text-sm font-semibold text-gray-300">NGO</th>
                  <th className="p-3 text-sm font-semibold text-gray-300">Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation._id} className="border-b border-gray-800 hover:bg-gray-700/50 transition-colors">
                    <td className="p-3 font-mono text-green-400 text-sm">#{donation.blockchainId}</td>
                    <td className="p-3 capitalize text-gray-300 text-sm">{donation.materialType}</td>
                    <td className="p-3 text-gray-300 text-sm">{donation.quantity} {donation.unit}</td>
                    <td className="p-3">
                      <span className={getStatusPill(donation.status)}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-300 text-sm">{donation.ngoId ? donation.ngoId.name : '-'}</td>
                    <td className="p-3 text-sm text-gray-400">{new Date(donation.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {donations.length === 0 && (
              <div className="text-center py-10 text-gray-500">
                <p>No donations yet. Create your first one above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;
