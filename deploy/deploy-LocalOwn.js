const { network } = require("hardhat");
const { localNetworks, DECIMAL, ANSWER } = require("../helper-hardhat2.js");

module.exports = async( { deployments, getNamedAccounts } ) => {
    const { log, deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    if (localNetworks.includes(network.name)) {
        log("Local Network detected!");
        log("Hold Tight! We are deploying your contract....");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            args: [DECIMAL, ANSWER],
            log: true,
        });
        log("Contract deployed.");
    }
};

module.exports.tags = ["practice", "plocal"];