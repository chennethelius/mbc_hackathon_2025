// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DateMarket.sol";

/**
 * @title MarketResolver
 * @notice Manages market resolution with optional multi-party verification
 * For MVP: Simple creator-only resolution
 * Future: Can add oracle integration or multi-sig verification
 */
contract MarketResolver {
    struct Resolution {
        address resolver;
        bool outcome;
        uint256 timestamp;
        string evidence; // IPFS hash or URL
        bool executed;
    }

    mapping(address => Resolution) public resolutions; // market => resolution
    mapping(address => bool) public authorizedResolvers;
    
    address public admin;

    event ResolutionProposed(address indexed market, address indexed resolver, bool outcome, string evidence);
    event ResolutionExecuted(address indexed market, bool outcome);
    event ResolverAuthorized(address indexed resolver);
    event ResolverRevoked(address indexed resolver);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedResolvers[msg.sender] || msg.sender == admin, "Not authorized");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedResolvers[msg.sender] = true;
    }

    /**
     * @notice Authorize a resolver
     */
    function authorizeResolver(address resolver) external onlyAdmin {
        authorizedResolvers[resolver] = true;
        emit ResolverAuthorized(resolver);
    }

    /**
     * @notice Revoke resolver authorization
     */
    function revokeResolver(address resolver) external onlyAdmin {
        authorizedResolvers[resolver] = false;
        emit ResolverRevoked(resolver);
    }

    /**
     * @notice Propose resolution for a market
     * @param market Address of the DateMarket contract
     * @param outcome true for YES, false for NO
     * @param evidence Link to evidence (optional)
     */
    function proposeResolution(
        address market,
        bool outcome,
        string memory evidence
    ) external onlyAuthorized {
        require(market != address(0), "Invalid market");
        require(resolutions[market].resolver == address(0), "Already proposed");

        DateMarket dateMarket = DateMarket(market);
        require(!dateMarket.resolved(), "Market already resolved");
        require(block.timestamp >= dateMarket.resolutionTime(), "Too early");

        resolutions[market] = Resolution({
            resolver: msg.sender,
            outcome: outcome,
            timestamp: block.timestamp,
            evidence: evidence,
            executed: false
        });

        emit ResolutionProposed(market, msg.sender, outcome, evidence);
    }

    /**
     * @notice Execute the proposed resolution
     * For MVP: Instant execution
     * Future: Add delay for dispute period
     */
    function executeResolution(address market) external onlyAuthorized {
        Resolution storage resolution = resolutions[market];
        require(resolution.resolver != address(0), "No resolution proposed");
        require(!resolution.executed, "Already executed");

        DateMarket dateMarket = DateMarket(market);
        require(!dateMarket.resolved(), "Market already resolved");

        // Execute resolution on the market contract
        dateMarket.resolve(resolution.outcome);
        resolution.executed = true;

        emit ResolutionExecuted(market, resolution.outcome);
    }

    /**
     * @notice Quick resolve (propose + execute in one transaction)
     * Useful for demo/testing
     */
    function quickResolve(
        address market,
        bool outcome,
        string memory evidence
    ) external onlyAuthorized {
        require(market != address(0), "Invalid market");
        
        DateMarket dateMarket = DateMarket(market);
        require(!dateMarket.resolved(), "Market already resolved");
        
        // For creator markets, creator can resolve directly
        require(
            msg.sender == dateMarket.creator() || authorizedResolvers[msg.sender],
            "Not authorized"
        );

        resolutions[market] = Resolution({
            resolver: msg.sender,
            outcome: outcome,
            timestamp: block.timestamp,
            evidence: evidence,
            executed: true
        });

        dateMarket.resolve(outcome);

        emit ResolutionProposed(market, msg.sender, outcome, evidence);
        emit ResolutionExecuted(market, outcome);
    }

    /**
     * @notice Get resolution details
     */
    function getResolution(address market) external view returns (
        address resolver,
        bool outcome,
        uint256 timestamp,
        string memory evidence,
        bool executed
    ) {
        Resolution memory res = resolutions[market];
        return (res.resolver, res.outcome, res.timestamp, res.evidence, res.executed);
    }
}
