const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying LottoMojiRandomV25 with VRF v2.5...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Get account balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Contract addresses from previous deployments
    const LOTTO_MOJI_MAIN = "0x3823B745121DFC7616CC2F3dd15E89e0cb1E7987";
    
    // VRF v2.5 subscription ID (the large number you provided)
    const SUBSCRIPTION_ID = "36964112161889945425064710801214207658994639180967117994906698541413525908202";
    
    console.log("Using LottoMojiMain address:", LOTTO_MOJI_MAIN);
    console.log("Using VRF v2.5 Subscription ID:", SUBSCRIPTION_ID);
    
    try {
        console.log("📡 Deploying LottoMojiRandomV25...");
        
        // Deploy the contract
        const LottoMojiRandomV25 = await ethers.getContractFactory("LottoMojiRandomV25");
        const lottoMojiRandom = await LottoMojiRandomV25.deploy(
            SUBSCRIPTION_ID,
            LOTTO_MOJI_MAIN
        );
        
        await lottoMojiRandom.waitForDeployment();
        const randomAddress = await lottoMojiRandom.getAddress();
        
        console.log("✅ LottoMojiRandomV25 deployed to:", randomAddress);
        
        // Verify the deployment
        console.log("🔍 Verifying deployment...");
        const config = await lottoMojiRandom.getVRFConfig();
        console.log("VRF Coordinator:", config[0]);
        console.log("Key Hash:", config[1]);
        console.log("Subscription ID:", config[2].toString());
        console.log("Callback Gas Limit:", config[3].toString());
        console.log("Request Confirmations:", config[4].toString());
        
        // Check lottery contract
        const lotteryContract = await lottoMojiRandom.lotteryContract();
        console.log("Lottery Contract:", lotteryContract);
        
        // Check owner
        const owner = await lottoMojiRandom.owner();
        console.log("Contract Owner:", owner);
        
        console.log("\n🎉 Deployment completed successfully!");
        console.log("📋 Contract Details:");
        console.log("- LottoMojiRandomV25:", randomAddress);
        console.log("- Network: Base Sepolia");
        console.log("- VRF Version: v2.5");
        console.log("- Subscription ID:", SUBSCRIPTION_ID);
        
        // Save deployment info
        const deploymentInfo = {
            network: "baseSepolia",
            timestamp: new Date().toISOString(),
            contracts: {
                LottoMojiRandomV25: {
                    address: randomAddress,
                    subscriptionId: SUBSCRIPTION_ID,
                    lotteryContract: LOTTO_MOJI_MAIN,
                    vrfVersion: "v2.5"
                }
            }
        };
        
        const fs = require('fs');
        fs.writeFileSync('deployment-vrf-v25.json', JSON.stringify(deploymentInfo, null, 2));
        console.log("💾 Deployment info saved to deployment-vrf-v25.json");
        
    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 