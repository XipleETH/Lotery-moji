const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Desplegando contratos restantes de LottoMoji en Base Sepolia...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Direcciones existentes
  const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
  const LOTTO_MOJI_RANDOM_ADDRESS = "0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2";
  
  console.log("📍 Direcciones existentes:");
  console.log("- USDC:", USDC_ADDRESS);
  console.log("- LottoMojiRandom:", LOTTO_MOJI_RANDOM_ADDRESS);
  console.log("");

  // Deployment addresses will be stored here
  const deployedContracts = {
    LottoMojiRandom: LOTTO_MOJI_RANDOM_ADDRESS // Ya desplegado
  };

  try {
    // 1. Deploy LottoMojiTickets (manages ticket NFTs)
    console.log("1️⃣ Desplegando LottoMojiTickets...");
    const LottoMojiTickets = await ethers.getContractFactory("LottoMojiTickets");
    const lottoMojiTickets = await LottoMojiTickets.deploy(deployer.address); // temporary lottery address
    await lottoMojiTickets.waitForDeployment();
    deployedContracts.LottoMojiTickets = await lottoMojiTickets.getAddress();
    console.log("✅ LottoMojiTickets desplegado en:", await lottoMojiTickets.getAddress());

    // 2. Deploy LottoMojiReserves (manages reserve pools)
    console.log("\n2️⃣ Desplegando LottoMojiReserves...");
    const LottoMojiReserves = await ethers.getContractFactory("LottoMojiReserves");
    const lottoMojiReserves = await LottoMojiReserves.deploy(USDC_ADDRESS, deployer.address);
    await lottoMojiReserves.waitForDeployment();
    deployedContracts.LottoMojiReserves = await lottoMojiReserves.getAddress();
    console.log("✅ LottoMojiReserves desplegado en:", await lottoMojiReserves.getAddress());

    // 3. Deploy LottoMojiMain (main lottery logic with new reserve system)
    console.log("\n3️⃣ Desplegando LottoMojiMain...");
    const LottoMojiMain = await ethers.getContractFactory("LottoMojiMain");
    const lottoMojiMain = await LottoMojiMain.deploy(
      USDC_ADDRESS,
      await lottoMojiTickets.getAddress(),
      await lottoMojiReserves.getAddress(),
      LOTTO_MOJI_RANDOM_ADDRESS
    );
    await lottoMojiMain.waitForDeployment();
    deployedContracts.LottoMojiMain = await lottoMojiMain.getAddress();
    console.log("✅ LottoMojiMain desplegado en:", await lottoMojiMain.getAddress());

    // 4. Deploy LottoMojiAutomation (handles automation and scheduling)
    console.log("\n4️⃣ Desplegando LottoMojiAutomation...");
    const LottoMojiAutomation = await ethers.getContractFactory("LottoMojiAutomation");
    const lottoMojiAutomation = await LottoMojiAutomation.deploy(
      await lottoMojiMain.getAddress(),
      await lottoMojiReserves.getAddress(),
      LOTTO_MOJI_RANDOM_ADDRESS
    );
    await lottoMojiAutomation.waitForDeployment();
    deployedContracts.LottoMojiAutomation = await lottoMojiAutomation.getAddress();
    console.log("✅ LottoMojiAutomation desplegado en:", await lottoMojiAutomation.getAddress());

    // 5. Setup permissions and connections
    console.log("\n🔧 Configurando permisos de contratos...");
    
    // Set lottery contract in reserves
    await lottoMojiReserves.setLotteryContract(await lottoMojiMain.getAddress());
    console.log("✅ LottoMojiReserves: lottery contract actualizado");

    // Set automation contract in main
    await lottoMojiMain.setAutomationContract(await lottoMojiAutomation.getAddress());
    console.log("✅ LottoMojiMain: automation contract configurado");

    // Update LottoMojiRandom to use the new main contract
    console.log("\n🔄 Actualizando LottoMojiRandom...");
    const randomContract = await ethers.getContractAt("LottoMojiRandom", LOTTO_MOJI_RANDOM_ADDRESS);
    console.log("⚠️  NOTA: LottoMojiRandom necesita actualizar su lottery contract manualmente");
    console.log("   Ejecuta: randomContract.setLotteryContract('" + await lottoMojiMain.getAddress() + "')");

    // Print summary
    console.log("\n🎉 ¡DEPLOYMENT EXITOSO!");
    console.log("==========================================");
    console.log("📋 Direcciones de Contratos:");
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

    console.log("💾 Información de deployment guardada en deployments/baseSepolia.json");
    
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

    console.log("📄 Direcciones de contratos guardadas en src/lib/contractAddresses.ts");
    
    console.log("\n📝 PASOS FINALES REQUERIDOS:");
    console.log("1. Actualizar LottoMojiRandom lottery contract:");
    console.log("   npx hardhat run scripts/update-random-contract.js --network baseSepolia");
    console.log("2. Verificar contratos en Basescan");
    console.log("3. Configurar Chainlink VRF subscription");
    console.log("\n✨ ¡Listo para integrar con el frontend!");

  } catch (error) {
    console.error("❌ Deployment falló:", error);
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