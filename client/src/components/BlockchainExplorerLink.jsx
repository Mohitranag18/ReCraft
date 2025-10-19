const BlockchainExplorerLink = ({ transactionHash, label = 'View Transaction', network, type = 'tx' }) => {
  // If network not provided, read from environment variable
  const currentNetwork = network || import.meta.env.VITE_NETWORK || 'localhost';
  
  const getExplorerUrl = () => {
    const blockscoutUrl = import.meta.env.VITE_BLOCKSCOUT_URL || 'http://localhost:4000';
    const useBlockscout = import.meta.env.VITE_USE_BLOCKSCOUT === 'true';
    
    switch (currentNetwork.toLowerCase()) {
      case 'sepolia':
        // Use Blockscout for Sepolia if available, otherwise Etherscan
        if (useBlockscout) {
          return `${blockscoutUrl}/${type}/${transactionHash}`;
        }
        return `https://sepolia.etherscan.io/tx/${transactionHash}`;
        
      case 'polygon':
        // Blockscout for Polygon
        if (useBlockscout) {
          return `https://polygon.blockscout.com/${type}/${transactionHash}`;
        }
        return `https://polygonscan.com/tx/${transactionHash}`;
        
      case 'mainnet':
      case 'ethereum':
        // Use Etherscan for mainnet (most users familiar with it)
        return `https://etherscan.io/tx/${transactionHash}`;
        
      case 'arbitrum':
        return `https://arbiscan.io/tx/${transactionHash}`;
        
      case 'optimism':
        return `https://optimistic.etherscan.io/tx/${transactionHash}`;
        
      case 'base':
        return `https://basescan.org/tx/${transactionHash}`;
        
      case 'localhost':
      case 'hardhat':
      default:
        // Local Blockscout instance for development
        return `${blockscoutUrl}/${type}/${transactionHash}`;
    }
  };

  return (
    <a
      href={getExplorerUrl()}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition"
    >
      <svg
        className="w-4 h-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
      <span className="text-sm">{label}</span>
    </a>
  );
};

export default BlockchainExplorerLink;