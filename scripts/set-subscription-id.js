const { ethers } = require("hardhat");

async function main() {
  console.log("🔗 Actualizando Chainlink VRF Subscription ID...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📋 Actualizando con account:", deployer.address);

  // Dirección del contrato LottoMojiRandom
  const LOTTO_MOJI_RANDOM_ADDRESS = "0x3674D09be633dB84A2943B8386196D3eE9F9DeCc";
  
  // TU SUBSCRIPTION ID
  const VRF_SUBSCRIPTION_ID = "36964112161889945425064710801214207658994639180967117994906698541413525908202";
  
  console.log("📍 Información de VRF:");
  console.log("- LottoMojiRandom:", LOTTO_MOJI_RANDOM_ADDRESS);
  console.log("- Subscription ID:", VRF_SUBSCRIPTION_ID);
  console.log("");

  try {
    // Get contract instance
    const randomContract = await ethers.getContractAt("LottoMojiRandom", LOTTO_MOJI_RANDOM_ADDRESS);
    
    // Verificar subscription ID actual
    const currentSubId = await randomContract.subscriptionId();
    console.log("🔍 Subscription ID actual:", currentSubId.toString());
    
    if (currentSubId.toString() === VRF_SUBSCRIPTION_ID) {
      console.log("✅ Subscription ID ya está configurado correctamente!");
      return;
    }

    // Verificar que somos el owner
    const owner = await randomContract.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ Error: No eres el owner del contrato");
      console.log("   Owner:", owner);
      console.log("   Tu address:", deployer.address);
      return;
    }

    console.log("👑 Confirmado: Eres el owner del contrato");

    // Actualizar subscription ID
    console.log("🔧 Actualizando subscription ID...");
    const tx = await randomContract.setSubscriptionId(VRF_SUBSCRIPTION_ID);
    
    console.log("📤 Transacción enviada. Hash:", tx.hash);
    console.log("⏳ Esperando confirmación...");
    
    await tx.wait();
    
    console.log("✅ Subscription ID actualizado exitosamente!");

    // Verificar actualización
    const newSubId = await randomContract.subscriptionId();
    console.log("🔍 Nuevo subscription ID:", newSubId.toString());

    // Obtener configuración VRF completa
    const vrfConfig = await randomContract.getVRFConfig();
    console.log("\n📋 CONFIGURACIÓN VRF FINAL:");
    console.log("==========================================");
    console.log("🎯 VRF Coordinator:", vrfConfig.coordinator);
    console.log("🔑 Key Hash:", vrfConfig.keyHash);
    console.log("🔗 Subscription ID:", vrfConfig.subId.toString());
    console.log("⛽ Callback Gas Limit:", vrfConfig.callbackGasLimit.toString());
    console.log("✅ Request Confirmations:", vrfConfig.requestConfirmations.toString());
    console.log("🎰 Lottery Contract:", await randomContract.lotteryContract());
    console.log("==========================================");

    console.log("\n🎉 ¡CONFIGURACIÓN VRF COMPLETADA!");
    console.log("\n📝 VERIFICACIONES FINALES:");
    console.log("1. ✅ Subscription ID configurado");
    console.log("2. 🔗 Verifica en https://vrf.chain.link/ que el consumer esté agregado");
    console.log("3. 💰 Asegúrate de que la suscripción tenga LINK suficiente");
    console.log("4. 🧪 El sistema ya puede solicitar números aleatorios");
    
    console.log("\n🚀 ¡Sistema LottoMoji listo para funcionar completamente!");

  } catch (error) {
    console.error("❌ Error al actualizar subscription ID:", error);
    
    if (error.code === 'CALL_EXCEPTION') {
      console.log("\n💡 Posibles causas:");
      console.log("- No eres el owner del contrato");
      console.log("- El subscription ID no es válido");
      console.log("- Problemas de gas o red");
    }
    
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