import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ReCraftLogo from '../assets/ReCraft-Logo.png';

const Login = ({ setIsAuthenticated, setUserRole }) => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('institution');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = userType === 'institution' 
        ? 'http://localhost:5000/api/institutions/login'
        : 'http://localhost:5000/api/ngos/login';

      const response = await axios.post(endpoint, formData);

      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userRole', userType);
      localStorage.setItem('walletAddress', response.data[userType].walletAddress);

      setIsAuthenticated(true);
      setUserRole(userType);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
              Welcome Back
            </h1>
            <p className="text-gray-400">Login to your ReCraft account</p>
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
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold text-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging In...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <a href="/register" className="text-green-400 hover:text-green-300 font-semibold">
                Register here
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
