const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying LottoMojiAutomation...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    // Latest contract addresses from temp-check deployment
    const MAIN_ADDRESS = "0x36AC1F1aad13AFBE076c38B7E890e3507a0FA691";
    const RESERVES_ADDRESS = "0x765A3071f14BDD5272e6Cc83BE7fa059F472a77F";
    const RANDOM_ADDRESS = "0x32BFc16819d02E346bbf56D811C9eab3a0aa1935";
    
    console.log("Using contract addresses:");
    console.log("- LottoMojiMain:", MAIN_ADDRESS);
    console.log("- LottoMojiReserves:", RESERVES_ADDRESS);
    console.log("- LottoMojiRandomV25:", RANDOM_ADDRESS);
    
    // Deploy LottoMojiAutomation
    const LottoMojiAutomation = await ethers.getContractFactory("LottoMojiAutomation");
    const automation = await LottoMojiAutomation.deploy(
        MAIN_ADDRESS,
        RESERVES_ADDRESS,
        RANDOM_ADDRESS
    );
    
    await automation.waitForDeployment();
    const address = await automation.getAddress();
    
    console.log("✅ LottoMojiAutomation deployed to:", address);
    
    // Verify the deployment
    console.log("🔍 Verifying deployment...");
    const lotteryContract = await automation.lotteryContract();
    const reserveContract = await automation.reserveContract();
    const randomContract = await automation.randomContract();
    
    console.log("Contract references:");
    console.log("- Lottery Contract:", lotteryContract);
    console.log("- Reserve Contract:", reserveContract);
    console.log("- Random Contract:", randomContract);
    
    // Check automation state
    const automationActive = await automation.automationActive();
    const emergencyPause = await automation.emergencyPause();
    
    console.log("Automation state:");
    console.log("- Automation Active:", automationActive);
    console.log("- Emergency Pause:", emergencyPause);
    
    console.log("\n🎉 Deployment completed successfully!");
    console.log("📋 Contract Details:");
    console.log("- LottoMojiAutomation (Updated):", address);
    console.log("- Network: Base Sepolia");
    console.log("- VRF Version: v2.5");
    
    // Save deployment info
    const deploymentInfo = {
        network: "baseSepolia",
        timestamp: new Date().toISOString(),
        contracts: {
            LottoMojiAutomationUpdated: {
                address: address,
                lotteryContract: MAIN_ADDRESS,
                reserveContract: RESERVES_ADDRESS,
                randomContract: RANDOM_ADDRESS,
                vrfVersion: "v2.5"
            }
        }
    };
    
    const fs = require('fs');
    fs.writeFileSync('deployment-automation-final.json', JSON.stringify(deploymentInfo, null, 2));
    console.log("💾 Deployment info saved to deployment-automation-final.json");
    
    console.log("\n⚠️  NEXT STEPS:");
    console.log("1. Register this contract with Chainlink Automation");
    console.log("2. Update frontend to use new contract addresses");
    console.log("3. Test the complete automation flow");
    
    console.log("\n📋 COMPLETE UPDATED SYSTEM:");
    console.log("✅ LottoMojiRandomV25:", RANDOM_ADDRESS);
    console.log("✅ LottoMojiMain (Latest):", MAIN_ADDRESS);
    console.log("✅ LottoMojiAutomation (Updated):", address);
    console.log("✅ LottoMojiReserves:", RESERVES_ADDRESS);
    console.log("✅ LottoMojiTickets:", "0x96303188b9e09f6F8b55685f51273c57DD2a8f79");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    }); 