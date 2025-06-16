const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Verificando configuración VRF actual...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Consultando con account:", deployer.address);

  // Dirección del contrato LottoMojiRandom
  const LOTTO_MOJI_RANDOM_ADDRESS = "0x3674D09be633dB84A2943B8386196D3eE9F9DeCc";
  
  console.log("📍 Contrato LottoMojiRandom:", LOTTO_MOJI_RANDOM_ADDRESS);
  console.log("");

  try {
    // Get contract instance
    const randomContract = await ethers.getContractAt("LottoMojiRandom", LOTTO_MOJI_RANDOM_ADDRESS);
    
    console.log("📋 CONFIGURACIÓN VRF ACTUAL:");
    console.log("==========================================");
    
    // Obtener subscription ID actual
    const currentSubId = await randomContract.subscriptionId();
    console.log("🔗 Subscription ID:", currentSubId.toString());
    
    // Obtener configuración VRF completa
    const vrfConfig = await randomContract.getVRFConfig();
    console.log("🎯 VRF Coordinator:", vrfConfig.coordinator);
    console.log("🔑 Key Hash:", vrfConfig.keyHash);
    console.log("⛽ Callback Gas Limit:", vrfConfig.callbackGasLimit.toString());
    console.log("✅ Request Confirmations:", vrfConfig.requestConfirmations.toString());
    
    // Obtener lottery contract
    const lotteryContract = await randomContract.lotteryContract();
    console.log("🎰 Lottery Contract:", lotteryContract);
    
    // Obtener owner
    const owner = await randomContract.owner();
    console.log("👑 Owner:", owner);
    
    console.log("==========================================");
    
    // Verificar estado
    if (currentSubId.toString() === "0") {
      console.log("\n⚠️  SUBSCRIPTION ID NO CONFIGURADO");
      console.log("📝 PASOS NECESARIOS:");
      console.log("1. 🌐 Ve a https://vrf.chain.link/");
      console.log("2. 🔗 Conéctate a Base Sepolia");
      console.log("3. ➕ Crea una nueva suscripción VRF");
      console.log("4. 🎯 Agrega como consumer:", LOTTO_MOJI_RANDOM_ADDRESS);
      console.log("5. 💰 Financia la suscripción con LINK tokens");
      console.log("6. 🔧 Actualiza el subscription ID en el contrato");
    } else {
      console.log("\n✅ SUBSCRIPTION ID CONFIGURADO:", currentSubId.toString());
      console.log("📝 VERIFICAR:");
      console.log("1. 🔗 Que el contrato esté agregado como consumer en https://vrf.chain.link/");
      console.log("2. 💰 Que la suscripción tenga suficientes LINK tokens");
      console.log("3. 🧪 Probar solicitando números aleatorios");
    }
    
    // Verificar si es el owner
    if (owner.toLowerCase() === deployer.address.toLowerCase()) {
      console.log("\n👑 Eres el owner del contrato - puedes actualizar configuración");
    } else {
      console.log("\n⚠️  No eres el owner del contrato");
      console.log("   Owner actual:", owner);
      console.log("   Tu address:", deployer.address);
    }

  } catch (error) {
    console.error("❌ Error al consultar configuración:", error);
    
    if (error.code === 'CALL_EXCEPTION') {
      console.log("\n💡 Posibles causas:");
      console.log("- El contrato no está desplegado en esta red");
      console.log("- La dirección del contrato es incorrecta");
      console.log("- Problemas de conectividad con la red");
    }
    
    process.exit(1);
  }
}

// Run the check
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 