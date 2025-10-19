const hre = require("hardhat");

async function main() {
  console.log("Deploying ReCraft contract with PYUSD support...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Platform wallet (in production, use a dedicated wallet)
  const platformWallet = deployer.address;
  
  // PYUSD Token Address
  // For local testing, deploy a mock ERC20 token or use zero address
  // For Ethereum Mainnet: 0x6c3ea9036406852006290770BEdFcAbA0e23A0e8
  // For Ethereum Sepolia: 0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
  const pyusdAddress = process.env.PYUSD_TOKEN_ADDRESS || hre.ethers.ZeroAddress;
  
  console.log("PYUSD Token Address:", pyusdAddress);
  
  if (pyusdAddress === hre.ethers.ZeroAddress) {
    console.log("⚠️  Warning: PYUSD address not set. PYUSD payments will not work.");
    console.log("   Set PYUSD_TOKEN_ADDRESS in .env for production.");
  }

  // Deploy the contract
  const ReCraft = await hre.ethers.getContractFactory("ReCraft");
  const reCraft = await ReCraft.deploy(platformWallet, pyusdAddress);

  await reCraft.waitForDeployment();

  const contractAddress = await reCraft.getAddress();

  console.log("✅ ReCraft contract deployed to:", contractAddress);
  console.log("   Platform wallet:", platformWallet);
  console.log("   PYUSD token:", pyusdAddress);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    platformWallet: platformWallet,
    pyusdTokenAddress: pyusdAddress,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  fs.writeFileSync(
    "./deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n✅ Deployment info saved to deployment-info.json");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n📝 To verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} ${platformWallet} ${pyusdAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });