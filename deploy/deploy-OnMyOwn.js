const { network } = require("hardhat");
const { getAddress, localNetworks } = require("../helper-hardhat2.js");
const { verify } = require("../utils/verification.js");
require("dotenv").config();

module.exports = async( { deployments, getNamedAccounts } )  => {
    const { deploy, log } = deployments;

    // to get the public key address of our account
    const { deployer } = await getNamedAccounts();

    let priceFeedAddress;

    if (localNetworks.includes(network.name)) {
        const V3Aggregator = await deployments.get("MockV3Aggregator");
        priceFeedAddress = V3Aggregator.address;
    }
    else {
        priceFeedAddress = getAddress[network.config.chainId]["priceFeedAddress"];
    }


    //console.log(`${deployer}`);

    log("Hold Tight! your contract is being deployed");

    const fundMe = await deploy("FundMe", {
        contract: "FundMe",
        from: deployer,
        log: true,
        args: [priceFeedAddress],
        
        // in the hardhat config file, if in case there is no blockConfirmations mentioned, then waitConfirmations 
        // will be set to 2
        // if it was not set then there will be an error
        waitConfirmations: network.config.blockConfirmations || 2,  
    });


    if (!localNetworks.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, [priceFeedAddress]);
    }


    log("---------------End of Report-------------------");
}


module.exports.tags = ["practice", "pmain"];