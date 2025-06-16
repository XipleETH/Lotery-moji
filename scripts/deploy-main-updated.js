const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying updated LottoMojiMain with new RandomV25 contract...");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    
    // Get account balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("Account balance:", ethers.formatEther(balance), "ETH");
    
    // Contract addresses from previous deployments
    const USDC_ADDRESS = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
    const LOTTO_MOJI_TICKETS = "0x96303188b9e09f6F8b55685f51273c57DD2a8f79";
    const LOTTO_MOJI_RESERVES = "0x765A3071f14BDD5272e6Cc83BE7fa059F472a77F";
    
    // NEW: Updated random contract address (VRF v2.5)
    const LOTTO_MOJI_RANDOM_V25 = "0x32BFc16819d02E346bbf56D811C9eab3a0aa1935";
    
    console.log("Using contract addresses:");
    console.log("- USDC:", USDC_ADDRESS);
    console.log("- LottoMojiTickets:", LOTTO_MOJI_TICKETS);
    console.log("- LottoMojiReserves:", LOTTO_MOJI_RESERVES);
    console.log("- LottoMojiRandomV25:", LOTTO_MOJI_RANDOM_V25);
    
    try {
        console.log("📡 Deploying updated LottoMojiMain...");
        
        // Deploy the contract
        const LottoMojiMain = await ethers.getContractFactory("LottoMojiMain");
        const lottoMojiMain = await LottoMojiMain.deploy(
            USDC_ADDRESS,
            LOTTO_MOJI_TICKETS,
            LOTTO_MOJI_RESERVES,
            LOTTO_MOJI_RANDOM_V25
        );
        
        await lottoMojiMain.waitForDeployment();
        const mainAddress = await lottoMojiMain.getAddress();
        
        console.log("✅ Updated LottoMojiMain deployed to:", mainAddress);
        
        // Verify the deployment
        console.log("🔍 Verifying deployment...");
        const usdcToken = await lottoMojiMain.usdcToken();
        const ticketNFT = await lottoMojiMain.ticketNFT();
        const reserveContract = await lottoMojiMain.reserveContract();
        const randomContract = await lottoMojiMain.randomContract();
        
        console.log("Contract references:");
        console.log("- USDC Token:", usdcToken);
        console.log("- Ticket NFT:", ticketNFT);
        console.log("- Reserve Contract:", reserveContract);
        console.log("- Random Contract:", randomContract);
        
        // Check game state
        const currentGameDay = await lottoMojiMain.currentGameDay();
        const gameActive = await lottoMojiMain.gameActive();
        const ticketPrice = await lottoMojiMain.TICKET_PRICE();
        
        console.log("Game state:");
        console.log("- Current Game Day:", currentGameDay.toString());
        console.log("- Game Active:", gameActive);
        console.log("- Ticket Price:", ethers.formatUnits(ticketPrice, 6), "USDC");
        
        console.log("\n🎉 Deployment completed successfully!");
        console.log("📋 Updated Contract Details:");
        console.log("- LottoMojiMain (Updated):", mainAddress);
        console.log("- Network: Base Sepolia");
        console.log("- Random Contract: VRF v2.5");
        
        // Save deployment info
        const deploymentInfo = {
            network: "baseSepolia",
            timestamp: new Date().toISOString(),
            contracts: {
                LottoMojiMainUpdated: {
                    address: mainAddress,
                    usdcToken: USDC_ADDRESS,
                    ticketNFT: LOTTO_MOJI_TICKETS,
                    reserveContract: LOTTO_MOJI_RESERVES,
                    randomContract: LOTTO_MOJI_RANDOM_V25,
                    randomVersion: "v2.5"
                }
            },
            previousContracts: {
                LottoMojiMainOld: "0x3823B745121DFC7616CC2F3dd15E89e0cb1E7987",
                LottoMojiRandomOld: "0x3674D09be633dB84A2943B8386196D3eE9F9DeCc"
            }
        };
        
        const fs = require('fs');
        fs.writeFileSync('deployment-main-updated.json', JSON.stringify(deploymentInfo, null, 2));
        console.log("💾 Deployment info saved to deployment-main-updated.json");
        
        console.log("\n⚠️  IMPORTANT NEXT STEPS:");
        console.log("1. Update LottoMojiAutomation contract to use new LottoMojiMain address");
        console.log("2. Update frontend to use new LottoMojiMain address");
        console.log("3. Test the integration with VRF v2.5");
        console.log("4. Verify that the random contract can be called by the new main contract");
        
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