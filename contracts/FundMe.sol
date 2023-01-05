// SPDX-License-Identifier: MIT

pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "hardhat/console.sol";

error FundMe__notOwner();

/** @title A contract to demonstrate funding process
 *  @author Bhai Me Billa Hu
 *  @notice To demonstrate the funding through hsmart contract
 *  @dev This implements price feeds as interfaces
 */

contract FundMe {
    address private immutable owner;
    AggregatorV3Interface private priceFeeds;

    // in terms of wei
    uint256 public minTxn = 2e18;
    bool public validate = false;
    uint256 public minTxnUSD = 50*1e18; // actually it is 50 dollars, as solidity cannot handle decimals

    address[] private senders;
    mapping(address => uint256) private moneyFunded;

    modifier onlyOwner() {
        if (msg.sender != owner) {
            revert FundMe__notOwner();
        }
        _;
    }

    constructor(address priceFeedAddress) {
        owner = msg.sender;
        console.log("Owner of contract is ", owner);
        priceFeeds = AggregatorV3Interface(priceFeedAddress);
    }

    receive() external payable {
        fund();
    }

    fallback() external payable {
        fund();
    }

    /** @notice This function is used for funding
     *  @dev This implements price feeds from interfaces from chainlink
     */
    function fund() public payable {
        validate = true;
        console.log("Value received is", msg.value);
        //console.log("USD eq: ", ETH_to_USD(msg.value));
        //console.log("USD: ", getPrice());
        require(
            ETH_to_USD(msg.value) >= minTxnUSD,
            "Amount should be atleast 2 eth"
        );

        address currSender = msg.sender;
        if (moneyFunded[currSender] == 0) {
            senders.push(currSender);
        }

        moneyFunded[currSender] += msg.value;
    }

    function withdraw() public payable onlyOwner {
        for (uint i = 0; i < senders.length; i++) {
            moneyFunded[senders[i]] = 0;
        }

        senders = new address[](0);

        (bool result, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(result, "Error in txn");
    }

    /** @return it will return the price of ether in USD multiplied by 1e18, the price variable will store the actual price * 1e8, we are returning it multiplied by 1e10
    */
    function getPrice() public view returns (uint256) {
        (, int256 price, , , ) = priceFeeds.latestRoundData();

        return uint256(price * 1e10);
    }

    function ETH_to_USD(uint256 ethAmt) public view returns (uint256) {
        uint256 ethPrice = getPrice(); // USD in 1 ETH * (1e18)
        return (ethPrice * ethAmt) / 1e18;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    /** @return Returns the length of senders array
    */
    function getSendersLen() public view returns (uint256) {
        return senders.length;
    }

    function getFunder(uint256 idx) public view returns (address) {
        return senders[idx];
    }

    function getMoneyFunded(address funder) public view returns (uint256) {
        return moneyFunded[funder];
    }

    function getPriceFeeds() public view returns (AggregatorV3Interface) {
        return priceFeeds;
    }
}
