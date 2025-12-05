# Vouch System Implementation

## Overview
The vouching system is a reputation mechanism where users can vouch for their friends with points (0-5 stars). The system dynamically adjusts budgets based on date outcomes, creating a risk/reward mechanism that incentivizes accurate vouching.

## Features Implemented

### 1. Database Schema (`vouch_system_migration.sql`)
- **user_vouch_stats**: Stores user budget, allocations, and vouch scores
- **vouches**: Individual vouch records (who vouched for whom)
- **vouch_history**: Tracks all budget changes over time
- Automated triggers to update budgets when friendships change
- Automated calculation of vouch scores

### 2. Core Algorithm (`src/services/vouchService.js`)

#### Constants
- `BASE_BUDGET = 20.0` - Starting points for everyone
- `POINTS_PER_FRIEND = 3.0` - Points gained per friend added
- `REWARD_PER_POINT = 1.0` - Reward multiplier for successful dates
- `PENALTY_PER_POINT = 2.0` - Penalty multiplier for failed dates

#### Key Functions
- `initializeUserVouchStats(userId)` - Initialize vouch system for user
- `getUserVouchStats(userId)` - Get user's current budget and stats
- `setVouch(voucherId, voucheeId, points)` - Set/update a vouch (0-5)
- `getFriendVouches(userId)` - Get all friends with current vouch values
- `getVouchesReceived(userId)` - See who vouched for you
- `processDateOutcome(user1Id, user2Id, success)` - Update budgets after dates
- `getVouchHistory(userId)` - View budget change history

#### Algorithm Details

**Budget Calculation:**
```
initialBudget = BASE_BUDGET + (POINTS_PER_FRIEND × numFriends)
availableBudget = initialBudget - totalAllocated
```

**Vouch Score:**
```
vouchScore = average of all non-zero vouches received
Range: 0.0 to 5.0
```

**Date Outcomes:**
- **Success**: Vouchers gain `points × REWARD_PER_POINT` to their budget
- **Failure**: Vouchers lose `points × PENALTY_PER_POINT` from their budget
- Budget can never go below 0

### 3. User Interface

#### VouchTab Component
Main container with two sub-tabs:
1. **Vouch for Others** - Manage vouches you give
2. **Your Vouch Profile** - View your reputation

#### Vouch for Others (`VouchForOthers.jsx`)
**Features:**
- Dashboard showing:
  - Available points
  - Total budget
  - Number of vouches given
- Interactive star rating (0-5) for each friend
- Real-time budget updates
- Friend vouch scores displayed
- Clear vouch button
- Instructions on how the system works

#### Vouch Profile (`VouchProfile.jsx`)
**Features:**
- Hero section with large vouch score display (X.X / 5.0)
- Statistics: vouches received, current budget, points given
- List of who vouched for you and their ratings
- Vouch history with filters (All/Gains/Losses)
- Event types:
  - ✅ Date Success (gained points)
  - ❌ Date Failed (lost points)
  - 🎯 Vouch Given (spent points)
  - 🔄 Vouch Updated (adjusted allocation)
- Information cards explaining the system

### 4. Integration

The vouch system is integrated into the Friends page as a new tab with a ⭐ icon. The tab is visible alongside:
- All Friends
- Requests
- Sent
- Find Friends
- **Vouch** (NEW)

## Setup Instructions

### 1. Run Database Migration
Execute `vouch_system_migration.sql` in your Supabase SQL Editor:
```sql
-- This will create all necessary tables, functions, and triggers
-- Safe to run multiple times (uses IF NOT EXISTS)
```

### 2. The Frontend is Ready
All components are already integrated into the Friends page. No additional setup needed!

### 3. Testing the System

#### Basic Flow:
1. Navigate to Friends → Vouch tab
2. Click "Vouch for Others"
3. Rate your friends with 0-5 stars
4. Watch your budget update in real-time
5. Click "Your Vouch Profile" to see who vouched for you

#### Advanced Flow (Date Outcomes):
To test the dynamic budget feature, call the API:
```javascript
import { processDateOutcome } from './services/vouchService';

// After a successful date
await processDateOutcome(user1Id, user2Id, true);

// After a failed date
await processDateOutcome(user1Id, user2Id, false);
```

## Example Scenario

**Initial State:**
- Jess has 5 friends
- Budget: 20 + (3 × 5) = 35 points

**Jess Vouches:**
- Alex: 5 stars (costs 5 points)
- Sam: 3 stars (costs 3 points)
- Taylor: 2 stars (costs 2 points)
- Remaining budget: 35 - 10 = 25 points

**Date Outcomes:**

**Alex has a successful date:**
- Jess gave Alex 5 stars
- Jess gains: 5 × 1.0 = +5 points
- New budget: 30 points

**Sam has a failed date:**
- Jess gave Sam 3 stars
- Jess loses: 3 × 2.0 = -6 points
- New budget: 24 points

**Result:**
- Jess learned to be more careful about vouching highly
- Good vouchers accumulate more influence over time
- Bad vouchers are naturally throttled

## API Reference

### Get User Stats
```javascript
const result = await getUserVouchStats(userId);
// Returns: { success, stats: { budget, total_allocated, vouch_score, ... } }
```

### Set a Vouch
```javascript
const result = await setVouch(voucherId, friendId, points);
// points: 0-5
// Returns: { success, data } or { success: false, error }
```

### Get Friend Vouches
```javascript
const result = await getFriendVouches(userId);
// Returns list of friends with current vouch values
```

### Get Vouches Received
```javascript
const result = await getVouchesReceived(userId);
// Returns who vouched for you and their ratings
```

### Process Date Outcome
```javascript
const result = await processDateOutcome(user1Id, user2Id, true);
// true = success, false = failure
// Automatically updates all relevant vouchers' budgets
```

### Get History
```javascript
const result = await getVouchHistory(userId, limit);
// Returns array of budget change events
```

## Design Decisions

### Why 0-5 Stars?
- Intuitive rating system users understand
- Granular enough for meaningful differences
- Not too many options to cause decision paralysis

### Why Higher Penalty than Reward?
- Prevents careless vouching
- Encourages thoughtful, accurate assessments
- Creates real stakes for vouchers

### Why Budget Based on Friend Count?
- Rewards social engagement
- More friends = more data points = more influence
- Prevents single-friend gaming

### Why Average Instead of Sum?
- User with 1 five-star vouch should score high
- Quality over quantity
- Prevents popularity contests

## Future Enhancements

Possible additions:
1. **Vouch Reputation Score**: Separate score for vouching accuracy
2. **Weighted Averages**: Weight vouches by voucher's reputation
3. **Decay System**: Old vouches matter less over time
4. **Vouch Messages**: Let vouchers add comments
5. **Badges**: "Top Voucher", "Trusted Friend", etc.
6. **Leaderboards**: Most vouched users, best vouchers
7. **Vouch Requests**: Users can request vouches from friends

## Styling

All components use a consistent color scheme:
- Primary: `#667eea` (Purple)
- Success: `#28a745` (Green)
- Error: `#dc3545` (Red)
- Info: `#17a2b8` (Blue)
- Gold stars: `#FFD700`

Gradients: Purple to violet (`#667eea` → `#764ba2`)

## Files Created

1. `vouch_system_migration.sql` - Database schema
2. `src/services/vouchService.js` - Core algorithm & API
3. `src/components/VouchTab.jsx` - Main container
4. `src/components/VouchTab.css` - Tab styles
5. `src/components/VouchForOthers.jsx` - Vouching interface
6. `src/components/VouchForOthers.css` - Vouching styles
7. `src/components/VouchProfile.jsx` - Profile view
8. `src/components/VouchProfile.css` - Profile styles
9. `src/pages/Friends.jsx` - Updated with Vouch tab
10. `src/pages/Friends.css` - Updated with tab icon support

## Troubleshooting

**Budget shows 0 or negative:**
- Check if user stats are initialized
- Run `SELECT * FROM user_vouch_stats WHERE user_id = 'YOUR_ID'`
- If missing, call `initializeUserVouchStats(userId)`

**Vouch score not updating:**
- Triggers should handle this automatically
- Manually run: `SELECT recalculate_vouch_score('USER_ID')`

**Can't vouch for someone:**
- Ensure they're an accepted friend
- Check available budget
- Verify database connection

**History not showing:**
- Events are logged when vouches change or dates occur
- Check `vouch_history` table for records

## Support

For issues or questions:
1. Check database migrations ran successfully
2. Verify Supabase connection
3. Check browser console for errors
4. Review `vouchService.js` console logs (emoji-marked)

---

**System Status:** ✅ Fully Implemented & Ready to Use

Enjoy building reputation and trust in your community! 🌟

