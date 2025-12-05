# Dating Bet Market System Design

## Flow Overview

### 1. Match Creation (Person A matches Friend B + Girl C)
```
Person A (Matchmaker) → Creates match proposal
  ├── Friend B (gets notified)
  └── Girl C (gets notified, must accept)
```

### 2. Girl C Accepts & Sets Date
```
Girl C accepts match
  ├── Sets date/time for the date
  └── This becomes the bet expiry time
  └── Triggers market creation
```

### 3. Market Creation (Automatic)
```
Market created with:
  ├── Participants: Friend B & Girl C
  ├── Expiry: Date time set by Girl C
  └── Eligible Bettors: Only vouchers for B & C
```

### 4. Betting Phase
```
Only people who vouched for Friend B OR Girl C can bet
  ├── Bet YES (date goes well)
  └── Bet NO (date flops)
```

### 5. Resolution Phase
```
After date time expires:
  ├── Friend B votes YES/NO
  ├── Girl C votes YES/NO
  └── Both YES = Market resolves YES
  └── Anything else = Market resolves NO
```

### 6. Payout Phase
```
Winners claim their share:
  ├── Payout = (Your Bet / Winning Pool) × Total Pool
  └── Edge case: If no winners, everyone gets refunded
```

## Pari-Mutuel System Explanation

### How Payouts Work:

**Example 1: Normal betting**
- Alice bets 10 USDC on YES
- Bob bets 20 USDC on YES
- Charlie bets 30 USDC on NO
- Total pool: 60 USDC
- Outcome: YES wins

Alice's payout: (10 / 30) × 60 = **20 USDC** (2x return)
Bob's payout: (20 / 30) × 60 = **40 USDC** (2x return)
Charlie loses his 30 USDC

**Example 2: Everyone bets YES, YES wins**
- Alice bets 10 USDC on YES
- Bob bets 20 USDC on YES
- Charlie bets 30 USDC on YES
- Total pool: 60 USDC
- Outcome: YES wins

Alice's payout: (10 / 60) × 60 = **10 USDC** (1x return, gets money back)
Bob's payout: (20 / 60) × 60 = **20 USDC** (1x return)
Charlie's payout: (30 / 60) × 60 = **30 USDC** (1x return)

**Example 3: Everyone bets YES, NO wins (EDGE CASE)**
- Alice bets 10 USDC on YES
- Bob bets 20 USDC on YES
- Charlie bets 30 USDC on YES
- Total pool: 60 USDC
- Outcome: NO wins
- NO pool: 0 USDC ⚠️

**Solution**: Refund everyone if winning pool is empty

## No AMM/Liquidity Pool Needed

**Why pari-mutuel is perfect:**
- ✅ No need for market maker
- ✅ No need for liquidity pools
- ✅ No price calculation needed
- ✅ Zero risk for the platform
- ✅ Winners always get paid from losers
- ✅ Simple, transparent, fair

**Differences from Polymarket/Kalshi:**
- Polymarket uses AMM (Automated Market Maker) with order books
- Kalshi uses CLOB (Central Limit Order Book)
- Both have dynamic pricing
- **We use pari-mutuel (fixed odds at resolution)**

Our system is simpler and better for small friend groups!

## Database Schema Additions Needed

### 1. Match Proposals Table
```sql
CREATE TABLE match_proposals (
  id UUID PRIMARY KEY,
  matchmaker_id UUID REFERENCES profiles(id),
  friend_b_id UUID REFERENCES profiles(id),
  girl_c_id UUID REFERENCES profiles(id),
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  date_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Vouchers Table
```sql
CREATE TABLE vouchers (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  vouched_for_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, vouched_for_id)
);
```

### 3. Markets Table (link to blockchain)
```sql
CREATE TABLE markets (
  id UUID PRIMARY KEY,
  contract_address TEXT UNIQUE NOT NULL,
  match_proposal_id UUID REFERENCES match_proposals(id),
  friend_b_id UUID REFERENCES profiles(id),
  girl_c_id UUID REFERENCES profiles(id),
  resolution_time TIMESTAMP,
  resolved BOOLEAN DEFAULT FALSE,
  outcome BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4. Market Access (who can bet)
```sql
CREATE TABLE market_access (
  market_id UUID REFERENCES markets(id),
  user_id UUID REFERENCES profiles(id),
  reason TEXT, -- 'vouched_for_b' or 'vouched_for_c'
  PRIMARY KEY (market_id, user_id)
);
```

## Smart Contract Updates Needed

### 1. Add Access Control
```solidity
mapping(address => bool) public canBet;

function addEligibleBettor(address bettor) external {
    require(msg.sender == creator, "Only creator");
    canBet[bettor] = true;
}

function placeBet(bool position, uint256 amount) external {
    require(canBet[msg.sender], "Not eligible to bet");
    // ... rest of bet logic
}
```

### 2. Handle Empty Winning Pool
```solidity
function claimWinnings() external nonReentrant {
    require(resolved, "Market not resolved");
    
    Bet storage bet = bets[msg.sender];
    require(bet.amount > 0, "No bet placed");
    require(!bet.claimed, "Already claimed");
    
    uint256 payout;
    uint256 winningPool = outcome ? totalYesPool : totalNoPool;
    
    if (winningPool == 0) {
        // Edge case: No one bet on winning side, refund everyone
        payout = bet.amount;
    } else if (bet.position == outcome) {
        // Normal case: Winner gets share of total pool
        uint256 losingPool = outcome ? totalNoPool : totalYesPool;
        uint256 totalPool = winningPool + losingPool + totalSponsorships;
        payout = (bet.amount * totalPool) / winningPool;
    } else {
        // Loser case
        if (winningPool == 0) {
            // No winners, refund losers too
            payout = bet.amount;
        } else {
            // Normal loss, no payout
            payout = 0;
        }
    }
    
    bet.claimed = true;
    
    if (payout > 0) {
        require(usdcToken.transfer(msg.sender, payout), "USDC transfer failed");
        emit WinningsClaimed(msg.sender, payout);
    }
}
```

## Implementation Steps

1. ✅ **Keep current pari-mutuel contract** (it's perfect)
2. **Add voucher system** to database
3. **Add match proposal flow** (Person A → Friend B & Girl C)
4. **Add acceptance flow** (Girl C accepts, sets date time)
5. **Auto-create market** when Girl C accepts
6. **Populate eligible bettors** (vouchers for B & C)
7. **Add access control** to contract
8. **Handle edge cases** in claim function
9. **Build UI** for match proposals and betting

## Why This Works

✅ **No AMM needed** - Pari-mutuel handles everything
✅ **No liquidity pools** - Bettors provide all liquidity
✅ **No platform risk** - Money flows peer-to-peer
✅ **Fair odds** - Everyone sees final odds at resolution
✅ **Simple** - Easy to understand and trust
✅ **Gas efficient** - Minimal smart contract complexity

## Next Steps

1. Update DateMarket.sol with access control
2. Create match proposal endpoints
3. Create voucher system endpoints
4. Build match proposal UI
5. Build betting UI with access checks
6. Deploy and test!
