const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying LottoMojiRandom with VRF v2.5...");
    
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
    
    // Deploy LottoMojiRandom with VRF v2.5
    console.log("\n📡 Deploying LottoMojiRandom...");
    const LottoMojiRandom = await ethers.getContractFactory("LottoMojiRandom");
    const lottoMojiRandom = await LottoMojiRandom.deploy(
        SUBSCRIPTION_ID,
        LOTTO_MOJI_MAIN
    );
    
    await lottoMojiRandom.waitForDeployment();
    const randomAddress = await lottoMojiRandom.getAddress();
    
    console.log("✅ LottoMojiRandom deployed to:", randomAddress);
    
    // Verify VRF configuration
    console.log("\n🔍 Verifying VRF configuration...");
    const vrfConfig = await lottoMojiRandom.getVRFConfig();
    console.log("VRF Coordinator:", vrfConfig[0]);
    console.log("Key Hash:", vrfConfig[1]);
    console.log("Subscription ID:", vrfConfig[2].toString());
    console.log("Callback Gas Limit:", vrfConfig[3].toString());
    console.log("Request Confirmations:", vrfConfig[4].toString());
    
    // Update LottoMojiMain with new random contract address
    console.log("\n🔄 Updating LottoMojiMain with new random contract...");
    const LottoMojiMain = await ethers.getContractFactory("LottoMojiMain");
    const lottoMojiMain = LottoMojiMain.attach(LOTTO_MOJI_MAIN);
    
    const updateTx = await lottoMojiMain.updateRandomContract(randomAddress);
    await updateTx.wait();
    console.log("✅ LottoMojiMain updated with new random contract");
    
    // Verify the update
    const currentRandomContract = await lottoMojiMain.randomContract();
    console.log("Current random contract in LottoMojiMain:", currentRandomContract);
    
    console.log("\n🎯 Deployment Summary:");
    console.log("=".repeat(50));
    console.log("LottoMojiRandom (VRF v2.5):", randomAddress);
    console.log("VRF Coordinator:", "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE");
    console.log("Key Hash:", "0x9e1344a1247c8a1785d0a4681a27152bffdb43666ae5bf7d14d24a5efd44bf71");
    console.log("Subscription ID:", SUBSCRIPTION_ID);
    console.log("=".repeat(50));
    
    console.log("\n📋 Next Steps:");
    console.log("1. Add the new contract address to your VRF v2.5 subscription as a consumer");
    console.log("2. Fund your subscription with LINK tokens");
    console.log("3. Test the random number generation");
    
    console.log("\n🔗 Add this contract as a consumer at:");
    console.log("https://vrf.chain.link/base-sepolia");
    console.log("Contract address to add:", randomAddress);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 