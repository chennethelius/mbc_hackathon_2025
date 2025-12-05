# Dating Prediction Market - Deployment Guide

## Backend Deployment

### Quick Deploy to Railway

1. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

2. **Login and Deploy**
```bash
cd server
railway login
railway init
railway up
```

3. **Set Environment Variables**
```bash
railway variables set SUPABASE_URL=your_url
railway variables set SUPABASE_SERVICE_ROLE_KEY=your_key
railway variables set CIRCLE_API_KEY=your_circle_key
# ... set all other vars from .env.example
```

### Alternative: Render.com

1. Create new Web Service
2. Connect GitHub repo
3. Build Command: `cd server && npm install`
4. Start Command: `cd server && npm start`
5. Add environment variables in dashboard

## Smart Contract Deployment

### Using Remix (Recommended for Hackathon)

1. **Open Remix**: https://remix.ethereum.org

2. **Create Files**
   - Copy all contracts from `/contracts` folder
   - Install OpenZeppelin plugin

3. **Configure MetaMask**
   - Network: Base Sepolia
   - RPC URL: https://sepolia.base.org
   - Chain ID: 84532
   - Get test ETH from https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

4. **Deploy in Order**:
   
   a. **MockUSDC**
   - Compile with Solidity 0.8.20
   - Deploy (no constructor params)
   - **Save address** → Update `.env`: `USDC_CONTRACT_ADDRESS`
   
   b. **MarketFactory**
   - Constructor param: `<MockUSDC_address>`
   - Deploy
   - **Save address** → Update `.env`: `MARKET_FACTORY_ADDRESS`
   
   c. **MarketResolver** (Optional)
   - Deploy (no constructor params)
   - **Save address** → Update `.env`: `MARKET_RESOLVER_ADDRESS`

5. **Get ABIs**
   - In Remix, click "Compilation Details"
   - Copy ABI
   - Save to `server/abis/` if needed

### Using Hardhat (Advanced)

```bash
cd server
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox

npx hardhat init
```

Create `hardhat.config.js`:
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [process.env.BLOCKCHAIN_PRIVATE_KEY],
      chainId: 84532
    }
  }
};
```

Deploy script:
```javascript
// scripts/deploy.js
async function main() {
  // Deploy MockUSDC
  const MockUSDC = await ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.deployed();
  console.log("MockUSDC deployed to:", usdc.address);

  // Deploy MarketFactory
  const MarketFactory = await ethers.getContractFactory("MarketFactory");
  const factory = await MarketFactory.deploy(usdc.address);
  await factory.deployed();
  console.log("MarketFactory deployed to:", factory.address);
}

main();
```

## Frontend Deployment

### Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Deploy**
```bash
vercel
```

3. **Set Environment Variables**
```bash
vercel env add VITE_SUPABASE_URL
vercel env add VITE_PRIVY_APP_ID
# ... add all VITE_ prefixed vars
```

### Netlify

1. Connect GitHub repo
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables

## Post-Deployment Checklist

### 1. Update Frontend Config

Create `src/config/contracts.js`:
```javascript
export const CONTRACTS = {
  USDC: '0x...deployed_usdc_address',
  MARKET_FACTORY: '0x...deployed_factory_address',
  CHAIN_ID: 84532, // Base Sepolia
  RPC_URL: 'https://sepolia.base.org'
};
```

### 2. Update Backend `.env`

```env
USDC_CONTRACT_ADDRESS=0x...
MARKET_FACTORY_ADDRESS=0x...
MARKET_RESOLVER_ADDRESS=0x...
```

### 3. Test End-to-End

1. **Get Test USDC**
   - Call `faucet()` on MockUSDC contract
   - Or use Remix to call the function

2. **Create Test Market**
   ```bash
   curl -X POST https://your-api.railway.app/api/markets \
     -H "Content-Type: application/json" \
     -d '{"matchmaker_id":"...","friend_1_id":"...","friend_2_id":"...","title":"Test Market"}'
   ```

3. **Test Payment Flow**
   - Deposit → Bet → Resolve → Claim Winnings

### 4. Configure Circle Webhooks

1. Go to Circle Dashboard
2. Set webhook URL: `https://your-api.railway.app/api/payments/webhook/circle`
3. Subscribe to events:
   - `payment.confirmed`
   - `payment.failed`

## Monitoring

### Backend Health Check
```bash
curl https://your-api.railway.app/health
```

Should return:
```json
{"status":"ok","message":"Dating Market API is running"}
```

### Contract Verification (Optional)

On Base Sepolia Explorer:
1. Find your deployed contract
2. Click "Verify Contract"
3. Paste source code
4. Verify compiler settings match

## Troubleshooting

### Common Issues

**"Cannot connect to database"**
- Check Supabase URL and keys
- Verify RLS policies allow operations

**"Insufficient funds for gas"**
- Get Base Sepolia ETH from faucet
- Check wallet has enough ETH

**"Circle API 401 Unauthorized"**
- Verify API key is correct
- Check sandbox vs production mode

**"Market already exists for this pair"**
- Expected behavior - one market per friend pair
- Use different friend combinations

## Security Notes

⚠️ **Before Going Live:**
- [ ] Replace MockUSDC with real Circle USDC
- [ ] Add rate limiting to API
- [ ] Implement proper authentication
- [ ] Add CORS restrictions
- [ ] Enable HTTPS only
- [ ] Audit smart contracts
- [ ] Add circuit breakers
- [ ] Implement multi-sig for contract ownership

## Support

For issues:
1. Check logs: `railway logs` or in dashboard
2. Verify environment variables
3. Test contracts on Remix
4. Check API responses with curl

## Next Steps

1. Deploy contracts to Base Sepolia
2. Deploy backend to Railway
3. Deploy frontend to Vercel
4. Update all addresses and URLs
5. Test full flow
6. Demo time! 🚀
