const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract ABI and address
let contractABI, contractAddress;

try {
  const deploymentInfo = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../../contracts/deployment-info.json'), 'utf8')
  );
  contractAddress = deploymentInfo.contractAddress;
  
  const artifactPath = path.join(__dirname, '../../contracts/artifacts/contracts/ReCraft.sol/ReCraft.json');
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  contractABI = artifact.abi;
} catch (error) {
  console.error('Warning: Contract deployment info not found. Some blockchain routes may not work.');
}

// Initialize provider
const getProvider = () => {
  return new ethers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
};

// Get contract instance
const getContract = (signerOrProvider) => {
  if (!contractAddress || !contractABI) {
    throw new Error('Contract not deployed or ABI not found');
  }
  return new ethers.Contract(contractAddress, contractABI, signerOrProvider);
};

// Get contract info
router.get('/contract-info', (req, res) => {
  try {
    if (!contractAddress) {
      return res.status(404).json({ error: 'Contract not deployed' });
    }

    res.json({
      contractAddress,
      network: process.env.NETWORK || 'localhost',
      rpcUrl: process.env.RPC_URL || 'http://localhost:8545'
    });
  } catch (error) {
    console.error('Contract info error:', error);
    res.status(500).json({ error: 'Failed to fetch contract info' });
  }
});

// Get donation from blockchain
router.get('/donations/:blockchainId', async (req, res) => {
  try {
    const provider = getProvider();
    const contract = getContract(provider);

    const donation = await contract.getDonation(req.params.blockchainId);

    res.json({
      id: donation.id.toString(),
      institution: donation.institution,
      materialType: donation.materialType,
      quantity: donation.quantity.toString(),
      status: donation.status,
      ngo: donation.ngo,
      timestamp: new Date(Number(donation.timestamp) * 1000).toISOString()
    });
  } catch (error) {
    console.error('Blockchain donation fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch donation from blockchain', details: error.message });
  }
});

// Get product from blockchain
router.get('/products/:blockchainId', async (req, res) => {
  try {
    const provider = getProvider();
    const contract = getContract(provider);

    const product = await contract.getProduct(req.params.blockchainId);

    res.json({
      id: product.id.toString(),
      donationId: product.donationId.toString(),
      productName: product.productName,
      productType: product.productType,
      price: ethers.formatEther(product.priceETH),
      ngo: product.ngo,
      artisan: product.artisan,
      institution: product.institution,
      sold: product.sold,
      timestamp: new Date(Number(product.timestamp) * 1000).toISOString()
    });
  } catch (error) {
    console.error('Blockchain product fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch product from blockchain', details: error.message });
  }
});

// Get available donations from blockchain
router.get('/donations/available/list', async (req, res) => {
  try {
    const provider = getProvider();
    const contract = getContract(provider);

    const availableIds = await contract.getAvailableDonations();
    
    const donations = await Promise.all(
      availableIds.map(async (id) => {
        const donation = await contract.getDonation(id);
        return {
          id: donation.id.toString(),
          institution: donation.institution,
          materialType: donation.materialType,
          quantity: donation.quantity.toString(),
          status: donation.status,
          timestamp: new Date(Number(donation.timestamp) * 1000).toISOString()
        };
      })
    );

    res.json(donations);
  } catch (error) {
    console.error('Available donations fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch available donations', details: error.message });
  }
});

// Get available products from blockchain
router.get('/products/available/list', async (req, res) => {
  try {
    const provider = getProvider();
    const contract = getContract(provider);

    const availableIds = await contract.getAvailableProducts();
    
    const products = await Promise.all(
      availableIds.map(async (id) => {
        const product = await contract.getProduct(id);
        return {
          id: product.id.toString(),
          donationId: product.donationId.toString(),
          productName: product.productName,
          productType: product.productType,
          price: ethers.formatEther(product.priceETH),
          ngo: product.ngo,
          institution: product.institution,
          sold: product.sold,
          timestamp: new Date(Number(product.timestamp) * 1000).toISOString()
        };
      })
    );

    res.json(products);
  } catch (error) {
    console.error('Available products fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch available products', details: error.message });
  }
});

// Get transaction receipt
router.get('/transaction/:hash', async (req, res) => {
  try {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(req.params.hash);

    if (!receipt) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to,
      status: receipt.status === 1 ? 'success' : 'failed',
      gasUsed: receipt.gasUsed.toString(),
      effectiveGasPrice: ethers.formatUnits(receipt.gasPrice || 0, 'gwei') + ' gwei'
    });
  } catch (error) {
    console.error('Transaction fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction', details: error.message });
  }
});

// Get block explorer link
router.get('/explorer-link/:hash', (req, res) => {
  try {
    const network = process.env.NETWORK || 'localhost';
    let explorerUrl;

    switch (network) {
      case 'sepolia':
        explorerUrl = `https://sepolia.etherscan.io/tx/${req.params.hash}`;
        break;
      case 'polygon':
        explorerUrl = `https://polygonscan.com/tx/${req.params.hash}`;
        break;
      case 'mainnet':
        explorerUrl = `https://etherscan.io/tx/${req.params.hash}`;
        break;
      default:
        explorerUrl = `http://localhost:4000/tx/${req.params.hash}`; // Local Blockscout
    }

    res.json({ explorerUrl });
  } catch (error) {
    console.error('Explorer link error:', error);
    res.status(500).json({ error: 'Failed to generate explorer link' });
  }
});

// Verify wallet signature (for authentication)
router.post('/verify-signature', async (req, res) => {
  try {
    const { message, signature, walletAddress } = req.body;

    const recoveredAddress = ethers.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() === walletAddress.toLowerCase()) {
      res.json({ verified: true, address: recoveredAddress });
    } else {
      res.status(400).json({ verified: false, error: 'Signature verification failed' });
    }
  } catch (error) {
    console.error('Signature verification error:', error);
    res.status(500).json({ error: 'Failed to verify signature', details: error.message });
  }
});

module.exports = router;