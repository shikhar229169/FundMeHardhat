const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
    const { deployer } = await getNamedAccounts();
    const fundMe = await ethers.getContract("FundMe", deployer);
    const etherAmt = ethers.utils.parseEther("2");
    const before = await fundMe.provider.getBalance(fundMe.address);

    console.log("Initiating funding");
    const fundResponse = await fundMe.fund({value: etherAmt});
    console.log("Almost there!")
    await fundResponse.wait(1);
    const after = await fundMe.provider.getBalance(fundMe.address);
    console.log("Hooray! Successfully Funded");
    console.log(`Funded Amt :${after-before}`);
}

main() 
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })