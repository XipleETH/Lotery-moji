const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Redesplegando LottoMojiRandom con dirección correcta...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Redesplegando con account:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH\n");

  // Direcciones del deployment anterior
  const LOTTO_MOJI_MAIN_ADDRESS = "0x3823B745121DFC7616CC2F3dd15E89e0cb1E7987";
  const OLD_RANDOM_ADDRESS = "0x3E95820Da797FE9fc656B9A10aFc9f9Aaab719c2";
  
  console.log("📍 Información del redespliegue:");
  console.log("- LottoMojiMain (correcto):", LOTTO_MOJI_MAIN_ADDRESS);
  console.log("- LottoMojiRandom (anterior):", OLD_RANDOM_ADDRESS);
  console.log("");

  try {
    // Deploy nuevo LottoMojiRandom con la dirección correcta
    console.log("🚀 Desplegando nuevo LottoMojiRandom...");
    const LottoMojiRandom = await ethers.getContractFactory("LottoMojiRandom");
    
    // Usar subscription ID 0 por ahora (se configurará después)
    const lottoMojiRandom = await LottoMojiRandom.deploy(0, LOTTO_MOJI_MAIN_ADDRESS);
    await lottoMojiRandom.waitForDeployment();
    
    const newRandomAddress = await lottoMojiRandom.getAddress();
    console.log("✅ Nuevo LottoMojiRandom desplegado en:", newRandomAddress);

    // Verificar que se configuró correctamente
    const lotteryContract = await lottoMojiRandom.lotteryContract();
    console.log("🔍 Lottery contract configurado:", lotteryContract);
    
    if (lotteryContract.toLowerCase() === LOTTO_MOJI_MAIN_ADDRESS.toLowerCase()) {
      console.log("✅ ¡Configuración correcta!");
    } else {
      console.log("❌ Error en la configuración");
      return;
    }

    // Actualizar el archivo de deployment
    const fs = require('fs');
    const path = require('path');
    
    const deploymentFile = path.join(__dirname, '..', 'deployments', 'baseSepolia.json');
    
    if (fs.existsSync(deploymentFile)) {
      const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
      
      // Actualizar la dirección de LottoMojiRandom
      deploymentInfo.contracts.LottoMojiRandom = newRandomAddress;
      deploymentInfo.timestamp = new Date().toISOString();
      deploymentInfo.notes = "LottoMojiRandom redesplegado con dirección correcta de LottoMojiMain";
      
      // Guardar archivo actualizado
      fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
      console.log("💾 Archivo de deployment actualizado");
    }

    // Actualizar contractAddresses.ts
    const contractAddresses = `// Auto-generated contract addresses for Base Sepolia
// Generated on: ${new Date().toISOString()}
// LottoMojiRandom redesplegado con dirección correcta

export const CONTRACT_ADDRESSES = {
  LOTTO_MOJI_MAIN: "${LOTTO_MOJI_MAIN_ADDRESS}",
  LOTTO_MOJI_TICKETS: "0x96303188b9e09f6F8b55685f51273c57DD2a8f79",
  LOTTO_MOJI_RANDOM: "${newRandomAddress}",
  LOTTO_MOJI_RESERVES: "0x765A3071f14BDD5272e6Cc83BE7fa059F472a77F",
  LOTTO_MOJI_AUTOMATION: "0x311b8Aec021a78c3291005A5ee58727e080Fe94b"
} as const;

export default CONTRACT_ADDRESSES;
`;

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

    console.log("📄 contractAddresses.ts actualizado");

    // Resumen final
    console.log("\n🎉 ¡REDESPLIEGUE EXITOSO!");
    console.log("==========================================");
    console.log("📋 Direcciones FINALES Actualizadas:");
    console.log("==========================================");
    console.log("LottoMojiMain:", LOTTO_MOJI_MAIN_ADDRESS);
    console.log("LottoMojiTickets: 0x96303188b9e09f6F8b55685f51273c57DD2a8f79");
    console.log("LottoMojiRandom:", newRandomAddress, "🆕 ACTUALIZADO");
    console.log("LottoMojiReserves: 0x765A3071f14BDD5272e6Cc83BE7fa059F472a77F");
    console.log("LottoMojiAutomation: 0x311b8Aec021a78c3291005A5ee58727e080Fe94b");
    console.log("==========================================");
    
    console.log("\n📝 PRÓXIMOS PASOS:");
    console.log("1. ✅ Todos los contratos desplegados correctamente");
    console.log("2. 🔗 Configurar Chainlink VRF subscription para:", newRandomAddress);
    console.log("3. 🔍 Verificar contratos en Basescan");
    console.log("4. 🚀 Integrar con el frontend");
    console.log("\n✨ ¡Sistema LottoMoji completamente desplegado!");

  } catch (error) {
    console.error("❌ Redespliegue falló:", error);
    process.exit(1);
  }
}

// Run the redeployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 