// to get the priceFeedAddress of a network by its chainId

const networkConfig = {
    5: {
        name: "goerli",
        priceFeedAddress: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
    80001: {
        name: "polygon",
        priceFeedAddress: "",
    },
}

const DECIMAL = 8;
const INITIAL_ANSWER = 200000000000;
const deploymentChains = ["hardhat", "localhost"];

module.exports = {
    networkConfig, deploymentChains, DECIMAL, INITIAL_ANSWER,
}