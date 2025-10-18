import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import ProductCard from './ProductCard';

const Marketplace = ({ contractAddress, contractABI }) => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    search: '',
    minPrice: '',
    maxPrice: ''
  });
  const [account, setAccount] = useState('');

  useEffect(() => {
    fetchProducts();
    checkWalletConnection();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, products]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/products/marketplace');
      setProducts(response.data);
      setFilteredProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (filters.type) {
      filtered = filtered.filter(p => p.productType === filters.type);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower)
      );
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => p.price >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.price <= parseFloat(filters.maxPrice));
    }

    setFilteredProducts(filtered);
  };

  const handlePurchase = async (product) => {
    if (!account) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      // Convert price to wei
      const priceInWei = ethers.parseEther(product.price.toString());

      // Purchase product on blockchain
      const tx = await contract.purchaseProduct(product.blockchainId, {
        value: priceInWei
      });

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Calculate revenue distribution
      const ngoShare = (product.price * 0.7).toFixed(4);
      const institutionShare = (product.price * 0.2).toFixed(4);
      const platformShare = (product.price * 0.1).toFixed(4);

      // Update backend
      await axios.patch(`http://localhost:5000/api/products/${product._id}/purchase`, {
        buyerWallet: account,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        revenue: {
          ngoShare: parseFloat(ngoShare),
          institutionShare: parseFloat(institutionShare),
          platformShare: parseFloat(platformShare),
          total: product.price
        }
      });

      alert('Product purchased successfully!');
      fetchProducts();
    } catch (error) {
      console.error('Error purchasing product:', error);
      alert('Failed to purchase product: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-3">ReCraft Marketplace</h1>
          <p className="text-lg opacity-90">
            Discover sustainable home décor crafted from recycled materials
          </p>
          {!account ? (
            <button
              onClick={connectWallet}
              className="mt-4 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Connect Wallet
            </button>
          ) : (
            <p className="mt-4 text-sm opacity-90">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="decor">Décor</option>
              <option value="frame">Frame</option>
              <option value="lamp">Lamp</option>
              <option value="basket">Basket</option>
              <option value="coaster">Coaster</option>
              <option value="notebook">Notebook</option>
              <option value="gift-box">Gift Box</option>
              <option value="other">Other</option>
            </select>

            <input
              type="number"
              placeholder="Min Price (ETH)"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              step="0.001"
            />

            <input
              type="number"
              placeholder="Max Price (ETH)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              step="0.001"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {filteredProducts.length} Products Available
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onPurchase={handlePurchase}
                  userWallet={account}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-20">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                <p className="mt-2 text-gray-500">Try adjusting your filters</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;