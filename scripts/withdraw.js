const { ethers, getNamedAccounts } = require("hardhat");


async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    const before = await fundMe.provider.getBalance(deployer);
    
    console.log("Hold Tight! Withdrawing.......")
    const withdrawResponse = await fundMe.withdraw();
    console.log("Almost there!")
    const receipt = await withdrawResponse.wait(1);
    const { gasUsed, effectiveGasPrice} = receipt;
    const netGasCost = gasUsed.mul(effectiveGasPrice);
    const after = await fundMe.provider.getBalance(deployer);
    console.log(`Successfully Withdrawn Amount: ${after-before+netGasCost}`);
    console.log(`Gas Cost: ${netGasCost}`);
    console.log(`Final Balance: ${after}`);
}



main() 
.then(() => process.exit(0))
.catch((error) => {
    console.error(error)
    process.exit(1)
})