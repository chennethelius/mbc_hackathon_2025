import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get all bets for a market
router.get('/market/:marketId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url)
      `)
      .eq('market_id', req.params.marketId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ bets: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all bets by user
router.get('/user/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        market:markets(id, title, status, outcome)
      `)
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ bets: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Place a bet
router.post('/', async (req, res) => {
  try {
    const { market_id, user_id, position, amount } = req.body;

    // Validation
    if (!market_id || !user_id || typeof position !== 'boolean' || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Check if market exists and is active
    const { data: market, error: marketError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', market_id)
      .single();

    if (marketError) throw marketError;
    if (!market) return res.status(404).json({ error: 'Market not found' });
    if (market.status !== 'active') {
      return res.status(400).json({ error: 'Market is not active' });
    }

    // Create bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        market_id,
        user_id,
        position,
        amount,
        status: 'active'
      })
      .select()
      .single();

    if (betError) throw betError;

    // Update market pool
    const poolColumn = position ? 'total_yes_pool' : 'total_no_pool';
    const currentPool = parseFloat(market[poolColumn]);
    const newPool = currentPool + parseFloat(amount);

    await supabase
      .from('markets')
      .update({ [poolColumn]: newPool })
      .eq('id', market_id);

    // Update user's bet count
    await supabase.rpc('increment', {
      table_name: 'profiles',
      row_id: user_id,
      column_name: 'total_bets_placed'
    });

    res.status(201).json({ bet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get bet by ID
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        user:profiles(id, email, full_name, avatar_url),
        market:markets(*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Bet not found' });

    res.json({ bet: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
