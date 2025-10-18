import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import InstitutionDashboard from './components/InstitutionDashboard';
import NGODashboard from './components/NGODashboard';
import Marketplace from './components/Marketplace';
import Login from './components/Login';
import Register from './components/Register';

// Import contract ABI (you'll need to copy this after deployment)
import contractABI from './contracts/ReCraftABI.json';

function App() {
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [contractAddress, setContractAddress] = useState('');

  useEffect(() => {
    // Load contract address from environment or config
    setContractAddress(import.meta.env.VITE_CONTRACT_ADDRESS || '');
    
    // Check if user is already logged in
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
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">R</span>
                </div>
                <span className="text-2xl font-bold text-gray-800">ReCraft</span>
              </Link>

              <div className="flex items-center gap-4">
                <Link
                  to="/marketplace"
                  className="text-gray-700 hover:text-blue-600 font-medium transition"
                >
                  Marketplace
                </Link>

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="text-gray-700 hover:text-blue-600 font-medium transition"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-gray-700 hover:text-blue-600 font-medium transition"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
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
        </Routes>
      </div>
    </Router>
  );
}

// Home Page Component
const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-500 via-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Transform Waste into Wonder
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Connecting institutions with NGOs to create sustainable home décor from recycled materials
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/marketplace"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition"
            >
              Explore Marketplace
            </Link>
            <Link
              to="/register"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">
            How ReCraft Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              title="Institutions Donate"
              description="Schools, colleges, and offices donate discarded paper and materials through our platform"
              icon="🏫"
            />
            <FeatureCard
              title="NGOs Transform"
              description="Local NGOs and artisans craft beautiful, sustainable home décor products"
              icon="♻️"
            />
            <FeatureCard
              title="Everyone Benefits"
              description="Transparent revenue sharing ensures fair compensation for all participants"
              icon="💚"
            />
          </div>
        </div>
      </div>

      {/* Blockchain Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-gray-800 mb-6">
            Powered by Blockchain
          </h2>
          <p className="text-xl text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Full transparency and traceability for every product, from donation to sale
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-3">🔗 Complete Traceability</h3>
              <p className="text-gray-600">
                Every product can be traced back to its source institution and the NGO that crafted it
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold text-gray-800 mb-3">💰 Fair Revenue Distribution</h3>
              <p className="text-gray-600">
                Smart contracts automatically split revenue: 70% NGO/Artisan, 20% Institution, 10% Platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make an Impact?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join our community of institutions, NGOs, and conscious consumers
          </p>
          <Link
            to="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition inline-block"
          >
            Register Now
          </Link>
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ title, description, icon }) => {
  return (
    <div className="bg-gray-50 p-8 rounded-lg text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default App;