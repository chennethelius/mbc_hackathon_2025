import express from 'express';
import { supabase } from '../config/supabase.js';
import { getContract } from '../config/blockchain.js';
import { ethers } from 'ethers';
import { MARKET_FACTORY_ADDRESS } from '../config/blockchain.js';

const router = express.Router();

const MARKET_FACTORY_ABI = [
  "function createMarketWithBettors(address friend1, address friend2, string memory title, uint256 resolutionTime, address[] memory eligibleBettors) external returns (address)",
  "event MarketCreated(address indexed marketAddress, address indexed creator, address friend1, address friend2, string title, uint256 timestamp)"
];

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

    // Get user profiles for notifications
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name, full_name, email')
      .in('id', [matchmakerId, friendBId, girlCId]);

    const matcherProfile = profiles?.find(p => p.id === matchmakerId);
    const friendBProfile = profiles?.find(p => p.id === friendBId);
    const girlCProfile = profiles?.find(p => p.id === girlCId);

    // Create notifications for Friend B and Girl C
    const notifications = [
      {
        user_id: friendBId,
        type: 'match',
        title: 'New Match Proposal!',
        message: `${matcherProfile?.display_name || 'Someone'} wants to set you up with ${girlCProfile?.display_name || 'someone'}`,
        related_user_id: girlCId,
        related_user_profile: girlCProfile,
        matcher_id: matchmakerId,
        matcher_profile: matcherProfile,
        proposal_id: data.id,
        requires_response: true,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      },
      {
        user_id: girlCId,
        type: 'match',
        title: 'New Match Proposal!',
        message: `${matcherProfile?.display_name || 'Someone'} wants to set you up with ${friendBProfile?.display_name || 'someone'}`,
        related_user_id: friendBId,
        related_user_profile: friendBProfile,
        matcher_id: matchmakerId,
        matcher_profile: matcherProfile,
        proposal_id: data.id,
        requires_response: true,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    await supabase.from('notifications').insert(notifications);

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

    // Get wallet addresses for Friend B and Girl C
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, wallet_address')
      .in('id', [proposal.friend_b_id, proposal.girl_c_id]);

    const friendBProfile = profiles?.find(p => p.id === proposal.friend_b_id);
    const girlCProfile = profiles?.find(p => p.id === proposal.girl_c_id);

    if (!friendBProfile?.wallet_address || !girlCProfile?.wallet_address) {
      return res.status(400).json({
        success: false,
        error: 'Friend B or Girl C does not have a wallet address'
      });
    }

    // Get unique wallet addresses of eligible bettors
    const eligibleBettors = vouchers 
      ? [...new Set(vouchers.map(v => v.wallet_address).filter(Boolean))]
      : [];

    // Create blockchain market
    try {
      if (!getContract) {
        console.warn('Blockchain not configured, skipping market creation');
      } else {
        const marketFactory = getContract(MARKET_FACTORY_ADDRESS, MARKET_FACTORY_ABI);
        const resolutionTime = Math.floor(new Date(dateTime).getTime() / 1000);
        
        console.log('Creating market with:', {
          friendB: friendBProfile.wallet_address,
          girlC: girlCProfile.wallet_address,
          title: proposal.title,
          resolutionTime,
          bettorCount: eligibleBettors.length
        });
        
        const tx = await marketFactory.createMarketWithBettors(
          friendBProfile.wallet_address,
          girlCProfile.wallet_address,
          proposal.title,
          resolutionTime,
          eligibleBettors
        );
        
        console.log('Transaction sent:', tx.hash);
        const receipt = await tx.wait();
        console.log('Transaction confirmed:', receipt.hash);
        
        // Get market address from event
        const event = receipt.logs.find(log => {
          try {
            const parsed = marketFactory.interface.parseLog(log);
            return parsed?.name === 'MarketCreated';
          } catch {
            return false;
          }
        });
        
        const marketAddress = event ? marketFactory.interface.parseLog(event).args.marketAddress : null;
        
        if (marketAddress) {
          // Store market in database
          await supabase.from('markets').insert({
            match_proposal_id: proposalId,
            contract_address: marketAddress,
            friend_b_id: proposal.friend_b_id,
            girl_c_id: proposal.girl_c_id,
            resolution_time: dateTime,
            resolved: false
          });
          
          console.log('✅ Market created at:', marketAddress);
        }
      }
    } catch (blockchainError) {
      console.error('Failed to create blockchain market:', blockchainError.message || blockchainError);
      // Don't fail the whole request - proposal is still accepted
    }

    res.json({ 
      success: true, 
      proposal: data,
      message: 'Proposal accepted and market created!'
    });
  } catch (error) {
    console.error('Error accepting match proposal:', error);
    
    let errorMessage = error.message;
    if (error.message?.includes('Invalid API key')) {
      errorMessage = 'Database authentication failed. Invalid Supabase API key. Check server .env file.';
    } else if (error.code === 'PGRST116') {
      errorMessage = 'Database table not found. Run the migration SQL in Supabase.';
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
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
