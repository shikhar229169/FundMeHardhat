const { getNamedAccounts, ethers, network } = require("hardhat");
const { networkConfig, deploymentChains } = require("../../helper-hardhat-config.js");
const { assert } = require("chai");

deploymentChains.includes(network.name) 
? describe.skip 
: describe("FundMe testing", () => {
    let fundMe;
    let deployer;
    const etherAmt = ethers.utils.parseUnits("2", 12);

    beforeEach(async() => {
        deployer = (await getNamedAccounts()).deployer;
        fundMe = await ethers.getContract("FundMe", deployer);
    });

    it("Setting up correct PriceFeed Address", async() => {
        const expectedPriceFeedAddress = networkConfig[network.config.chainId]["priceFeedAddress"];
        const actualPriceFeedAddress = await fundMe.getPriceFeeds();

        assert.equal(expectedPriceFeedAddress, actualPriceFeedAddress);
    });

    it("Allows people to fund and withdraw", async() => {
        const beforeFundDeployer = await fundMe.provider.getBalance(deployer);
        const beforeFundMe = await fundMe.provider.getBalance(fundMe.address);

        const response1 = await fundMe.fund({value: etherAmt});
        const resRcpt = await response1.wait(1);
        const { gasUsed, effectiveGasPrice } = resRcpt;
        const netGasCost = gasUsed.mul(effectiveGasPrice); 

        const afterFundDeployer = await fundMe.provider.getBalance(deployer);
        const afterFundMe = await fundMe.provider.getBalance(fundMe.address);

        const expectedAmt = afterFundMe.sub(beforeFundMe);
        const sent = beforeFundDeployer.sub(afterFundDeployer);

        assert.equal(expectedAmt.toString(), etherAmt);
        assert.equal(sent.sub(netGasCost).toString(), etherAmt);
    });

    // it("Withdraw check", async() => {

    // });
})


