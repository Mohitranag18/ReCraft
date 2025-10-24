import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import ReCraftLogo from '../assets/ReCraft-Logo.png';

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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800/80 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-2xl">
                  <img className='rounded-md' src={ReCraftLogo} alt="ReCraft Logo" />
                </span>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Join ReCraft
            </h1>
            <p className="text-gray-400">Create your account and start making an impact</p>
          </div>

          {/* User Type Toggle */}
          <div className="flex gap-2 mb-6 bg-gray-900/50 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setUserType('institution')}
              className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${
                userType === 'institution'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              Institution
            </button>
            <button
              type="button"
              onClick={() => setUserType('ngo')}
              className={`flex-1 py-2 rounded-md font-semibold text-sm transition-colors ${
                userType === 'ngo'
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              NGO
            </button>
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-2">
                  {userType === 'institution' ? 'Institution Name' : 'NGO Name'}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              {userType === 'institution' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Institution Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
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
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">State/Province</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-400 mb-2">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-400 mb-2">Wallet Address</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.walletAddress}
                    readOnly
                    className="flex-1 px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg text-gray-300"
                    placeholder="Connect your wallet..."
                  />
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                  >
                    {formData.walletAddress ? 'Connected' : 'Connect Wallet'}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.walletAddress}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <a href="/login" className="text-green-400 hover:text-green-300 font-semibold">
                Login here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
