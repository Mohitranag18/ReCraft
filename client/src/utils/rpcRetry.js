/**
 * RPC Retry Utility
 * Handles rate limiting and retries with exponential backoff
 */

export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Result of the function
 */
export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Check if it's a rate limit error
      const isRateLimit = 
        error.message?.includes('rate limit') ||
        error.code === -32603 ||
        error.message?.includes('429');
      
      if (!isRateLimit || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Rate limited. Retrying in ${delay}ms... (attempt ${i + 1}/${maxRetries})`);
      await sleep(delay);
    }
  }
  
  throw lastError;
};

/**
 * Get provider with fallback RPC
 */
export const getProviderWithFallback = async () => {
  const { ethers } = await import('ethers');
  
  // Try MetaMask first
  if (window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.getNetwork(); // Test connection
      return provider;
    } catch (error) {
      console.warn('MetaMask provider failed, trying fallback RPC');
    }
  }
  
  // Fallback to public RPC
  const fallbackRPCs = [
    'https://rpc.sepolia.org',
    'https://rpc2.sepolia.org',
    'https://ethereum-sepolia.publicnode.com'
  ];
  
  for (const rpc of fallbackRPCs) {
    try {
      const provider = new ethers.JsonRpcProvider(rpc);
      await provider.getNetwork(); // Test connection
      console.log('Using fallback RPC:', rpc);
      return provider;
    } catch (error) {
      console.warn(`RPC ${rpc} failed, trying next...`);
    }
  }
  
  throw new Error('All RPC providers failed');
};

/**
 * Execute transaction with retry logic
 * @param {Function} txFunction - Function that returns a transaction
 * @param {string} description - Description for logging
 * @returns {Promise} Transaction receipt
 */
export const executeTransactionWithRetry = async (txFunction, description = 'Transaction') => {
  console.log(`Executing: ${description}`);
  
  return await retryWithBackoff(async () => {
    const tx = await txFunction();
    console.log(`${description} sent:`, tx.hash);
    
    const receipt = await retryWithBackoff(async () => {
      return await tx.wait();
    }, 5, 2000); // Wait with retries for confirmation
    
    console.log(`${description} confirmed:`, receipt.hash);
    return receipt;
  }, 3, 1000);
};

export default {
  retryWithBackoff,
  getProviderWithFallback,
  executeTransactionWithRetry,
  sleep
};