# Dating Prediction Markets 💘

A decentralized dating prediction market built on Base Sepolia where friends can create matches, vouch for each other, and bet on romantic outcomes using USDC.

## 🎯 Overview

This application combines social matchmaking with prediction markets:
- **Matchmakers** create matches between friends and matched persons
- **Vouched friends** or **matched persons** can accept proposals
- **Eligible bettors** predict outcomes with USDC on Base blockchain
- **Pari-mutuel betting** system distributes winnings proportionally

## 🏗️ Tech Stack

### Frontend
- **React** + **Vite** - Fast development and build
- **Privy** - Wallet authentication and management
- **Wagmi** - Ethereum interactions
- **Supabase** - Database and real-time features
- **Base Sepolia** - L2 blockchain network

### Backend
- **Node.js** + **Express** - REST API server
- **Ethers.js** - Smart contract interactions
- **Supabase** - PostgreSQL database
- **Base Sepolia RPC** - Blockchain connectivity

### Smart Contracts
- **DateMarket.sol** - Individual prediction markets with pari-mutuel betting
- **MarketFactory.sol** - Factory pattern for creating new markets
- **MockUSDC.sol** - Testnet USDC for betting (6 decimals)

## 📋 Prerequisites

- **Node.js** v18+ and npm
- **Git**
- **Supabase Account** (for database)
- **Privy Account** (for authentication)
- **Base Sepolia ETH** (for gas fees)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mbc_hackathon_2025
```

### 2. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Set Up Environment Variables

You'll need to create two `.env` files - one for the frontend and one for the backend.

#### Frontend Environment (.env in root directory)

Create a `.env` file in the project root:

```bash
# Create the file
touch .env

# Add these variables (use your actual values)
echo 'VITE_SUPABASE_URL=https://your-project.supabase.co' >> .env
echo 'VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here' >> .env
echo 'VITE_PRIVY_APP_ID=your_privy_app_id_here' >> .env
```

**Where to get these values:**
- **VITE_SUPABASE_URL** & **VITE_SUPABASE_ANON_KEY**: Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Settings → API
- **VITE_PRIVY_APP_ID**: Go to [Privy Dashboard](https://dashboard.privy.io/) → Your App → Settings → Basics

#### Backend Environment (server/.env)

Create a `server/.env` file:

```bash
# Create the file
cd server
touch .env

# Add these variables (use your actual values)
echo 'SUPABASE_URL=https://your-project.supabase.co' >> .env
echo 'SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here' >> .env
echo 'BLOCKCHAIN_RPC_URL=https://sepolia.base.org' >> .env
echo 'BLOCKCHAIN_PRIVATE_KEY=your_private_key_here' >> .env
cd ..
```

**Where to get these values:**
- **SUPABASE_URL**: Same as frontend, from Supabase Dashboard → Settings → API
- **SUPABASE_SERVICE_ROLE_KEY**: Supabase Dashboard → Settings → API → `service_role` key (⚠️ Keep secret!)
- **BLOCKCHAIN_RPC_URL**: Use `https://sepolia.base.org` for Base Sepolia testnet
- **BLOCKCHAIN_PRIVATE_KEY**: Export from MetaMask or create new wallet (⚠️ Use testnet wallet only!)

**Important Security Notes:**
- Never commit `.env` files to git (already in `.gitignore`)
- The `BLOCKCHAIN_PRIVATE_KEY` should be a **testnet wallet** funded with Base Sepolia ETH
- The backend wallet will create markets and add eligible bettors
- You can get Base Sepolia ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)

**Example .env Template Files:**

Create `.env.example` in root:
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_PRIVY_APP_ID=
```

Create `server/.env.example`:
```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
BLOCKCHAIN_RPC_URL=https://sepolia.base.org
BLOCKCHAIN_PRIVATE_KEY=
```

### 4. Set Up Supabase Database

Run these SQL migrations in your Supabase SQL Editor (in order):

1. **supabase_migration.sql** - Creates initial tables
2. **rename_columns_migration.sql** - Updates to gender-neutral schema
3. **photo_gallery_migration.sql** - Adds photo gallery features
4. **friends_complete.sql** - Friends system tables
5. **bets_table_migration.sql** - Betting records table

Key tables:
- `users` - User profiles and Privy IDs
- `wallets` - Blockchain wallet addresses linked to users
- `match_proposals` - Match creation and acceptance
- `markets` - Blockchain market contracts
- `bets` - Record of all bets placed
- `friends` - Friend relationships
- `vouchers` - Optional voucher system for betting eligibility

### 5. Deploy Smart Contracts (Optional)

If you need to deploy new contracts:

```bash
cd contracts
# Deploy using your preferred tool (Hardhat, Foundry, or Remix)
# Update contract addresses in:
# - server/routes/matchProposals.js (MARKET_FACTORY_ADDRESS)
# - src/pages/Markets.jsx (MARKET_FACTORY_ADDRESS)
```

**Current Deployed Addresses (Base Sepolia):**
- MockUSDC: `0x537dab0C9d23d2cE30a5898E42C07b1840a227Df`
- MarketFactory: `0x200aC27d73eDd6E469C842b7EFb60CFcf9059773`

### 6. Run the Application

Open two terminal windows:

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
Server runs on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend runs on `http://localhost:5173`

### 7. Get Test USDC

To place bets, you need MockUSDC tokens:

**Option A: Mint via Block Explorer**
1. Go to [Base Sepolia Explorer](https://sepolia.basescan.org/address/0x537dab0C9d23d2cE30a5898E42C07b1840a227Df#writeContract)
2. Connect your wallet
3. Call `mint(address to, uint256 amount)` with your address and `1000000000` (1000 USDC)

**Option B: Use Backend Script**
```bash
cd server
# Edit mint_usdc.mjs with your address
node mint_usdc.mjs
```

## 📱 How to Use

### Create a Match
1. Go to **Home** page
2. Click "Create Match"
3. Select a friend you're vouching for
4. Select someone to match them with
5. Set a resolution date

### Accept a Match
1. If you're the **matched person** (person C), go to **Notifications**
2. View pending match proposals
3. Click "Accept" with a future date
4. This creates a blockchain market automatically

### Place Bets
1. Go to **Markets** tab
2. Find an active market
3. Click **Bet YES** or **Bet NO**
4. Enter USDC amount
5. Approve USDC spending (first time)
6. Confirm bet transaction

### Resolve Markets
1. When resolution date passes, both friends vote on outcome
2. Go to market details
3. Each person submits their vote (YES/NO)
4. Market resolves when both vote

### Claim Winnings
1. After market resolves, winners see "Claim Winnings" button
2. Click to claim your proportional share of the prize pool
3. USDC transferred to your wallet

## 🔧 Development

### Project Structure

```
mbc_hackathon_2025/
├── src/                      # Frontend React app
│   ├── components/           # Reusable UI components
│   ├── pages/               # Main app pages
│   ├── services/            # API and service integrations
│   └── hooks/               # Custom React hooks
├── server/                  # Backend Node.js API
│   ├── routes/              # API endpoints
│   ├── config/              # Configuration files
│   └── utils/               # Utility functions
├── contracts/               # Solidity smart contracts
│   ├── DateMarket.sol
│   ├── MarketFactory.sol
│   └── MockUSDC.sol
└── public/                  # Static assets
```

### Key Features

#### Gender-Neutral Matching System
- **Matchmaker** (Person A): Creates the match
- **Vouched Friend** (Person B): Friend being vouched for
- **Matched Person** (Person C): Person matched with friend B

#### Access Control
- When no vouchers exist, **all users** can bet on markets
- When vouchers exist, only vouched users can bet
- Smart contract enforces `canBet` mapping

#### Pari-Mutuel Betting
- All bets go into YES or NO pools
- Winners split the total pool proportionally to their bet amounts
- No house edge - peer-to-peer betting

## 🐛 Troubleshooting

### "Not eligible to bet on this market"
- Check you have MockUSDC (not another USDC contract)
- Verify the market was created after the bettor-adding fix
- Use contract address: `0x537dab0C9d23d2cE30a5898E42C07b1840a227Df`

### "Market already exists for this pair"
- Factory prevents duplicate markets for same friend pair
- Create a match with different people
- Each unique pair can only have one market

### "Insufficient USDC"
- Mint MockUSDC tokens (see step 7 above)
- Check you're using the correct USDC contract

### Backend "Wallet not configured"
- Ensure `BLOCKCHAIN_PRIVATE_KEY` is set in `server/.env`
- Wallet needs Base Sepolia ETH for gas fees

## 🎓 For Hackathon Judges

### Innovation Highlights

1. **Social + DeFi Integration**: Combines friend vouching with prediction markets
2. **Gender-Neutral Design**: Inclusive matchmaking system
3. **Pari-Mutuel on L2**: Efficient betting on Base with low gas costs
4. **Privy Integration**: Seamless onboarding with email/social login
5. **Real-time Updates**: Supabase for live notifications and data sync

### Circle USDC Integration

This project uses USDC (via MockUSDC for testnet) as the core betting currency:
- All bets denominated in USDC
- ERC-20 approve/transfer pattern
- 6 decimal precision matching real USDC
- Ready for mainnet Circle USDC integration

### Future Enhancements
- Circle Programmable Wallets for gasless transactions
- Cross-chain support via CCTP
- USDC yield on prize pools
- Social graph expansion with more friend features

## 📄 License

MIT License - Built for MBC Hackathon 2025

## 🤝 Contributing

This is a hackathon project. Feel free to fork and build upon it!

---

Built with ❤️ for Base x Circle Hackathon
