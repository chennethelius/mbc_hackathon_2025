import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get user profile
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', req.params.userId)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'User not found' });

    res.json({ user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/:userId', async (req, res) => {
  try {
    const { full_name, avatar_url, wallet_address } = req.body;
    
    const updates = {};
    if (full_name !== undefined) updates.full_name = full_name;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (wallet_address !== undefined) updates.wallet_address = wallet_address;

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.params.userId)
      .select()
      .single();

    if (error) throw error;
    res.json({ user: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search users by email
router.get('/search/:query', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .ilike('email', `%${req.params.query}%`)
      .limit(10);

    if (error) throw error;
    res.json({ users: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
