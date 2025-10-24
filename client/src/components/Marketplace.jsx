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
      filtered = filtered.filter(p => p.priceETH >= parseFloat(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.priceETH <= parseFloat(filters.maxPrice));
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

      const priceInWei = ethers.parseEther(product.priceETH.toString());

      console.log('💳 Purchasing with ETH...');
      console.log('Product:', product.productName);
      console.log('Price:', product.priceETH, 'ETH');
      
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

      const priceInPYUSD = ethers.parseUnits(product.pricePYUSD.toString(), 6);
      
      console.log('💵 Purchasing with PYUSD...');
      console.log('Product ETH price:', product.priceETH);
      console.log('Product PYUSD price:', product.pricePYUSD);
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
      let totalRevenueAmount;
      if (method === 'PYUSD') {
        totalRevenueAmount = product.pricePYUSD;
      } else { // ETH or CROSS_CHAIN_ETH
        totalRevenueAmount = product.priceETH;
      }

      // The backend will now calculate revenue shares based on the totalRevenueAmount
      await axios.patch(`http://localhost:5000/api/products/${product._id}/purchase`, {
        buyerWallet: account,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        paymentMethod: method
      });

      console.log('✅ Backend updated after purchase');
    } catch (error) {
      console.error('⚠️ Failed to update backend:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800/50 py-16 border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-5xl font-extrabold mb-3 text-white">
                Marketplace
              </h1>
              <p className="text-lg text-gray-300">
                Discover sustainable home décor crafted from recycled materials.
              </p>
            </div>
            
            {/* Wallet Connection */}
            <div className="flex flex-col items-start md:items-end gap-3">
              <ConnectKitButton />
              
              {isConnected && (
                <div className="flex items-center gap-2">
                  {nexusReady ? (
                    <span className="text-sm bg-green-900/50 border border-green-500/30 text-green-300 px-3 py-1.5 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      Nexus Ready
                    </span>
                  ) : (
                    <span className="text-sm bg-yellow-900/50 border border-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded-full flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                      Initializing...
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
            />
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
            >
              <option className='bg-gray-900' value="">All Types</option>
              <option className='bg-gray-900' value="decor">Décor</option>
              <option className='bg-gray-900' value="frame">Frame</option>
              <option className='bg-gray-900' value="lamp">Lamp</option>
              <option className='bg-gray-900' value="basket">Basket</option>
              <option className='bg-gray-900' value="coaster">Coaster</option>
              <option className='bg-gray-900' value="notebook">Notebook</option>
              <option className='bg-gray-900' value="gift-box">Gift Box</option>
              <option className='bg-gray-900' value="other">Other</option>
            </select>
            <input
              type="number"
              placeholder="Min Price (ETH)"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
              step="0.001"
            />
            <input
              type="number"
              placeholder="Max Price (ETH)"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white"
              step="0.001"
            />
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading products...</div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'} Found
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
              <div className="text-center py-20 text-gray-500">
                <p>No products found. Try adjusting your filters.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
