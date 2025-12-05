// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DateMarket.sol";

/**
 * @title MarketFactory
 * @notice Creates and manages DateMarket contracts
 */
contract MarketFactory {
    address public immutable usdcToken;
    address[] public allMarkets;
    
    mapping(address => address[]) public marketsByCreator;
    mapping(bytes32 => address) public marketByPair; // hash(friend1, friend2) => market
    
    event MarketCreated(
        address indexed marketAddress,
        address indexed creator,
        address friend1,
        address friend2,
        string title,
        uint256 timestamp
    );

    constructor(address _usdcToken) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = _usdcToken;
    }

    /**
     * @notice Create a new dating prediction market
     * @param friend1 Address of first friend
     * @param friend2 Address of second friend
     * @param title Market title/question
     * @param resolutionTime Time when market can be resolved
     */
    function createMarket(
        address friend1,
        address friend2,
        string memory title,
        uint256 resolutionTime
    ) external returns (address) {
        require(friend1 != address(0) && friend2 != address(0), "Invalid friend addresses");
        require(friend1 != friend2, "Friends must be different");
        require(resolutionTime > block.timestamp, "Resolution time must be in future");
        
        // Ensure consistent ordering for pair hash
        (address addr1, address addr2) = friend1 < friend2 ? (friend1, friend2) : (friend2, friend1);
        bytes32 pairHash = keccak256(abi.encodePacked(addr1, addr2));
        
        require(marketByPair[pairHash] == address(0), "Market already exists for this pair");

        // Deploy new market contract
        DateMarket market = new DateMarket(
            usdcToken,
            msg.sender,
            friend1,
            friend2,
            title,
            resolutionTime
        );

        address marketAddress = address(market);
        
        allMarkets.push(marketAddress);
        marketsByCreator[msg.sender].push(marketAddress);
        marketByPair[pairHash] = marketAddress;

        emit MarketCreated(marketAddress, msg.sender, friend1, friend2, title, block.timestamp);

        return marketAddress;
    }

    /**
     * @notice Get all markets created by a user
     */
    function getMarketsByCreator(address creator) external view returns (address[] memory) {
        return marketsByCreator[creator];
    }

    /**
     * @notice Get total number of markets
     */
    function getMarketCount() external view returns (uint256) {
        return allMarkets.length;
    }

    /**
     * @notice Get market address for a friend pair
     */
    function getMarketForPair(address friend1, address friend2) external view returns (address) {
        (address addr1, address addr2) = friend1 < friend2 ? (friend1, friend2) : (friend2, friend1);
        bytes32 pairHash = keccak256(abi.encodePacked(addr1, addr2));
        return marketByPair[pairHash];
    }
}
