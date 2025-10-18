import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

const Register = ({ setIsAuthenticated, setUserRole }) => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('institution');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    walletAddress: '',
    type: 'school',
    registrationNumber: '',
    city: '',
    state: '',
    country: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to continue!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setFormData({ ...formData, walletAddress: accounts[0] });
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!formData.walletAddress) {
        setError('Please connect your wallet first');
        setLoading(false);
        return;
      }

      const endpoint = userType === 'institution' 
        ? 'http://localhost:5000/api/institutions/register'
        : 'http://localhost:5000/api/ngos/register';

      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        walletAddress: formData.walletAddress,
        address: {
          city: formData.city,
          state: formData.state,
          country: formData.country
        }
      };

      if (userType === 'institution') {
        payload.type = formData.type;
      } else {
        payload.registrationNumber = formData.registrationNumber;
      }

      const response = await axios.post(endpoint, payload);

      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', userType);
      localStorage.setItem('walletAddress', formData.walletAddress);

      setIsAuthenticated(true);
      setUserRole(userType);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">R</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">Join ReCraft</h1>
          <p className="text-gray-600 mt-2">Create your account and start making an impact</p>
        </div>

        {/* User Type Toggle */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setUserType('institution')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              userType === 'institution'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Institution
          </button>
          <button
            type="button"
            onClick={() => setUserType('ngo')}
            className={`flex-1 py-3 rounded-lg font-semibold transition ${
              userType === 'ngo'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            NGO
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {userType === 'institution' ? 'Institution Name' : 'NGO Name'}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {userType === 'institution' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institution Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="school">School</option>
                  <option value="college">College</option>
                  <option value="university">University</option>
                  <option value="office">Office</option>
                  <option value="other">Other</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <input
                  type="text"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State/Province
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.walletAddress}
                  readOnly
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="Connect your wallet..."
                />
                <button
                  type="button"
                  onClick={connectWallet}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition"
                >
                  {formData.walletAddress ? 'Connected' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.walletAddress}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 font-semibold hover:underline">
            Login here
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;