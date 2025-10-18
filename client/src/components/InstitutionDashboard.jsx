import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

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

      const provider = new ethers.BrowserProvider(window.ethereum);
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

  const getStatusColor = (status) => {
    const colors = {
      Available: 'bg-green-100 text-green-800',
      Accepted: 'bg-blue-100 text-blue-800',
      Crafted: 'bg-purple-100 text-purple-800',
      Sold: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Institution Dashboard</h1>
          <p className="text-gray-600">Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
        </div>

        {/* Create Donation Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Create Donation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Type
                </label>
                <select
                  value={formData.materialType}
                  onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="paper">Paper</option>
                  <option value="cardboard">Cardboard</option>
                  <option value="notebooks">Notebooks</option>
                  <option value="magazines">Magazines</option>
                  <option value="newspapers">Newspapers</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter quantity"
                    required
                    min="1"
                  />
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Add any additional details..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Donation'}
            </button>
          </form>
        </div>

        {/* Donations List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">My Donations</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Material</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Quantity</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">NGO</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr key={donation._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">#{donation.blockchainId}</td>
                    <td className="py-3 px-4 capitalize">{donation.materialType}</td>
                    <td className="py-3 px-4">{donation.quantity} {donation.unit}</td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(donation.status)}`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {donation.ngoId ? donation.ngoId.name : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {new Date(donation.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {donations.length === 0 && (
              <p className="text-center text-gray-500 py-8">No donations yet. Create your first donation above!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionDashboard;