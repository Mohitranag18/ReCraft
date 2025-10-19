import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import ProductCard from './ProductCard';
import { initializeAvailNexus, bridgeTokens, SUPPORTED_CHAINS } from '../utils/availBridge';

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
  const [showBridgeModal, setShowBridgeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('ETH'); // 'ETH' or 'PYUSD'
  const [bridgeParams, setBridgeParams] = useState({
    sourceChain: null,
    targetChain: null
  });

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

  const handlePurchaseWithETH = async (product) => {
    if (!account) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const priceInWei = ethers.parseEther(product.price.toString());

      console.log('Purchasing with ETH...');
      const tx = await contract.purchaseProductWithETH(product.blockchainId, {
        value: priceInWei
      });

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      await updateBackendAfterPurchase(product, receipt, 'ETH');

      alert('Product purchased successfully with ETH!');
      fetchProducts();
    } catch (error) {
      console.error('Error purchasing with ETH:', error);
      alert('Failed to purchase product: ' + error.message);
    }
  };

  const handlePurchaseWithPYUSD = async (product) => {
    if (!account) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      // Get PYUSD token address from environment or contract
      const pyusdAddress = import.meta.env.VITE_PYUSD_TOKEN_ADDRESS;
      
      if (!pyusdAddress || pyusdAddress === '0x0000000000000000000000000000000000000000') {
        alert('PYUSD is not configured on this network. Please use ETH payment.');
        return;
      }

      // CRITICAL FIX: PYUSD has 6 decimals, not 18!
      // If product.price is in ETH (e.g., 0.005), we need to convert to USD
      // Assuming 1 ETH = 2000 USD
      const priceInUSD = product.price * 2000; // Convert ETH price to USD
      const priceInPYUSD = ethers.parseUnits(priceInUSD.toString(), 6); // 6 decimals for PYUSD
      
      console.log('Product ETH price:', product.price);
      console.log('Product USD price:', priceInUSD);
      console.log('PYUSD amount (raw):', priceInPYUSD.toString());

      // ERC-20 ABI for approve and transfer
      const erc20ABI = [
        'function approve(address spender, uint256 amount) public returns (bool)',
        'function allowance(address owner, address spender) public view returns (uint256)',
        'function balanceOf(address account) public view returns (uint256)',
        'function decimals() public view returns (uint8)'
      ];

      const pyusdContract = new ethers.Contract(pyusdAddress, erc20ABI, signer);

      // Check PYUSD balance
      const balance = await pyusdContract.balanceOf(account);
      const balanceFormatted = ethers.formatUnits(balance, 6);
      console.log('Your PYUSD balance:', balanceFormatted);
      
      if (balance < priceInPYUSD) {
        alert(`Insufficient PYUSD balance. You have ${balanceFormatted} PYUSD but need ${priceInUSD} PYUSD`);
        return;
      }

      // Approve contract to spend PYUSD
      console.log('Approving PYUSD spend...');
      const approveTx = await pyusdContract.approve(contractAddress, priceInPYUSD);
      
      console.log('Approval transaction sent:', approveTx.hash);
      alert('Approving PYUSD... Please wait for confirmation.');
      
      await approveTx.wait();
      console.log('PYUSD approved');
      alert('PYUSD approved! Now purchasing product...');

      // Purchase with PYUSD
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      console.log('Purchasing with PYUSD...');
      const tx = await contract.purchaseProductWithPYUSD(product.blockchainId);

      console.log('Transaction sent:', tx.hash);
      alert('Transaction sent! Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      await updateBackendAfterPurchase(product, receipt, 'PYUSD');

      alert('Product purchased successfully with PYUSD!');
      fetchProducts();
    } catch (error) {
      console.error('Error purchasing with PYUSD:', error);
      
      // Better error messages
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user.');
      } else if (error.message.includes('rate limited')) {
        alert('RPC rate limit reached. Please wait a moment and try again, or switch to a different RPC provider.');
      } else if (error.message.includes('insufficient funds')) {
        alert('Insufficient funds for gas fees. Make sure you have enough SepoliaETH.');
      } else {
        alert('Failed to purchase with PYUSD: ' + error.message);
      }
    }
  };

  const updateBackendAfterPurchase = async (product, receipt, method) => {
    const ngoShare = (product.price * 0.7).toFixed(4);
    const institutionShare = (product.price * 0.2).toFixed(4);
    const platformShare = (product.price * 0.1).toFixed(4);

    await axios.patch(`http://localhost:5000/api/products/${product._id}/purchase`, {
      buyerWallet: account,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      revenue: {
        ngoShare: parseFloat(ngoShare),
        institutionShare: parseFloat(institutionShare),
        platformShare: parseFloat(platformShare),
        total: product.price
      },
      paymentMethod: method
    });
  };

  const openBridgeModal = (product) => {
    setSelectedProduct(product);
    setShowBridgeModal(true);
  };

  const handleBridge = async () => {
    if (!bridgeParams.sourceChain || !bridgeParams.targetChain) {
      alert('Please select both source and target chains');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const nexus = await initializeAvailNexus(provider);

      const pyusdAddress = process.env.VITE_PYUSD_TOKEN_ADDRESS;
      const amount = ethers.parseUnits(selectedProduct.price.toString(), 6);

      console.log('Bridging tokens...');
      const result = await bridgeTokens(nexus, {
        sourceChain: bridgeParams.sourceChain,
        targetChain: bridgeParams.targetChain,
        tokenAddress: pyusdAddress,
        amount: amount.toString(),
        recipientAddress: account
      });

      alert(`Bridge initiated! Transaction: ${result.txHash}\nEstimated time: ${result.estimatedTime}`);
      setShowBridgeModal(false);
    } catch (error) {
      console.error('Bridge error:', error);
      alert('Failed to bridge tokens: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-4xl font-bold mb-3">ReCraft Marketplace</h1>
          <p className="text-lg opacity-90 mb-2">
            Discover sustainable home décor crafted from recycled materials
          </p>
          <p className="text-sm opacity-75">
            💳 Pay with ETH or PYUSD  •  🌉 Cross-chain via Avail Nexus  •  🔍 Verified on Blockscout
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
              placeholder="Min Price"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              step="0.001"
            />

            <input
              type="number"
              placeholder="Max Price"
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
                  onPurchaseETH={handlePurchaseWithETH}
                  onPurchasePYUSD={handlePurchaseWithPYUSD}
                  onBridge={openBridgeModal}
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

      {/* Bridge Modal */}
      {showBridgeModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Bridge Tokens</h3>
              <button
                onClick={() => setShowBridgeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Bridge PYUSD to purchase {selectedProduct.productName}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Chain
                </label>
                <select
                  onChange={(e) => {
                    const chain = Object.values(SUPPORTED_CHAINS).find(
                      c => c.chainId === parseInt(e.target.value)
                    );
                    setBridgeParams({ ...bridgeParams, sourceChain: chain });
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select chain</option>
                  {Object.values(SUPPORTED_CHAINS).map(chain => (
                    <option key={chain.chainId} value={chain.chainId}>
                      {chain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Chain
                </label>
                <select
                  onChange={(e) => {
                    const chain = Object.values(SUPPORTED_CHAINS).find(
                      c => c.chainId === parseInt(e.target.value)
                    );
                    setBridgeParams({ ...bridgeParams, targetChain: chain });
                  }}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Select chain</option>
                  {Object.values(SUPPORTED_CHAINS).map(chain => (
                    <option key={chain.chainId} value={chain.chainId}>
                      {chain.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Amount:</strong> {selectedProduct.price} PYUSD
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Est. Time:</strong> 5-10 minutes
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>Bridge Fee:</strong> ~0.001 ETH
                </p>
              </div>

              <button
                onClick={handleBridge}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Bridge via Avail Nexus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;