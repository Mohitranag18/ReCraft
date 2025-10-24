import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import InstitutionDashboard from './components/InstitutionDashboard';
import NGODashboard from './components/NGODashboard';
import Marketplace from './components/Marketplace';
import Login from './components/Login';
import Register from './components/Register';
import DonationDashboard from './components/DonationDashboard'; // NEW: Import DonationDashboard
import { Web3Provider } from './providers/Web3Provider'; // ← NEW: Avail integration
import ReCraftLogo from './assets/ReCraft-Logo.png';

// Import contract ABI
import contractABI from './contracts/ReCraftABI.json';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contractAddress, setContractAddress] = useState('');

  useEffect(() => {
    // Load contract address
    setContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS || '');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    if (token && role) {
      setIsAuthenticated(true);
      setUserRole(role);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('walletAddress');
    setIsAuthenticated(false);
    setUserRole(null);
  };

  return (
    // ← WRAP EVERYTHING IN WEB3PROVIDER for Avail Nexus
    <Web3Provider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          {/* Navigation */}
          <nav className="sticky top-0 z-50 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50">
            <div className="max-w-7xl mx-auto px-6 py-3">
              <div className="flex justify-between items-center">
                <Link to="/" className="flex items-center gap-3 group">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white font-bold text-2xl">
                      <img className='rounded-md' src={ReCraftLogo} alt="ReCraft Logo" />
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-white">
                      ReCraft
                    </span>
                    <span className="text-xs text-gray-400 font-medium">Sustainable • Blockchain</span>
                  </div>
                </Link>

                <div className="flex items-center gap-6">
                  <Link
                    to="/marketplace"
                    className="text-gray-300 hover:text-green-400 transition-colors text-sm font-semibold"
                  >
                    Marketplace
                  </Link>

                  {isAuthenticated ? (
                    <>
                      <Link
                        to="/dashboard"
                        className="text-gray-300 hover:text-green-400 transition-colors text-sm font-semibold"
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className="text-gray-300 hover:text-green-400 transition-colors text-sm font-semibold"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-colors"
                      >
                        Register
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Routes */}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/marketplace" element={
              <Marketplace 
                contractAddress={contractAddress} 
                contractABI={contractABI} 
              />
            } />
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />
                )
              }
            />
            <Route
              path="/register"
              element={
                isAuthenticated ? (
                  <Navigate to="/dashboard" />
                ) : (
                  <Register setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />
                )
              }
            />
            <Route
              path="/dashboard"
              element={
                isAuthenticated ? (
                  userRole === 'institution' ? (
                    <InstitutionDashboard 
                      contractAddress={contractAddress} 
                      contractABI={contractABI} 
                    />
                  ) : userRole === 'ngo' ? (
                    <NGODashboard 
                      contractAddress={contractAddress} 
                      contractABI={contractABI} 
                    />
                  ) : (
                    <Navigate to="/" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            {/* NEW: Route for Donation Dashboard */}
            <Route path="/dashboard/:id" element={<DonationDashboard />} />
          </Routes>
        </div>
      </Router>
    </Web3Provider>
  );
}

// Home Page Component
const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative flex items-center justify-center h-screen overflow-hidden text-white pb-12">
        <div className="absolute inset-0 bg-gray-900 opacity-80"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block mb-6 bg-green-900/50 border border-green-500/30 px-4 py-2 rounded-full">
            <span className="text-green-300 font-semibold text-sm">
              ♻️ Sustainable • Transparent • Blockchain-Powered
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
            <span className="text-green-400">Transform Waste</span>
            <br />
            <span className="text-white">into Wonder</span>
          </h1>
          
          <p className="text-lg md:text-xl mb-8 text-gray-300 max-w-3xl mx-auto">
            Connecting institutions with NGOs to create sustainable home décor from recycled materials.
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center mb-10">
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-300 font-semibold text-sm">🌉 Cross-chain</span>
            </div>
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-300 font-semibold text-sm">💳 PYUSD</span>
            </div>
            <div className="bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
              <span className="text-gray-300 font-semibold text-sm">🔍 Verified</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/marketplace"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors"
            >
              Explore Marketplace
            </Link>
            <Link
              to="/register"
              className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold text-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Rest of homepage... */}
    </div>
  );
};

export default App;
