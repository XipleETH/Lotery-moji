const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Desplegando contratos restantes de LottoMoji en Base Sepolia (VERSIÓN CORREGIDA)...\n");

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
    // PASO 1: Calcular direcciones futuras usando CREATE2 o estimación
    console.log("🔮 Calculando direcciones futuras de contratos...");
    
    // Para simplificar, vamos a desplegar en orden y usar direcciones temporales
    // Luego redesplegaremos los que necesiten las direcciones correctas

    // 1. Deploy LottoMojiTickets con dirección temporal
    console.log("\n1️⃣ Desplegando LottoMojiTickets (temporal)...");
    const LottoMojiTickets = await ethers.getContractFactory("LottoMojiTickets");
    const lottoMojiTickets = await LottoMojiTickets.deploy(deployer.address); // temporal
    await lottoMojiTickets.waitForDeployment();
    const ticketsAddress = await lottoMojiTickets.getAddress();
    deployedContracts.LottoMojiTickets = ticketsAddress;
    console.log("✅ LottoMojiTickets desplegado en:", ticketsAddress);

    // 2. Deploy LottoMojiReserves con dirección temporal
    console.log("\n2️⃣ Desplegando LottoMojiReserves (temporal)...");
    const LottoMojiReserves = await ethers.getContractFactory("LottoMojiReserves");
    const lottoMojiReserves = await LottoMojiReserves.deploy(USDC_ADDRESS, deployer.address); // temporal
    await lottoMojiReserves.waitForDeployment();
    const reservesAddress = await lottoMojiReserves.getAddress();
    deployedContracts.LottoMojiReserves = reservesAddress;
    console.log("✅ LottoMojiReserves desplegado en:", reservesAddress);

    // 3. Deploy LottoMojiMain con las direcciones correctas
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
    deployedContracts.LottoMojiMain = mainAddress;
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
    deployedContracts.LottoMojiAutomation = automationAddress;
    console.log("✅ LottoMojiAutomation desplegado en:", automationAddress);

    // 5. REDESPLEGAR contratos que necesitan direcciones correctas
    console.log("\n🔄 REDESPLEGANDO contratos con direcciones correctas...");
    
    // Redesplegar LottoMojiTickets con la dirección correcta de LottoMojiMain
    console.log("\n5️⃣ Redesplegando LottoMojiTickets con dirección correcta...");
    const lottoMojiTicketsCorrect = await LottoMojiTickets.deploy(mainAddress);
    await lottoMojiTicketsCorrect.waitForDeployment();
    const ticketsCorrectAddress = await lottoMojiTicketsCorrect.getAddress();
    deployedContracts.LottoMojiTickets = ticketsCorrectAddress;
    console.log("✅ LottoMojiTickets redesplegado en:", ticketsCorrectAddress);

    // Redesplegar LottoMojiReserves con la dirección correcta de LottoMojiMain
    console.log("\n6️⃣ Redesplegando LottoMojiReserves con dirección correcta...");
    const lottoMojiReservesCorrect = await LottoMojiReserves.deploy(USDC_ADDRESS, mainAddress);
    await lottoMojiReservesCorrect.waitForDeployment();
    const reservesCorrectAddress = await lottoMojiReservesCorrect.getAddress();
    deployedContracts.LottoMojiReserves = reservesCorrectAddress;
    console.log("✅ LottoMojiReserves redesplegado en:", reservesCorrectAddress);

    // 6. REDESPLEGAR LottoMojiMain con las nuevas direcciones correctas
    console.log("\n7️⃣ Redesplegando LottoMojiMain con direcciones finales...");
    const lottoMojiMainFinal = await LottoMojiMain.deploy(
      USDC_ADDRESS,
      ticketsCorrectAddress,
      reservesCorrectAddress,
      LOTTO_MOJI_RANDOM_ADDRESS
    );
    await lottoMojiMainFinal.waitForDeployment();
    const mainFinalAddress = await lottoMojiMainFinal.getAddress();
    deployedContracts.LottoMojiMain = mainFinalAddress;
    console.log("✅ LottoMojiMain redesplegado en:", mainFinalAddress);

    // 7. REDESPLEGAR LottoMojiAutomation con la dirección final
    console.log("\n8️⃣ Redesplegando LottoMojiAutomation con direcciones finales...");
    const lottoMojiAutomationFinal = await LottoMojiAutomation.deploy(
      mainFinalAddress,
      reservesCorrectAddress,
      LOTTO_MOJI_RANDOM_ADDRESS
    );
    await lottoMojiAutomationFinal.waitForDeployment();
    const automationFinalAddress = await lottoMojiAutomationFinal.getAddress();
    deployedContracts.LottoMojiAutomation = automationFinalAddress;
    console.log("✅ LottoMojiAutomation redesplegado en:", automationFinalAddress);

    // 8. Configurar automation contract en main
    console.log("\n🔧 Configurando automation contract en LottoMojiMain...");
    await lottoMojiMainFinal.setAutomationContract(automationFinalAddress);
    console.log("✅ LottoMojiMain: automation contract configurado");

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

    console.log("📄 Direcciones de contratos guardadas en src/lib/contractAddresses.ts");
    
    console.log("\n📝 PASOS FINALES REQUERIDOS:");
    console.log("1. ⚠️  IMPORTANTE: LottoMojiRandom necesita ser redesplegado");
    console.log("   Dirección actual:", LOTTO_MOJI_RANDOM_ADDRESS);
    console.log("   Debe usar como lottery contract:", mainFinalAddress);
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