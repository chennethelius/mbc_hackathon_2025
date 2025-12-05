import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

/**
 * Get vouchers for a user (people who vouched for them)
 * GET /api/vouchers/:userId
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('vouchers')
      .select(`
        *,
        voucher:user_id(id, display_name, full_name, email)
      `)
      .eq('vouched_for_id', userId);

    if (error) throw error;

    res.json({ success: true, vouchers: data });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Get people a user has vouched for
 * GET /api/vouchers/:userId/given
 */
router.get('/:userId/given', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('vouchers')
      .select(`
        *,
        vouchedFor:vouched_for_id(id, display_name, full_name, email)
      `)
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ success: true, vouchers: data });
  } catch (error) {
    console.error('Error fetching given vouchers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create a voucher
 * POST /api/vouchers
 * Body: { userId, vouchedForId }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, vouchedForId } = req.body;

    if (!userId || !vouchedForId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId and vouchedForId required' 
      });
    }

    if (userId === vouchedForId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot vouch for yourself'
      });
    }

    const { data, error } = await supabase
      .from('vouchers')
      .insert({ user_id: userId, vouched_for_id: vouchedForId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          success: false,
          error: 'Already vouched for this person'
        });
      }
      throw error;
    }

    res.json({ success: true, voucher: data });
  } catch (error) {
    console.error('Error creating voucher:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Delete a voucher
 * DELETE /api/vouchers/:voucherId
 */
router.delete('/:voucherId', async (req, res) => {
  try {
    const { voucherId } = req.params;

    const { error } = await supabase
      .from('vouchers')
      .delete()
      .eq('id', voucherId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
