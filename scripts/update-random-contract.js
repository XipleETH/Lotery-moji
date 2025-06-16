const { ethers } = require("hardhat");

async function main() {
  console.log("🔄 Actualizando LottoMojiRandom contract...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Actualizando con account:", deployer.address);

  try {
    // Read deployment info
    const fs = require('fs');
    const path = require('path');
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    const deploymentFile = path.join(deploymentsDir, 'baseSepolia.json');
    
    if (!fs.existsSync(deploymentFile)) {
      throw new Error("No se encontró el archivo de deployment. Ejecuta primero deploy-remaining.js");
    }

    const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    const contracts = deploymentInfo.contracts;

    console.log("📍 Direcciones de contratos encontradas:");
    console.log("- LottoMojiRandom:", contracts.LottoMojiRandom);
    console.log("- LottoMojiMain:", contracts.LottoMojiMain);
    console.log("");

    // Get LottoMojiRandom contract instance
    const randomContract = await ethers.getContractAt("LottoMojiRandom", contracts.LottoMojiRandom);

    // Check current lottery contract
    const currentLottery = await randomContract.lotteryContract();
    console.log("🔍 Lottery contract actual:", currentLottery);
    
    if (currentLottery.toLowerCase() === contracts.LottoMojiMain.toLowerCase()) {
      console.log("✅ LottoMojiRandom ya está configurado correctamente!");
      return;
    }

    console.log("🔧 Actualizando lottery contract en LottoMojiRandom...");
    
    // NOTE: LottoMojiRandom has immutable lotteryContract, so we can't change it
    // We need to inform the user to deploy a new LottoMojiRandom or use a different approach
    console.log("❌ ERROR: lotteryContract es inmutable en LottoMojiRandom");
    console.log("");
    console.log("⚠️  SOLUCIÓN: Necesitas desplegar un nuevo LottoMojiRandom con la dirección correcta");
    console.log("   o modificar el contrato para que no sea inmutable.");
    console.log("");
    console.log("🔧 OPCIONES:");
    console.log("1. Redesplegar LottoMojiRandom con la dirección de LottoMojiMain");
    console.log("2. Modificar LottoMojiRandom para permitir cambiar lotteryContract");
    console.log("");
    console.log("Dirección que debería usar:", contracts.LottoMojiMain);

  } catch (error) {
    console.error("❌ Error al actualizar:", error);
    process.exit(1);
  }
}

// Run the update
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 