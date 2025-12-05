import express from 'express';
import { supabase } from '../config/supabase.js';
import { getContract } from '../config/blockchain.js';

const router = express.Router();

/**
 * Get match proposals for a user
 * GET /api/match-proposals/:userId
 * Query params: ?role=all|matchmaker|friend_b|girl_c
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { role = 'all' } = req.query;

    let query = supabase
      .from('match_proposals')
      .select(`
        *,
        matchmaker:matchmaker_id(id, display_name, full_name, email),
        friendB:friend_b_id(id, display_name, full_name, email),
        girlC:girl_c_id(id, display_name, full_name, email)
      `);

    // Filter by role
    if (role === 'matchmaker') {
      query = query.eq('matchmaker_id', userId);
    } else if (role === 'friend_b') {
      query = query.eq('friend_b_id', userId);
    } else if (role === 'girl_c') {
      query = query.eq('girl_c_id', userId);
    } else {
      // All proposals where user is involved
      query = query.or(`matchmaker_id.eq.${userId},friend_b_id.eq.${userId},girl_c_id.eq.${userId}`);
    }

    const { data, error} = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, proposals: data });
  } catch (error) {
    console.error('Error fetching match proposals:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Create a match proposal
 * POST /api/match-proposals
 * Body: { matchmakerId, friendBId, girlCId, title }
 */
router.post('/', async (req, res) => {
  try {
    const { matchmakerId, friendBId, girlCId, title } = req.body;

    if (!matchmakerId || !friendBId || !girlCId || !title) {
      return res.status(400).json({
        success: false,
        error: 'matchmakerId, friendBId, girlCId, and title required'
      });
    }

    if (friendBId === girlCId) {
      return res.status(400).json({
        success: false,
        error: 'friendB and girlC must be different people'
      });
    }

    const { data, error } = await supabase
      .from('match_proposals')
      .insert({
        matchmaker_id: matchmakerId,
        friend_b_id: friendBId,
        girl_c_id: girlCId,
        title,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, proposal: data });
  } catch (error) {
    console.error('Error creating match proposal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Accept a match proposal (Girl C only)
 * POST /api/match-proposals/:proposalId/accept
 * Body: { userId, dateTime }
 */
router.post('/:proposalId/accept', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { userId, dateTime } = req.body;

    if (!userId || !dateTime) {
      return res.status(400).json({
        success: false,
        error: 'userId and dateTime required'
      });
    }

    // Verify user is girl_c
    const { data: proposal, error: fetchError } = await supabase
      .from('match_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;

    if (proposal.girl_c_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only girl C can accept this proposal'
      });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Proposal already ${proposal.status}`
      });
    }

    // Update proposal
    const { data, error } = await supabase
      .from('match_proposals')
      .update({
        status: 'accepted',
        date_time: dateTime,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) throw error;

    // Get vouchers for Friend B and Girl C to add as eligible bettors
    const { data: vouchers, error: vouchersError } = await supabase
      .from('vouchers')
      .select('user_id, wallet_address')
      .or(`vouched_for_id.eq.${proposal.friend_b_id},vouched_for_id.eq.${proposal.girl_c_id}`);

    if (vouchersError) {
      console.error('Error fetching vouchers:', vouchersError);
      // Continue even if vouchers fetch fails
    }

    // Get unique wallet addresses of eligible bettors
    const eligibleBettors = vouchers 
      ? [...new Set(vouchers.map(v => v.wallet_address).filter(Boolean))]
      : [];

    // TODO: Create blockchain market here
    // const marketFactory = getContract('MARKET_FACTORY');
    // const tx = await marketFactory.createMarketWithBettors(
    //   friendBWallet,
    //   girlCWallet,
    //   proposal.title,
    //   Math.floor(new Date(dateTime).getTime() / 1000),
    //   eligibleBettors
    // );
    // const receipt = await tx.wait();
    // const marketAddress = receipt.events[0].args.marketAddress;
    
    // TODO: Store market in database
    // await supabase.from('markets').insert({
    //   proposal_id: proposalId,
    //   contract_address: marketAddress,
    //   friend_b_id: proposal.friend_b_id,
    //   girl_c_id: proposal.girl_c_id,
    //   expiry_time: dateTime,
    //   status: 'active'
    // });

    res.json({ 
      success: true, 
      proposal: data,
      message: 'Proposal accepted. Market creation pending contract deployment.'
    });
  } catch (error) {
    console.error('Error accepting match proposal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Reject a match proposal
 * POST /api/match-proposals/:proposalId/reject
 * Body: { userId }
 */
router.post('/:proposalId/reject', async (req, res) => {
  try {
    const { proposalId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId required'
      });
    }

    // Verify user is friend_b or girl_c
    const { data: proposal, error: fetchError } = await supabase
      .from('match_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;

    if (proposal.friend_b_id !== userId && proposal.girl_c_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only participants can reject this proposal'
      });
    }

    if (proposal.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Proposal already ${proposal.status}`
      });
    }

    // Update proposal
    const { data, error } = await supabase
      .from('match_proposals')
      .update({
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, proposal: data });
  } catch (error) {
    console.error('Error rejecting match proposal:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
