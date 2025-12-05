import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get all active markets
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select(`
        *,
        matchmaker:profiles!markets_matchmaker_id_fkey(id, email, full_name, avatar_url),
        friend_1:profiles!markets_friend_1_id_fkey(id, email, full_name, avatar_url),
        friend_2:profiles!markets_friend_2_id_fkey(id, email, full_name, avatar_url)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ markets: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get market by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('markets')
      .select(`
        *,
        matchmaker:profiles!markets_matchmaker_id_fkey(id, email, full_name, avatar_url),
        friend_1:profiles!markets_friend_1_id_fkey(id, email, full_name, avatar_url),
        friend_2:profiles!markets_friend_2_id_fkey(id, email, full_name, avatar_url),
        bets(id, user_id, position, amount, status)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Market not found' });

    // Calculate odds
    const totalPool = parseFloat(data.total_yes_pool) + parseFloat(data.total_no_pool);
    const yesOdds = totalPool > 0 ? (parseFloat(data.total_yes_pool) / totalPool) * 100 : 50;
    const noOdds = 100 - yesOdds;

    res.json({
      market: {
        ...data,
        odds: {
          yes: yesOdds.toFixed(2),
          no: noOdds.toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new market
router.post('/', async (req, res) => {
  try {
    const { matchmaker_id, friend_1_id, friend_2_id, title, description, resolution_date } = req.body;

    // Validation
    if (!matchmaker_id || !friend_1_id || !friend_2_id || !title) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (friend_1_id === friend_2_id) {
      return res.status(400).json({ error: 'Cannot create market with same person' });
    }

    // Create market
    const { data, error } = await supabase
      .from('markets')
      .insert({
        matchmaker_id,
        friend_1_id,
        friend_2_id,
        title,
        description,
        resolution_date,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // Update matchmaker's market count
    await supabase.rpc('increment', {
      table_name: 'profiles',
      row_id: matchmaker_id,
      column_name: 'total_markets_created'
    });

    res.status(201).json({ market: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve market (manual resolution)
router.post('/:id/resolve', async (req, res) => {
  try {
    const { outcome, resolver_id, evidence } = req.body;

    if (typeof outcome !== 'boolean') {
      return res.status(400).json({ error: 'Outcome must be true (YES) or false (NO)' });
    }

    const marketId = req.params.id;

    // Get market details
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*, bets(*)')
      .eq('id', marketId)
      .single();

    if (marketError) throw marketError;
    if (!market) return res.status(404).json({ error: 'Market not found' });

    if (market.status !== 'active') {
      return res.status(400).json({ error: 'Market is not active' });
    }

    // Calculate payouts
    const totalYesPool = parseFloat(market.total_yes_pool);
    const totalNoPool = parseFloat(market.total_no_pool);
    const totalPool = totalYesPool + totalNoPool;
    const winningPool = outcome ? totalYesPool : totalNoPool;
    const losingPool = outcome ? totalNoPool : totalYesPool;

    // Update market status
    const { error: updateError } = await supabase
      .from('markets')
      .update({
        status: 'resolved',
        outcome,
        resolved_at: new Date().toISOString()
      })
      .eq('id', marketId);

    if (updateError) throw updateError;

    // Create resolution record
    await supabase
      .from('market_resolutions')
      .insert({
        market_id: marketId,
        resolver_id,
        outcome,
        evidence,
        status: 'confirmed'
      });

    // Update bets and calculate payouts
    if (market.bets && market.bets.length > 0) {
      for (const bet of market.bets) {
        const betWon = bet.position === outcome;
        let actualPayout = 0;

        if (betWon && winningPool > 0) {
          // Pari-mutuel payout: (bet amount / winning pool) * total pool
          actualPayout = (parseFloat(bet.amount) / winningPool) * totalPool;
        }

        await supabase
          .from('bets')
          .update({
            status: betWon ? 'won' : 'lost',
            actual_payout: actualPayout
          })
          .eq('id', bet.id);

        // Update user's total winnings if they won
        if (betWon && actualPayout > 0) {
          await supabase.rpc('increment_decimal', {
            table_name: 'profiles',
            row_id: bet.user_id,
            column_name: 'total_winnings',
            amount: actualPayout
          });
        }
      }
    }

    res.json({
      message: 'Market resolved successfully',
      outcome: outcome ? 'YES' : 'NO',
      totalPool,
      winningPool,
      losingPool
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get markets by user (created by or involving user)
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const { data, error } = await supabase
      .from('markets')
      .select('*')
      .or(`matchmaker_id.eq.${userId},friend_1_id.eq.${userId},friend_2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ markets: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
