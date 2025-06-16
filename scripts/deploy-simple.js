const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Desplegando contratos LottoMoji en Base Sepolia (VERSIÓN SIMPLIFICADA)...\n");

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
    // 1. Deploy LottoMojiTickets con dirección temporal
    console.log("1️⃣ Desplegando LottoMojiTickets...");
    const LottoMojiTickets = await ethers.getContractFactory("LottoMojiTickets");
    const lottoMojiTickets = await LottoMojiTickets.deploy(deployer.address); // temporal
    await lottoMojiTickets.waitForDeployment();
    const ticketsAddress = await lottoMojiTickets.getAddress();
    console.log("✅ LottoMojiTickets desplegado en:", ticketsAddress);

    // 2. Deploy LottoMojiReserves con dirección temporal
    console.log("\n2️⃣ Desplegando LottoMojiReserves...");
    const LottoMojiReserves = await ethers.getContractFactory("LottoMojiReserves");
    const lottoMojiReserves = await LottoMojiReserves.deploy(USDC_ADDRESS, deployer.address); // temporal
    await lottoMojiReserves.waitForDeployment();
    const reservesAddress = await lottoMojiReserves.getAddress();
    console.log("✅ LottoMojiReserves desplegado en:", reservesAddress);

    // 3. Deploy LottoMojiMain con las direcciones temporales
    console.log("\n3️⃣ Desplegando LottoMojiMain...");
    const LottoMojiMain = await ethers.getContractFactory("LottoMojiMain");
    const lottoMojiMain = await LottoMojiMain.deploy(
      USDC_ADDRESS,
      ticketsAddress,
      reservesAddress,
      LOTTO_MOJI_RANDOM_ADDRESS
    );
    await lottoMojiMain.waitForDeployment();
    const mainAddress = await lottoMojiMain.getAddress();
    console.log("✅ LottoMojiMain desplegado en:", mainAddress);

    // 4. Deploy LottoMojiAutomation
    console.log("\n4️⃣ Desplegando LottoMojiAutomation...");
    const LottoMojiAutomation = await ethers.getContractFactory("LottoMojiAutomation");
    const lottoMojiAutomation = await LottoMojiAutomation.deploy(
      mainAddress,
      reservesAddress,
      LOTTO_MOJI_RANDOM_ADDRESS
    );
    await lottoMojiAutomation.waitForDeployment();
    const automationAddress = await lottoMojiAutomation.getAddress();
    console.log("✅ LottoMojiAutomation desplegado en:", automationAddress);

    // 5. REDESPLEGAR con direcciones correctas
    console.log("\n🔄 REDESPLEGANDO con direcciones correctas...");
    
    // Redesplegar LottoMojiTickets con la dirección correcta
    console.log("\n5️⃣ Redesplegando LottoMojiTickets...");
    const lottoMojiTicketsFinal = await LottoMojiTickets.deploy(mainAddress);
    await lottoMojiTicketsFinal.waitForDeployment();
    const ticketsFinalAddress = await lottoMojiTicketsFinal.getAddress();
    console.log("✅ LottoMojiTickets final:", ticketsFinalAddress);

    // Redesplegar LottoMojiReserves con la dirección correcta
    console.log("\n6️⃣ Redesplegando LottoMojiReserves...");
    const lottoMojiReservesFinal = await LottoMojiReserves.deploy(USDC_ADDRESS, mainAddress);
    await lottoMojiReservesFinal.waitForDeployment();
    const reservesFinalAddress = await lottoMojiReservesFinal.getAddress();
    console.log("✅ LottoMojiReserves final:", reservesFinalAddress);

    // Redesplegar LottoMojiMain con direcciones finales
    console.log("\n7️⃣ Redesplegando LottoMojiMain final...");
    const lottoMojiMainFinal = await LottoMojiMain.deploy(
      USDC_ADDRESS,
      ticketsFinalAddress,
      reservesFinalAddress,
      LOTTO_MOJI_RANDOM_ADDRESS
    );
    await lottoMojiMainFinal.waitForDeployment();
    const mainFinalAddress = await lottoMojiMainFinal.getAddress();
    console.log("✅ LottoMojiMain final:", mainFinalAddress);

    // Redesplegar LottoMojiAutomation con direcciones finales
    console.log("\n8️⃣ Redesplegando LottoMojiAutomation final...");
    const lottoMojiAutomationFinal = await LottoMojiAutomation.deploy(
      mainFinalAddress,
      reservesFinalAddress,
      LOTTO_MOJI_RANDOM_ADDRESS
    );
    await lottoMojiAutomationFinal.waitForDeployment();
    const automationFinalAddress = await lottoMojiAutomationFinal.getAddress();
    console.log("✅ LottoMojiAutomation final:", automationFinalAddress);

    // Actualizar direcciones finales
    deployedContracts.LottoMojiTickets = ticketsFinalAddress;
    deployedContracts.LottoMojiReserves = reservesFinalAddress;
    deployedContracts.LottoMojiMain = mainFinalAddress;
    deployedContracts.LottoMojiAutomation = automationFinalAddress;

    // Print summary
    console.log("\n🎉 ¡DEPLOYMENT EXITOSO!");
    console.log("==========================================");
    console.log("📋 Direcciones FINALES de Contratos:");
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

    // Create src/lib directory if it doesn't exist
    const srcLibDir = path.join(__dirname, '..', 'src', 'lib');
    if (!fs.existsSync(path.join(__dirname, '..', 'src'))) {
      fs.mkdirSync(path.join(__dirname, '..', 'src'));
    }
    if (!fs.existsSync(srcLibDir)) {
      fs.mkdirSync(srcLibDir);
    }

    fs.writeFileSync(
      path.join(srcLibDir, 'contractAddresses.ts'),
      contractAddresses
    );

    console.log("📄 Direcciones guardadas en src/lib/contractAddresses.ts");
    
    console.log("\n📝 PASOS FINALES:");
    console.log("1. ⚠️  LottoMojiRandom necesita ser redesplegado con:");
    console.log("   Lottery contract:", mainFinalAddress);
    console.log("2. Verificar contratos en Basescan");
    console.log("3. Configurar Chainlink VRF subscription");
    console.log("\n✨ ¡Deployment completado exitosamente!");

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