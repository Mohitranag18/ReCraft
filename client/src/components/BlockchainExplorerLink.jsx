const BlockchainExplorerLink = ({ transactionHash, label = 'View Transaction', network = 'localhost' }) => {
  const getExplorerUrl = () => {
    switch (network.toLowerCase()) {
      case 'sepolia':
        return `https://sepolia.etherscan.io/tx/${transactionHash}`;
      case 'polygon':
        return `https://polygonscan.com/tx/${transactionHash}`;
      case 'mainnet':
      case 'ethereum':
        return `https://etherscan.io/tx/${transactionHash}`;
      case 'localhost':
      case 'hardhat':
      default:
        // Mock Blockscout instance for local development
        return `http://localhost:4000/tx/${transactionHash}`;
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