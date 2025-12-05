# Dating Prediction Market - Smart Contracts

## Overview
Smart contracts for a dating prediction market platform on Base Sepolia testnet.

## Contracts

### 1. MockUSDC.sol
- Test USDC token with faucet functionality
- 6 decimals (matching real USDC)
- Anyone can mint 1000 USDC from faucet

### 2. MarketFactory.sol
- Creates DateMarket contracts
- Tracks all markets by creator and friend pairs
- Prevents duplicate markets for same friend pair

### 3. DateMarket.sol
- Binary prediction market (YES/NO)
- Pari-mutuel betting system
- Supports sponsorships to boost prize pools
- Creator can resolve manually

### 4. MarketResolver.sol
- Manages market resolution
- Supports multi-party verification (optional)
- Quick resolve function for demo

## Deployment to Base Sepolia

### Option 1: Using Remix IDE (Easiest for Hackathon)

1. **Deploy MockUSDC**
   - Open https://remix.ethereum.org
   - Create new file `MockUSDC.sol` and paste contract code
   - Install OpenZeppelin: Settings → Plugin Manager → Enable "OpenZeppelin"
   - Compile with Solidity 0.8.20
   - Deploy:
     - Environment: "Injected Provider - MetaMask"
     - Network: Base Sepolia (Chain ID: 84532)
     - Click Deploy
   - **Save the deployed USDC address**

2. **Deploy MarketFactory**
   - Create `MarketFactory.sol` and `DateMarket.sol` in Remix
   - Compile MarketFactory
   - Deploy with constructor parameter: `<USDC_ADDRESS>`
   - **Save the MarketFactory address**

3. **Deploy MarketResolver**
   - Create `MarketResolver.sol`
   - Compile and deploy (no constructor params)
   - **Save the MarketResolver address**

### Option 2: Using Hardhat/Foundry

```bash
# Install Hardhat
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

# Initialize
npx hardhat init

# Deploy script (save as scripts/deploy.js)
```

## Configuration

After deployment, update `server/.env`:

```env
BASE_RPC_URL=https://sepolia.base.org
USDC_CONTRACT_ADDRESS=<deployed_mock_usdc_address>
MARKET_FACTORY_ADDRESS=<deployed_factory_address>
MARKET_RESOLVER_ADDRESS=<deployed_resolver_address>
```

## Testing on Base Sepolia

1. **Get Test ETH**
   - Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
   - Or bridge from Goerli: https://bridge.base.org

2. **Get Test USDC**
   - Call `faucet()` on MockUSDC contract
   - Each call gives 1000 USDC

3. **Create a Market**
   ```javascript
   // Call MarketFactory.createMarket(friend1, friend2, "Will they go on a date?", futureTimestamp)
   ```

4. **Place Bets**
   ```javascript
   // 1. Approve USDC: MockUSDC.approve(marketAddress, amount)
   // 2. Place bet: DateMarket.placeBet(true/false, amount)
   ```

5. **Resolve Market**
   ```javascript
   // Creator: DateMarket.resolve(true/false)
   // Or via Resolver: MarketResolver.quickResolve(marketAddress, outcome, "evidence")
   ```

6. **Claim Winnings**
   ```javascript
   // Winners: DateMarket.claimWinnings()
   ```

## Contract Addresses (Update After Deployment)

```
Base Sepolia:
- MockUSDC: 0x...
- MarketFactory: 0x...
- MarketResolver: 0x...
```

## ABIs

After compilation in Remix:
1. Click on "Compilation Details"
2. Copy ABI
3. Save to `server/abis/` folder for backend integration

## Security Notes

⚠️ **FOR HACKATHON/TESTING ONLY**
- MockUSDC is NOT production-ready
- No access control on some functions
- No dispute mechanism
- No timelock on resolutions

For production:
- Use real Circle USDC
- Add multi-sig or DAO governance
- Implement dispute resolution
- Add circuit breakers
- Full security audit required
