const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying LottoMojiAutomation...");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const MAIN_ADDRESS = "0xc9357aa85b80D7E6CC3f3d2De74bEC1861b6ead6";
    const RESERVES_ADDRESS = "0x765A3071f14BDD5272e6Cc83BE7fa059F472a77F";
    const RANDOM_ADDRESS = "0x32BFc16819d02E346bbf56D811C9eab3a0aa1935";
    
    console.log("Using addresses:");
    console.log("Main:", MAIN_ADDRESS);
    console.log("Reserves:", RESERVES_ADDRESS);
    console.log("Random:", RANDOM_ADDRESS);
    
    const LottoMojiAutomation = await ethers.getContractFactory("LottoMojiAutomation");
    const automation = await LottoMojiAutomation.deploy(
        MAIN_ADDRESS,
        RESERVES_ADDRESS,
        RANDOM_ADDRESS
    );
    
    await automation.waitForDeployment();
    const address = await automation.getAddress();
    
    console.log("LottoMojiAutomation deployed to:", address);
    
    const fs = require("fs");
    const deploymentInfo = {
        network: "baseSepolia",
        timestamp: new Date().toISOString(),
        LottoMojiAutomationUpdated: address,
        references: {
            lotteryContract: MAIN_ADDRESS,
            reserveContract: RESERVES_ADDRESS,
            randomContract: RANDOM_ADDRESS
        }
    };
    
    fs.writeFileSync("deployment-automation-updated.json", JSON.stringify(deploymentInfo, null, 2));
    console.log("Deployment info saved");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    }); 