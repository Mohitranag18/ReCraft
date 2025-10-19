import { ethers } from 'ethers';

const SEPOLIA_CHAIN_ID = '0xaa36a7'; // 11155111
const SEPOLIA_RPC_URL = 'https://rpc.sepolia.org';
const SEPOLIA_NETWORK_NAME = 'Sepolia Testnet';

export const switchToSepolia = async () => {
  if (!window.ethereum) {
    alert('Please install MetaMask!');
    return null;
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask.
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: SEPOLIA_CHAIN_ID,
              chainName: SEPOLIA_NETWORK_NAME,
              rpcUrls: [SEPOLIA_RPC_URL],
            },
          ],
        });
      } catch (addError) {
        console.error('Failed to add Sepolia network:', addError);
        alert('Failed to add Sepolia network. Please add it manually.');
        return null;
      }
    } else {
      console.error('Failed to switch to Sepolia network:', switchError);
      alert('Failed to switch to Sepolia network. Please switch manually.');
      return null;
    }
  }

  return new ethers.BrowserProvider(window.ethereum);
};
