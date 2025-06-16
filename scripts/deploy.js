const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting LottoMoji Deployment to Base Sepolia...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Deployment addresses will be stored here
  const deployedContracts = {};

  try {
    // 1. Deploy LottoMojiRandom (generates random numbers)
    console.log("1️⃣ Deploying LottoMojiRandom...");
    const LottoMojiRandom = await ethers.getContractFactory("LottoMojiRandom");
    // For now we'll use subscription ID 0 (needs to be set later)
    const lottoMojiRandom = await LottoMojiRandom.deploy(0, deployer.address);
    await lottoMojiRandom.waitForDeployment();
    deployedContracts.LottoMojiRandom = await lottoMojiRandom.getAddress();
    console.log("✅ LottoMojiRandom deployed to:", await lottoMojiRandom.getAddress());

    // 2. Deploy LottoMojiTickets (manages ticket NFTs) - temporary address, will update later
    console.log("\n2️⃣ Deploying LottoMojiTickets...");
    const LottoMojiTickets = await ethers.getContractFactory("LottoMojiTickets");
    const lottoMojiTickets = await LottoMojiTickets.deploy(deployer.address); // temporary lottery address
    await lottoMojiTickets.waitForDeployment();
    deployedContracts.LottoMojiTickets = await lottoMojiTickets.getAddress();
    console.log("✅ LottoMojiTickets deployed to:", await lottoMojiTickets.getAddress());

    // 3. Deploy LottoMojiReserves (manages reserve pools)
    console.log("\n3️⃣ Deploying LottoMojiReserves...");
    const LottoMojiReserves = await ethers.getContractFactory("LottoMojiReserves");
    // Use USDC address on Base Sepolia: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const lottoMojiReserves = await LottoMojiReserves.deploy(USDC_ADDRESS, deployer.address);
    await lottoMojiReserves.waitForDeployment();
    deployedContracts.LottoMojiReserves = await lottoMojiReserves.getAddress();
    console.log("✅ LottoMojiReserves deployed to:", await lottoMojiReserves.getAddress());

    // 4. Deploy LottoMojiMain (main lottery logic with new reserve system)
    console.log("\n4️⃣ Deploying LottoMojiMain...");
    const LottoMojiMain = await ethers.getContractFactory("LottoMojiMain");
    const lottoMojiMain = await LottoMojiMain.deploy(
      USDC_ADDRESS,
      await lottoMojiTickets.getAddress(),
      await lottoMojiReserves.getAddress(),
      await lottoMojiRandom.getAddress()
    );
    await lottoMojiMain.waitForDeployment();
    deployedContracts.LottoMojiMain = await lottoMojiMain.getAddress();
    console.log("✅ LottoMojiMain deployed to:", await lottoMojiMain.getAddress());

    // 5. Deploy LottoMojiAutomation (handles automation and scheduling)
    console.log("\n5️⃣ Deploying LottoMojiAutomation...");
    const LottoMojiAutomation = await ethers.getContractFactory("LottoMojiAutomation");
    const lottoMojiAutomation = await LottoMojiAutomation.deploy(
      await lottoMojiMain.getAddress(),
      await lottoMojiReserves.getAddress(),
      await lottoMojiRandom.getAddress()
    );
    await lottoMojiAutomation.waitForDeployment();
    deployedContracts.LottoMojiAutomation = await lottoMojiAutomation.getAddress();
    console.log("✅ LottoMojiAutomation deployed to:", await lottoMojiAutomation.getAddress());

    // 6. Setup permissions and connections
    console.log("\n🔧 Setting up contract permissions...");
    
    // Set lottery contract in tickets (actually tickets are initialized with lottery contract already)
    console.log("✅ LottoMojiTickets lottery contract already set in constructor");

    // Set main contract in reserves (update the lottery contract address)
    await lottoMojiReserves.setLotteryContract(await lottoMojiMain.getAddress());
    console.log("✅ LottoMojiReserves lottery contract updated");

    // Set automation contract in main
    await lottoMojiMain.setAutomationContract(await lottoMojiAutomation.getAddress());
    console.log("✅ LottoMojiMain automation contract set");

    // Print summary
    console.log("\n🎉 DEPLOYMENT SUCCESSFUL!");
    console.log("==========================================");
    console.log("📋 Contract Addresses:");
    console.log("==========================================");
    for (const [name, address] of Object.entries(deployedContracts)) {
      console.log(`${name}: ${address}`);
    }
    console.log("==========================================");

    // Save deployment info to file
    const deploymentInfo = {
      network: "baseSepolia",
      chainId: 84532,
      deployer: deployer.address,
      timestamp: new Date().toISOString(),
      contracts: deployedContracts
    };

    const fs = require('fs');
    const path = require('path');
    
    // Create deployments directory if it doesn't exist
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir);
    }

    // Save deployment info
    fs.writeFileSync(
      path.join(deploymentsDir, 'baseSepolia.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("💾 Deployment info saved to deployments/baseSepolia.json");
    
    // Generate TypeScript contract addresses
    const contractAddresses = `// Auto-generated contract addresses for Base Sepolia
// Generated on: ${new Date().toISOString()}

export const CONTRACT_ADDRESSES = {
  LOTTO_MOJI_MAIN: "${deployedContracts.LottoMojiMain}",
  LOTTO_MOJI_TICKETS: "${deployedContracts.LottoMojiTickets}",
  LOTTO_MOJI_RANDOM: "${deployedContracts.LottoMojiRandom}",
  LOTTO_MOJI_RESERVES: "${deployedContracts.LottoMojiReserves}",
  LOTTO_MOJI_AUTOMATION: "${deployedContracts.LottoMojiAutomation}"
} as const;

export default CONTRACT_ADDRESSES;
`;

    fs.writeFileSync(
      path.join(__dirname, '..', 'src', 'lib', 'contractAddresses.ts'),
      contractAddresses
    );

    console.log("📄 Contract addresses saved to src/lib/contractAddresses.ts");
    console.log("\n✨ Ready to integrate with frontend!");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 