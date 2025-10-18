const hre = require("hardhat");

async function main() {
  console.log("Deploying ReCraft contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  // Set platform wallet (in production, use a dedicated wallet)
  const platformWallet = deployer.address;

  // Deploy the contract
  const ReCraft = await hre.ethers.getContractFactory("ReCraft");
  const reCraft = await ReCraft.deploy(platformWallet);

  await reCraft.waitForDeployment();

  const contractAddress = await reCraft.getAddress();

  console.log("ReCraft contract deployed to:", contractAddress);
  console.log("Platform wallet set to:", platformWallet);

  // Save deployment info
  const fs = require("fs");
  const deploymentInfo = {
    contractAddress: contractAddress,
    platformWallet: platformWallet,
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  fs.writeFileSync(
    "./deployment-info.json",
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\nDeployment info saved to deployment-info.json");

  // Verification instructions
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\nTo verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} ${platformWallet}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });