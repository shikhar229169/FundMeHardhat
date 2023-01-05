// hre - hardhat runtime environment

const { network } = require("hardhat");
const { networkConfig, deploymentChains } = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verification.js");
require("dotenv").config();

// module.exports = async(hre) => {
//   const {getNamedAccounts, deployments} = hre;

// };

module.exports = async({getNamedAccounts, deployments}) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = network.config.chainId;
  
  let priceFeedAddress;
  if (deploymentChains.includes(network.name)) {
    const ethUSDAggregator = await deployments.get("MockV3Aggregator");
    priceFeedAddress=ethUSDAggregator.address;
  }
  else {
    priceFeedAddress = networkConfig[chainId]["priceFeedAddress"];
  }

  const args = [priceFeedAddress];

  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: args, // it will be passed to the constructor
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  });

  log("-------------------Contract Deployed---------------------------");

  if (!deploymentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
    await verify(fundMe.address, args);
  }
  
  log("-------------------End of Report--------------------------------");
}

// with these tags we can choose which script file is to be chosen
// yarn hardhat deploy --tags main --network goerli
module.exports.tags = ["main", "all"];