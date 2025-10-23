/**
 * Marketplace Component - Integrated with Avail Nexus Bridge Execute
 * File: client/src/components/Marketplace.jsx
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';
import ProductCard from './ProductCard';
import { useNexus } from '../providers/NexusProvider';
import { useAccount } from 'wagmi';
import { ConnectKitButton } from 'connectkit';

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

  // Wagmi hooks for wallet connection
  const { address: account, isConnected } = useAccount();
  
  // Nexus SDK status
  const { isInitialized: nexusReady, nexusSdk } = useNexus();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, products]);

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
      // Request network switch to Sepolia if needed
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const priceInWei = ethers.parseEther(product.price.toString());

      console.log('💳 Purchasing with ETH...');
      console.log('Product:', product.productName);
      console.log('Price:', product.price, 'ETH');
      
      const tx = await contract.purchaseProductWithETH(product.blockchainId, {
        value: priceInWei
      });

      console.log('📤 Transaction sent:', tx.hash);
      alert('Transaction sent! Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      await updateBackendAfterPurchase(product, receipt, 'ETH');

      alert('🎉 Product purchased successfully with ETH!');
      fetchProducts();
    } catch (error) {
      console.error('❌ Error purchasing with ETH:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user.');
      } else if (error.code === 4902) {
        alert('Please add Sepolia network to your wallet first.');
      } else if (error.message.includes('insufficient funds')) {
        alert('Insufficient ETH balance for purchase and gas fees.');
      } else {
        alert('Failed to purchase product: ' + error.message);
      }
    }
  };

  const handlePurchaseWithPYUSD = async (product) => {
    if (!account) {
      alert('Please connect your wallet first!');
      return;
    }

    try {
      // Request network switch to Sepolia if needed
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const pyusdAddress = import.meta.env.VITE_PYUSD_TOKEN_ADDRESS;
      
      if (!pyusdAddress || pyusdAddress === '0x0000000000000000000000000000000000000000') {
        alert('PYUSD is not configured on this network. Please use ETH payment.');
        return;
      }

      const priceInUSD = product.price * 2000;
      const priceInPYUSD = ethers.parseUnits(priceInUSD.toString(), 6);
      
      console.log('💵 Purchasing with PYUSD...');
      console.log('Product ETH price:', product.price);
      console.log('Product USD price:', priceInUSD);
      console.log('PYUSD amount:', priceInPYUSD.toString());

      const erc20ABI = [
        'function approve(address spender, uint256 amount) public returns (bool)',
        'function allowance(address owner, address spender) public view returns (uint256)',
        'function balanceOf(address account) public view returns (uint256)',
        'function decimals() public view returns (uint8)'
      ];

      const pyusdContract = new ethers.Contract(pyusdAddress, erc20ABI, signer);

      const balance = await pyusdContract.balanceOf(account);
      const balanceFormatted = ethers.formatUnits(balance, 6);
      console.log('Your PYUSD balance:', balanceFormatted);
      
      if (balance < priceInPYUSD) {
        alert(`Insufficient PYUSD balance.\n\nYou have: ${balanceFormatted} PYUSD\nYou need: ${priceInUSD} PYUSD`);
        return;
      }

      console.log('🔐 Approving PYUSD spend...');
      const approveTx = await pyusdContract.approve(contractAddress, priceInPYUSD);
      
      console.log('📤 Approval transaction sent:', approveTx.hash);
      alert('Step 1/2: Approving PYUSD... Please wait for confirmation.');
      
      await approveTx.wait();
      console.log('✅ PYUSD approved');
      alert('Step 2/2: PYUSD approved! Now purchasing product...');

      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      console.log('🛒 Executing purchase...');
      const tx = await contract.purchaseProductWithPYUSD(product.blockchainId);

      console.log('📤 Purchase transaction sent:', tx.hash);
      alert('Purchase transaction sent! Waiting for confirmation...');
      
      const receipt = await tx.wait();
      console.log('✅ Transaction confirmed:', receipt);

      await updateBackendAfterPurchase(product, receipt, 'PYUSD');

      alert('🎉 Product purchased successfully with PYUSD!');
      fetchProducts();
    } catch (error) {
      console.error('❌ Error purchasing with PYUSD:', error);
      
      if (error.code === 'ACTION_REJECTED') {
        alert('Transaction was rejected by user.');
      } else if (error.code === 4902) {
        alert('Please add Sepolia network to your wallet first.');
      } else if (error.message.includes('rate limited')) {
        alert('RPC rate limit reached. Please wait a moment and try again.');
      } else if (error.message.includes('insufficient funds')) {
        alert('Insufficient funds for gas fees. Make sure you have enough SepoliaETH.');
      } else {
        alert('Failed to purchase with PYUSD: ' + error.message);
      }
    }
  };

  const handleCrossChainPurchase = async (product, bridgeResult) => {
    console.log('🌉 Cross-chain purchase completed:', bridgeResult);

    try {
      await updateBackendAfterPurchase(product, {
        hash: bridgeResult.executeTransactionHash || bridgeResult.transactionHash,
        blockNumber: bridgeResult.blockNumber,
      }, 'CROSS_CHAIN_ETH');

      alert('🎉 Product purchased successfully via cross-chain bridge!');
      fetchProducts();
    } catch (error) {
      console.error('❌ Error updating backend:', error);
    }
  };

  const updateBackendAfterPurchase = async (product, receipt, method) => {
    try {
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

      console.log('✅ Backend updated after purchase');
    } catch (error) {
      console.error('⚠️ Failed to update backend:', error);
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
          <p className="text-sm opacity-75 mb-4">
            💳 Pay with ETH or PYUSD  •  🌉 Cross-chain via Avail Nexus  •  🔍 Verified on Blockscout
          </p>
          
          {/* Wallet Connection */}
          <div className="flex items-center gap-4 mt-4">
            <ConnectKitButton />
            
            {isConnected && (
              <div className="flex items-center gap-2">
                {nexusReady ? (
                  <span className="text-sm bg-green-500 bg-opacity-20 border border-green-300 px-3 py-1 rounded-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Nexus Ready
                  </span>
                ) : (
                  <span className="text-sm bg-yellow-500 bg-opacity-20 border border-yellow-300 px-3 py-1 rounded-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                    Initializing Nexus...
                  </span>
                )}
              </div>
            )}
          </div>
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.001"
            />

            <input
              type="number"
              placeholder="Max Price (ETH)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.001"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Available
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onPurchaseETH={handlePurchaseWithETH}
                  onPurchasePYUSD={handlePurchaseWithPYUSD}
                  onCrossChainPurchase={handleCrossChainPurchase}
                  contractAddress={contractAddress}
                  contractABI={contractABI}
                  userWallet={account}
                  isWalletConnected={isConnected}
                  nexusReady={nexusReady}
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
                <p className="mt-2 text-gray-500">Try adjusting your filters or search terms</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;