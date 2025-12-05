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
    const { user_id, market_id, contract_address, wallet_address, position, amount, transaction_hash } = req.body;

    // Validation
    if (!user_id || !contract_address || !wallet_address || typeof position !== 'boolean' || !amount) {
      return res.status(400).json({ error: 'Missing required fields: user_id, contract_address, wallet_address, position, amount' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Create bet record
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id,
        market_id: market_id || null,
        contract_address,
        wallet_address,
        position,
        amount,
        transaction_hash: transaction_hash || null,
        claimed: false
      })
      .select()
      .single();

    if (betError) throw betError;

    res.status(201).json({ success: true, bet });
  } catch (error) {
    console.error('Error placing bet:', error);
    res.status(500).json({ success: false, error: error.message });
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
