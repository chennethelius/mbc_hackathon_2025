// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title DateMarket
 * @notice Simple binary prediction market for dating outcomes
 * Uses pari-mutuel betting system
 */
contract DateMarket is ReentrancyGuard {
    IERC20 public immutable usdcToken;
    address public immutable creator; // Matchmaker
    address public immutable friend1;
    address public immutable friend2;
    string public title;
    uint256 public immutable resolutionTime;
    
    uint256 public totalYesPool;
    uint256 public totalNoPool;
    uint256 public totalSponsorships;
    
    bool public resolved;
    bool public outcome; // true = YES, false = NO
    
    struct Bet {
        uint256 amount;
        bool position; // true = YES, false = NO
        bool claimed;
    }
    
    mapping(address => Bet) public bets;
    address[] public bettors;
    
    event BetPlaced(address indexed user, bool position, uint256 amount);
    event SponsorshipAdded(address indexed sponsor, uint256 amount);
    event MarketResolved(bool outcome, uint256 timestamp);
    event WinningsClaimed(address indexed user, uint256 amount);

    constructor(
        address _usdcToken,
        address _creator,
        address _friend1,
        address _friend2,
        string memory _title,
        uint256 _resolutionTime
    ) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_creator != address(0), "Invalid creator");
        require(_friend1 != address(0) && _friend2 != address(0), "Invalid friends");
        
        usdcToken = IERC20(_usdcToken);
        creator = _creator;
        friend1 = _friend1;
        friend2 = _friend2;
        title = _title;
        resolutionTime = _resolutionTime;
    }

    /**
     * @notice Place a bet on the market
     * @param position true for YES, false for NO
     * @param amount Amount of USDC to bet (in USDC decimals, typically 6)
     */
    function placeBet(bool position, uint256 amount) external nonReentrant {
        require(!resolved, "Market already resolved");
        require(block.timestamp < resolutionTime, "Market closed");
        require(amount > 0, "Amount must be positive");
        require(bets[msg.sender].amount == 0, "Already placed bet");

        // Transfer USDC from user to contract
        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        // Record bet
        bets[msg.sender] = Bet({
            amount: amount,
            position: position,
            claimed: false
        });
        
        bettors.push(msg.sender);

        // Update pools
        if (position) {
            totalYesPool += amount;
        } else {
            totalNoPool += amount;
        }

        emit BetPlaced(msg.sender, position, amount);
    }

    /**
     * @notice Add sponsorship to boost the prize pool
     * @param amount Amount of USDC to sponsor
     */
    function addSponsorship(uint256 amount) external nonReentrant {
        require(!resolved, "Market already resolved");
        require(amount > 0, "Amount must be positive");

        require(
            usdcToken.transferFrom(msg.sender, address(this), amount),
            "USDC transfer failed"
        );

        totalSponsorships += amount;

        emit SponsorshipAdded(msg.sender, amount);
    }

    /**
     * @notice Resolve the market (manual - only creator can resolve)
     * @param _outcome true if outcome is YES, false if NO
     */
    function resolve(bool _outcome) external {
        require(msg.sender == creator, "Only creator can resolve");
        require(!resolved, "Already resolved");
        require(block.timestamp >= resolutionTime, "Too early to resolve");

        resolved = true;
        outcome = _outcome;

        emit MarketResolved(_outcome, block.timestamp);
    }

    /**
     * @notice Claim winnings after market is resolved
     */
    function claimWinnings() external nonReentrant {
        require(resolved, "Market not resolved");
        
        Bet storage bet = bets[msg.sender];
        require(bet.amount > 0, "No bet placed");
        require(!bet.claimed, "Already claimed");
        require(bet.position == outcome, "Bet lost");

        // Calculate payout using pari-mutuel formula
        uint256 winningPool = outcome ? totalYesPool : totalNoPool;
        uint256 losingPool = outcome ? totalNoPool : totalYesPool;
        uint256 totalPool = winningPool + losingPool + totalSponsorships;
        
        require(winningPool > 0, "No winning pool");
        
        // Payout = (user bet / winning pool) * total pool
        uint256 payout = (bet.amount * totalPool) / winningPool;
        
        bet.claimed = true;

        require(usdcToken.transfer(msg.sender, payout), "USDC transfer failed");

        emit WinningsClaimed(msg.sender, payout);
    }

    /**
     * @notice Get current odds (percentage YES)
     */
    function getCurrentOdds() external view returns (uint256 yesPercentage, uint256 noPercentage) {
        uint256 total = totalYesPool + totalNoPool;
        if (total == 0) {
            return (50, 50);
        }
        yesPercentage = (totalYesPool * 100) / total;
        noPercentage = 100 - yesPercentage;
    }

    /**
     * @notice Get total pool size
     */
    function getTotalPool() external view returns (uint256) {
        return totalYesPool + totalNoPool + totalSponsorships;
    }

    /**
     * @notice Get user's bet information
     */
    function getUserBet(address user) external view returns (uint256 amount, bool position, bool claimed) {
        Bet memory bet = bets[user];
        return (bet.amount, bet.position, bet.claimed);
    }

    /**
     * @notice Get number of bettors
     */
    function getBettorCount() external view returns (uint256) {
        return bettors.length;
    }
}
