const { deployments, ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { networkConfig, deploymentChains } =require("../../helper-hardhat-config.js");

describe("FundMe Contract Testing", () => {
    let fundMe;
    let V3Aggregator;
    let myDeployer;
    const etherValue = ethers.utils.parseEther("1"); // 1ETH, convert it to 1e18 in string
    const lessEther = ethers.utils.parseUnits("35", 10);

    beforeEach(async() => {
        myDeployer = (await getNamedAccounts()).deployer;

        // deploys all contract with tags as "all"
        await deployments.fixture("all");
        
        //const { deployer } = await getNamedAccounts();
        // give us the most recent deployment of FundMe contract
        // and will connect deployer with FundMe contract 

        fundMe = await ethers.getContract("FundMe", myDeployer);
        if (deploymentChains.includes(network.name)) {
            V3Aggregator = await ethers.getContract("MockV3Aggregator", myDeployer);
        }
    });

    describe("Testing the Constructor", () => {
        it("setting the priceFeed addresses correctly", async() => {
            const fundMePriceAddress = await fundMe.priceFeeds();
            let expectedPriceFeedAddress;
            
            if (deploymentChains.includes(network.name)) {
                expectedPriceFeedAddress = V3Aggregator.address;
            }
            else {
                expectedPriceFeedAddress = networkConfig[network.config.chainId]["priceFeedAddress"];
            }

            assert.equal(fundMePriceAddress, expectedPriceFeedAddress);
        });
        it("Setting the owner correctly", async() => {
            const responseOwner = await fundMe.getOwner();
            
            assert.equal(responseOwner, myDeployer);
        });
    });

    describe("Fund Function Works Fine", () => {
        it("Fails if less ETH sent", async() => {
            await expect(fundMe.fund({value: lessEther})).to.be.revertedWith("Amount should be atleast 2 eth");
        });

        it("Value of money funded is updated", async() => {
            // here moneyFunded is the mapping from address to uint256
            // mapping (address => uint256) public moneyFunded
            const moneyBefore = await fundMe.moneyFunded(myDeployer);
            
            await fundMe.fund({value: etherValue});
            
            const moneyAfter = await fundMe.moneyFunded(myDeployer);

            // returns moneyAfter-moneyBefore
            const diff = moneyAfter.sub(moneyBefore);

            assert.equal(diff.toString(), etherValue);
        });

        it("New senders getting added to senders array", async() => {
            const amountBefore = await fundMe.moneyFunded(myDeployer);

            await fundMe.fund({value: etherValue});

            if (amountBefore == 0) {
                const sender = await fundMe.senders(0);

                assert.equal(sender, myDeployer);
                //console.log(`${sender}`);
            }
        });
    });

    describe("Testing Withdraw function", () => {
        beforeEach(async() => {
            await fundMe.fund({value: etherValue});
        });

        // pending
        // it("Any other person other than owner can't call it", async() => {};

        it("ETH received by deployer is same as ETH withdrawn", async() => {
            const fundMeBefore = await fundMe.provider.getBalance(fundMe.address);
            const deployerBefore = await fundMe.provider.getBalance(myDeployer);

            const response = await fundMe.withdraw();
            const txnReceipt = await response.wait(1);

            const { gasUsed, effectiveGasPrice } = txnReceipt;

            const totalGasCost = gasUsed.mul(effectiveGasPrice);

            const fundMeAfter = await fundMe.provider.getBalance(fundMe.address);
            const deployerAfter = await fundMe.provider.getBalance(myDeployer);

            // after withdrawing the amount, the fundMe contract will have 0 eth
            assert.equal(fundMeAfter, 0);

            assert.equal(deployerAfter.add(totalGasCost).toString(), fundMeBefore.add(deployerBefore).toString());
        });

        it("Senders array become empty, moneyFunded becomes zero", async() => {
            const response = await fundMe.withdraw();
            const txnReceipt = await response.wait(1);
            
            const sendersArrayLen = await fundMe.getSendersLen();
            const moneyFunded = await fundMe.moneyFunded(myDeployer);


            assert.equal(sendersArrayLen.toString(), "0");
            assert.equal(moneyFunded.toString(), "0");
        });

        it("Works purrfect with mutiple senders", async() => {
            const accounts = await ethers.getSigners();
            for (let i=1; i<6; i++) {
                const fundMeTemp = await fundMe.connect(accounts[i]);

                await fundMeTemp.fund({value: etherValue});
            }

            // Balance calculation after funding by the senders
            const initialFundMeBal = await fundMe.provider.getBalance(fundMe.address);
            const initialDeployerBal = await fundMe.provider.getBalance(myDeployer);

            const withdrawResponse = await fundMe.withdraw();
            const withdrawReceipt = await withdrawResponse.wait(1);

            const { gasUsed, effectiveGasPrice } = withdrawReceipt;

            const totalGasCost = gasUsed.mul(effectiveGasPrice);

            // calculation of balance after withdrawal
            const finalFundMeBal = await fundMe.provider.getBalance(fundMe.address);
            const finalDeployerBal = await fundMe.provider.getBalance(myDeployer);

            // checking the amount to be settled correctly
            assert.equal(finalFundMeBal, 0);
            assert.equal(finalDeployerBal.add(totalGasCost).toString(), initialDeployerBal.add(initialFundMeBal).toString());


            // checking the funders array should be empty
            await expect(fundMe.senders(0)).to.be.reverted;

            for (let i=1; i<=5; i++) {
                assert.equal(await fundMe.moneyFunded(accounts[i].address), 0);
            }
        });

        it("Only allows owner to withdraw the amount", async() => {
            const accounts = await ethers.getSigners();

            for (let i=1; i<=5; i++) {
                const fundMeTemp = await fundMe.connect(accounts[i]);

                await fundMeTemp.fund({value: etherValue});

                await expect(fundMeTemp.withdraw()).to.be.revertedWithCustomError(fundMe, "FundMe__notOwner");
            }


            // withdrawal by owner
            await expect(fundMe.withdraw()).not.to.be.reverted;
        });
    });
});