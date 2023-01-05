require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("dotenv").config();
require("solidity-coverage");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-etherscan");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  //solidity: "0.8.17",
  solidity: {
    compilers: [
      {version: "0.8.17"},
      {version: "0.8.8"},
      {version: "0.6.6"},
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    goerli: {
      url: process.env.GOERLI_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 5,
      blockConfirmations: 6,     // to tell how much block confirmations to wait
    },
    polygon: {
      url: process.env.POLYGON_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      chainId: 80001,
    },
    localhost: {
      url: process.env.LOCALHOST_RPC_URL,
      chainId: 31337,
    },
  },

  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },

  gasReporter: {
    enabled: false,
    noColors: true,
    outputFile: "egas-Reports.txt",
    currency: "INR",
    token: "ETH",
    //coinmarketcap: process.env.COINMARKET_API_KEY,
  },

  namedAccounts: {
    deployer: {
      default: 0,
      80001: 1,
      5: 0,
    },
    user: {
      default: 1,
    },
  },
};