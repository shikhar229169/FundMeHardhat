const { run } = require("hardhat");

const verify = async(contractAddress, args) => {
    console.log("Starting the verification process. Hold Tight!")
    try {
        await run("verify:verify", {
            address: contractAddress, constructorArguments: args,
        });
    }
    catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("You are all set, Your contract is already verified");
        }
        else {
            console.log(e);
        }
    }
}

module.exports = {verify};