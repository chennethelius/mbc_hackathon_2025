# Dating Prediction Market - Backend Setup

## Quick Start

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Circle API (for USDC payments)
CIRCLE_API_KEY=your_circle_sandbox_api_key

# Base Blockchain
BASE_RPC_URL=https://sepolia.base.org
BLOCKCHAIN_PRIVATE_KEY=your_private_key
MARKET_FACTORY_ADDRESS=deployed_factory_address
USDC_CONTRACT_ADDRESS=deployed_usdc_address

# Server
PORT=3001
NODE_ENV=development
```

### 3. Start Server
```bash
npm run dev
```

Server runs on http://localhost:3001

## API Endpoints

### Markets

#### GET /api/markets
Get all active markets
```json
{
  "markets": [...]
}
```

#### GET /api/markets/:id
Get specific market with odds
```json
{
  "market": {
    "id": "...",
    "title": "...",
    "odds": {
      "yes": "67.50",
      "no": "32.50"
    }
  }
}
```

#### POST /api/markets
Create new market
```json
{
  "matchmaker_id": "user_id",
  "friend_1_id": "friend1_id",
  "friend_2_id": "friend2_id",
  "title": "Will they go on a date?",
  "description": "...",
  "resolution_date": "2025-12-31T23:59:59Z"
}
```

#### POST /api/markets/:id/resolve
Manually resolve market
```json
{
  "outcome": true,
  "resolver_id": "user_id",
  "evidence": "They went on a date!"
}
```

### Bets

#### POST /api/bets
Place a bet
```json
{
  "market_id": "market_id",
  "user_id": "user_id",
  "position": true,
  "amount": 10.50
}
```

#### GET /api/bets/market/:marketId
Get all bets for a market

#### GET /api/bets/user/:userId
Get user's betting history

### Friends

#### GET /api/friends/:userId
Get user's friends

#### POST /api/friends/request
Send friend request
```json
{
  "user_id_1": "sender_id",
  "user_id_2": "recipient_id"
}
```

#### POST /api/friends/:friendshipId/accept
Accept friend request

### Payments (Circle USDC)

#### POST /api/payments/deposit
Deposit USDC
```json
{
  "user_id": "user_id",
  "amount": 100,
  "source": {"type": "card"}
}
```

#### POST /api/payments/withdraw
Withdraw USDC
```json
{
  "user_id": "user_id",
  "amount": 50,
  "destination_address": "0x..."
}
```

#### GET /api/payments/balance/:userId
Get user's USDC balance

#### GET /api/payments/transactions/:userId
Get transaction history

### Users

#### GET /api/users/:userId
Get user profile

#### PATCH /api/users/:userId
Update profile
```json
{
  "full_name": "John Doe",
  "wallet_address": "0x..."
}
```

#### GET /api/users/search/:query
Search users by email

## Testing

### Test Market Creation Flow

1. **Create Market**
```bash
curl -X POST http://localhost:3001/api/markets \
  -H "Content-Type: application/json" \
  -d '{
    "matchmaker_id": "user1_id",
    "friend_1_id": "friend1_id",
    "friend_2_id": "friend2_id",
    "title": "Will they go on a date?",
    "resolution_date": "2025-12-31T23:59:59Z"
  }'
```

2. **Place Bets**
```bash
curl -X POST http://localhost:3001/api/bets \
  -H "Content-Type: application/json" \
  -d '{
    "market_id": "market_id",
    "user_id": "user2_id",
    "position": true,
    "amount": 10
  }'
```

3. **Check Odds**
```bash
curl http://localhost:3001/api/markets/market_id
```

4. **Resolve Market**
```bash
curl -X POST http://localhost:3001/api/markets/market_id/resolve \
  -H "Content-Type: application/json" \
  -d '{
    "outcome": true,
    "resolver_id": "user1_id",
    "evidence": "Confirmed date happened!"
  }'
```

## Integration with Frontend

Add to your React app:

```javascript
const API_URL = 'http://localhost:3001/api';

// Create market
async function createMarket(data) {
  const response = await fetch(`${API_URL}/markets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}

// Place bet
async function placeBet(data) {
  const response = await fetch(`${API_URL}/bets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

## Circle API Setup

1. Sign up at https://www.circle.com/en/developers
2. Get sandbox API key
3. Configure webhook URL for payment notifications
4. Test with Circle's sandbox credit cards

## Deployment

### Deploy to Railway/Render/Heroku

1. Push code to GitHub
2. Connect repository
3. Set environment variables
4. Deploy

### Environment Variables for Production
- Use production Supabase instance
- Use Circle production API (after verification)
- Use Base mainnet RPC
- Set NODE_ENV=production

## Troubleshooting

### Database Errors
- Check Supabase connection
- Verify RLS policies allow operations
- Check foreign key constraints

### Circle API Errors
- Verify API key is valid
- Check sandbox vs production mode
- Review webhook configuration

### Blockchain Errors
- Ensure Base Sepolia RPC is accessible
- Check contract addresses are correct
- Verify wallet has Base Sepolia ETH for gas
