const { network } = require("hardhat");
const { deploymentChains, DECIMAL, INITIAL_ANSWER } = require("../helper-hardhat-config.js")

module.exports = async({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments;
    const { deployer } = await getNamedAccounts();

    if (deploymentChains.includes(network.name)) {
        log("Local Network detected");
        const V3Aggregator = await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            args: [DECIMAL, INITIAL_ANSWER],
            log: true
        });
        log("Mocks deployed!");
        log("-------------");
    }
}

module.exports.tags = ["all", "mocks"];