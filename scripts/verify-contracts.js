const { run } = require("hardhat");

async function main() {
    console.log("🔍 Verificando contratos en Basescan...\n");

    // Direcciones desplegadas
    const contracts = {
        LottoMojiRandom: "0x3674D09be633dB84A2943B8386196D3eE9F9DeCc",
        LottoMojiTickets: "0x96303188b9e09f6F8b55685f51273c57DD2a8f79", 
        LottoMojiReserves: "0x765A3071f14BDD5272e6Cc83BE7fa059F472a77F",
        LottoMojiMain: "0x3823B745121DFC7616CC2F3dd15E89e0cb1E7987",
        LottoMojiAutomation: "0x311b8Aec021a78c3291005A5ee58727e080Fe94b"
    };

    try {
        // Verificar LottoMojiAutomation (el que necesitas para Chainlink)
        console.log("1️⃣ Verificando LottoMojiAutomation...");
        await run("verify:verify", {
            address: contracts.LottoMojiAutomation,
            constructorArguments: [
                contracts.LottoMojiMain,      // _lotteryContract
                contracts.LottoMojiReserves,  // _reserveContract  
                contracts.LottoMojiRandom     // _randomContract
            ],
        });
        console.log("✅ LottoMojiAutomation verificado");

        // Verificar LottoMojiMain
        console.log("\n2️⃣ Verificando LottoMojiMain...");
        await run("verify:verify", {
            address: contracts.LottoMojiMain,
            constructorArguments: [
                "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC
                contracts.LottoMojiTickets,
                contracts.LottoMojiReserves,
                contracts.LottoMojiRandom
            ],
        });
        console.log("✅ LottoMojiMain verificado");

        // Verificar LottoMojiTickets
        console.log("\n3️⃣ Verificando LottoMojiTickets...");
        await run("verify:verify", {
            address: contracts.LottoMojiTickets,
            constructorArguments: [
                contracts.LottoMojiMain
            ],
        });
        console.log("✅ LottoMojiTickets verificado");

        // Verificar LottoMojiReserves
        console.log("\n4️⃣ Verificando LottoMojiReserves...");
        await run("verify:verify", {
            address: contracts.LottoMojiReserves,
            constructorArguments: [
                "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC
                contracts.LottoMojiMain
            ],
        });
        console.log("✅ LottoMojiReserves verificado");

        // Verificar LottoMojiRandom
        console.log("\n5️⃣ Verificando LottoMojiRandom...");
        await run("verify:verify", {
            address: contracts.LottoMojiRandom,
            constructorArguments: [
                contracts.LottoMojiMain
            ],
        });
        console.log("✅ LottoMojiRandom verificado");

        console.log("\n🎉 ¡Todos los contratos verificados exitosamente!");
        console.log("\n📋 URLs de Basescan:");
        console.log(`LottoMojiAutomation: https://sepolia.basescan.org/address/${contracts.LottoMojiAutomation}`);
        console.log(`LottoMojiMain: https://sepolia.basescan.org/address/${contracts.LottoMojiMain}`);
        console.log(`LottoMojiTickets: https://sepolia.basescan.org/address/${contracts.LottoMojiTickets}`);
        console.log(`LottoMojiReserves: https://sepolia.basescan.org/address/${contracts.LottoMojiReserves}`);
        console.log(`LottoMojiRandom: https://sepolia.basescan.org/address/${contracts.LottoMojiRandom}`);

    } catch (error) {
        console.error("❌ Error durante la verificación:", error);
        
        if (error.message.includes("already verified")) {
            console.log("ℹ️ El contrato ya estaba verificado");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });