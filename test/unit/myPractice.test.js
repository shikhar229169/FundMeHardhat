const { deployments, getNamedAccounts, ethers, network } = require("hardhat");
const { assert, expect } = require("chai");
const { deploymentChains } = require("../../helper-hardhat-config.js");

!deploymentChains.includes(network.name) 
    ? describe.skip
    : describe("Initiated Testing for FundMe contract", () => {
        let fundMe, V3Aggregator;
        let deployer;
        const etherAmt = ethers.utils.parseEther("2");
        
        beforeEach(async() => {
            await deployments.fixture("all");
            
            deployer = (await getNamedAccounts()).deployer;
            fundMe = await ethers.getContract("FundMe", deployer);
            V3Aggregator = await ethers.getContract("MockV3Aggregator", deployer);
        });
    
        describe("Constructor check", () => {
            it("Setting the correct Owner", async() => {
                const receivedOwner = await fundMe.getOwner();
                assert.equal(receivedOwner, deployer);
            }); 
    
            it("Getting correct priceFeed Address", async() => {
                const V3Address = V3Aggregator.address;
                const priceFeedAddress = await fundMe.getPriceFeeds();
    
                console.log(`${priceFeedAddress}`);
            });
        });
    
        describe("Fund Function Checking", () => {
            it("Fails if ethers is less", async() => {
               await expect(fundMe.fund({value: 0})).to.be.revertedWith("Amount should be atleast 2 eth");
            });
    
            it("Amount should be updated", async() => {
                const beforeFund = await fundMe.provider.getBalance(fundMe.address);
                await fundMe.fund({value: etherAmt});
                const afterFund = await fundMe.provider.getBalance(fundMe.address);
    
                const diff = afterFund.sub(beforeFund);
                assert.equal(diff.toString(), etherAmt);
            });
    
            it("New senders must be added to array & amount is added to map", async() => {
                await fundMe.fund({value: etherAmt});
    
                const funder = await fundMe.getFunder(0);
                const value = await fundMe.getMoneyFunded(deployer);
                assert.equal(funder, deployer);
                assert.equal(value.toString(), etherAmt);
            });
        });
    
        describe("Withdraw function checking", async() => {
            beforeEach(async() => {
                await fundMe.fund({value: etherAmt});
            });
    
            it("Exact amount funded must be received when withdrawn (for deployer only)", async() => {
                const deployerInitialAmt = await fundMe.provider.getBalance(deployer);
                const fundMeInitalAmt = await fundMe.provider.getBalance(fundMe.address);
    
                const withdrawResponse = await fundMe.withdraw();
                const txnReceipt = await withdrawResponse.wait(1);
                
                const { gasUsed, effectiveGasPrice } = txnReceipt;
                const netGasPrice = gasUsed.mul(effectiveGasPrice);
    
                const deployerFinalAmt = await fundMe.provider.getBalance(deployer);
                const fundMeFinalAmt = await fundMe.provider.getBalance(fundMe.address);
    
                assert.equal(fundMeFinalAmt.toString(), "0");
                assert.equal(deployerFinalAmt.add(netGasPrice).toString(), deployerInitialAmt.add(fundMeInitalAmt).toString());
            });
    
            it("Allows only owner to withdraw", async() => {
                // getting another account
                const accounts = await ethers.getSigners();
                const attacker = accounts[1];
                const attackerAcct = await fundMe.connect(attacker);
                
                //reverts if attacker withdraws
                await expect(attackerAcct.withdraw()).to.be.revertedWithCustomError(fundMe, "FundMe__notOwner");
    
                // accepts if owner withdraws
                await expect(fundMe.withdraw()).not.to.be.reverted;
            });
            
            it("Works with multiple funders", async() => {
                const accounts = await ethers.getSigners();
                for (let i=1; i<=10; i++) {
                    const fundMeTemp = await fundMe.connect(accounts[i]);
                    await fundMeTemp.fund({value: etherAmt});
                }
    
                const deployerInitialAmt = await fundMe.provider.getBalance(deployer);
                const fundMeInitialAmt = await fundMe.provider.getBalance(fundMe.address);
    
                const withdrawResponse = await fundMe.withdraw();
                const withdrawReceipt = await withdrawResponse.wait(1);
    
                const { gasUsed, effectiveGasPrice } = withdrawReceipt;
                const totalGasPrice = gasUsed.mul(effectiveGasPrice);
    
                const deployerFinalAmt = await fundMe.provider.getBalance(deployer);
                const fundMeFinalAmt = await fundMe.provider.getBalance(fundMe.address);
    
                assert.equal(fundMeFinalAmt.toString(), "0");
                assert.equal(deployerFinalAmt.add(totalGasPrice).toString(), deployerInitialAmt.add(fundMeInitialAmt).toString());
    
                await expect(fundMe.getFunder(0)).to.be.reverted;
                for (let i=1; i<=10; i++) {
                    assert.equal(await fundMe.getMoneyFunded(accounts[i].address), 0);
                }
            });
        });
    });
