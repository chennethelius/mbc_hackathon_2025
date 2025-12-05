# How to Get Testnet USDC on Base Sepolia

## Your Wallet Address
`0x24A95C49E7DFd830C0cEe2D0a357553D548c4556`

## USDC Contract Address (Base Sepolia)
`0x537dab0C9d23d2cE30a5898E42C07b1840a227Df`

## Option 1: Mint from MockUSDC Contract (EASIEST)

Since we're using MockUSDC with a public `mint()` function, you can mint USDC yourself!

### Steps:
1. Go to Base Sepolia block explorer: https://sepolia.basescan.org/address/0x537dab0C9d23d2cE30a5898E42C07b1840a227Df#writeContract

2. Click "Connect to Web3" and connect your wallet

3. Find the `mint` function

4. Enter:
   - `to`: `0x24A95C49E7DFd830C0cEe2D0a357553D548c4556` (your address)
   - `amount`: `1000000000` (this is 1000 USDC with 6 decimals)

5. Click "Write" and confirm the transaction

## Option 2: Use Faucet Script (if we add one)

We can create a script that mints USDC to your address automatically.

## Option 3: Circle Testnet Faucet

If using real Circle USDC testnet:
- Visit Circle's testnet faucet (if available)
- Or bridge from Ethereum Sepolia

## Current Status
- Your USDC Balance: **0 USDC**
- Required for 32 USDC bet: **32 USDC**
- You need: **At least 32 USDC** (recommend getting 1000+ for testing)
