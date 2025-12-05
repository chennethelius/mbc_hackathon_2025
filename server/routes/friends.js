import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Get user's friends
router.get('/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        user1:profiles!friendships_user_id_1_fkey(id, email, full_name, avatar_url),
        user2:profiles!friendships_user_id_2_fkey(id, email, full_name, avatar_url)
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) throw error;

    // Format response to show the friend (not the requesting user)
    const friends = data.map(friendship => {
      const friend = friendship.user_id_1 === userId ? friendship.user2 : friendship.user1;
      return {
        ...friendship,
        friend
      };
    });

    res.json({ friends });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send friend request
router.post('/request', async (req, res) => {
  try {
    const { user_id_1, user_id_2 } = req.body;

    if (!user_id_1 || !user_id_2) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (user_id_1 === user_id_2) {
      return res.status(400).json({ error: 'Cannot friend yourself' });
    }

    // Ensure consistent ordering (user_id_1 < user_id_2)
    const [id1, id2] = [user_id_1, user_id_2].sort();

    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id_1: id1,
        user_id_2: id2,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(400).json({ error: 'Friend request already exists' });
      }
      throw error;
    }

    res.status(201).json({ friendship: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Accept friend request
router.post('/:friendshipId/accept', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', req.params.friendshipId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Friendship not found' });

    res.json({ friendship: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get pending friend requests for a user
router.get('/:userId/pending', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        user1:profiles!friendships_user_id_1_fkey(id, email, full_name, avatar_url),
        user2:profiles!friendships_user_id_2_fkey(id, email, full_name, avatar_url)
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'pending');

    if (error) throw error;

    res.json({ pendingRequests: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
