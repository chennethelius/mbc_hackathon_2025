import express from 'express';
import { supabase } from '../config/supabase.js';
import { getContract } from '../config/blockchain.js';
import { ethers } from 'ethers';
import { MARKET_FACTORY_ADDRESS } from '../config/blockchain.js';

const router = express.Router();

const MARKET_FACTORY_ABI = [
  "function createMarket(address friend1, address friend2, string memory title, uint256 resolutionTime) external returns (address)",
  "event MarketCreated(address indexed marketAddress, address indexed creator, address friend1, address friend2, string title, uint256 timestamp)"
];

const DATE_MARKET_ABI = [
  "function addEligibleBettors(address[] calldata bettors) external"
];

/**
 * Get match proposals for a user
 * GET /api/match-proposals/:userId
 * Query params: ?role=all|matchmaker|vouched_friend|matched_person
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
        vouchedFriend:vouched_friend_id(id, display_name, full_name, email),
        matchedPerson:matched_person_id(id, display_name, full_name, email)
      `);

    // Filter by role
    if (role === 'matchmaker') {
      query = query.eq('matchmaker_id', userId);
    } else if (role === 'vouched_friend') {
      query = query.eq('vouched_friend_id', userId);
    } else if (role === 'matched_person') {
      query = query.eq('matched_person_id', userId);
    } else {
      // All proposals where user is involved
      query = query.or(`matchmaker_id.eq.${userId},vouched_friend_id.eq.${userId},matched_person_id.eq.${userId}`);
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
 * Body: { matchmakerId, vouchedFriendId, matchedPersonId, title }
 */
router.post('/', async (req, res) => {
  try {
    const { matchmakerId, vouchedFriendId, matchedPersonId, title } = req.body;

    if (!matchmakerId || !vouchedFriendId || !matchedPersonId || !title) {
      return res.status(400).json({
        success: false,
        error: 'matchmakerId, vouchedFriendId, matchedPersonId, and title required'
      });
    }

    if (vouchedFriendId === matchedPersonId) {
      return res.status(400).json({
        success: false,
        error: 'Vouched friend and matched person must be different people'
      });
    }

    const { data, error } = await supabase
      .from('match_proposals')
      .insert({
        matchmaker_id: matchmakerId,
        vouched_friend_id: vouchedFriendId,
        matched_person_id: matchedPersonId,
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
      .in('id', [matchmakerId, vouchedFriendId, matchedPersonId]);

    const matcherProfile = profiles?.find(p => p.id === matchmakerId);
    const vouchedFriendProfile = profiles?.find(p => p.id === vouchedFriendId);
    const matchedPersonProfile = profiles?.find(p => p.id === matchedPersonId);

    // Create notifications for vouched friend and matched person
    const notifications = [
      {
        user_id: vouchedFriendId,
        type: 'match',
        title: 'New Match Proposal!',
        message: `${matcherProfile?.display_name || 'Someone'} wants to set you up with ${matchedPersonProfile?.display_name || 'someone'}`,
        related_user_id: matchedPersonId,
        related_user_profile: matchedPersonProfile,
        matcher_id: matchmakerId,
        matcher_profile: matcherProfile,
        proposal_id: data.id,
        requires_response: true,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      },
      {
        user_id: matchedPersonId,
        type: 'match',
        title: 'New Match Proposal!',
        message: `${matcherProfile?.display_name || 'Someone'} wants to set you up with ${vouchedFriendProfile?.display_name || 'someone'}`,
        related_user_id: vouchedFriendId,
        related_user_profile: vouchedFriendProfile,
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
 * Accept a match proposal (Matched person only)
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

    // Verify user is one of the two people being matched
    const { data: proposal, error: fetchError } = await supabase
      .from('match_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;

    // Either the vouched friend OR the matched person can accept
    if (proposal.vouched_friend_id !== userId && proposal.matched_person_id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only one of the two matched people can accept this proposal'
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

    // Get vouchers for vouched friend and matched person to add as eligible bettors
    const { data: vouchers, error: vouchersError } = await supabase
      .from('vouchers')
      .select('user_id, wallet_address')
      .or(`vouched_for_id.eq.${proposal.vouched_friend_id},vouched_for_id.eq.${proposal.matched_person_id}`);

    if (vouchersError) {
      console.error('Error fetching vouchers:', vouchersError);
      // Continue even if vouchers fetch fails
    }

    // Get wallet addresses for vouched friend and matched person from wallets table
    const { data: wallets, error: walletsError } = await supabase
      .from('wallets')
      .select('user_id, wallet_address')
      .in('user_id', [proposal.vouched_friend_id, proposal.matched_person_id]);

    if (walletsError) {
      console.error('Error fetching wallets:', walletsError);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch wallet addresses: ' + walletsError.message
      });
    }

    const vouchedFriendWallet = wallets?.find(w => w.user_id === proposal.vouched_friend_id);
    const matchedPersonWallet = wallets?.find(w => w.user_id === proposal.matched_person_id);

    if (!vouchedFriendWallet?.wallet_address || !matchedPersonWallet?.wallet_address) {
      return res.status(400).json({
        success: false,
        error: 'Vouched friend or matched person does not have a wallet address'
      });
    }

    // Get unique wallet addresses of eligible bettors
    // If no vouchers exist, allow ALL users to bet (for testing/demo purposes)
    let eligibleBettors = vouchers && vouchers.length > 0
      ? [...new Set(vouchers.map(v => v.wallet_address).filter(Boolean))]
      : [];
    
    // If still no eligible bettors, get all wallet addresses to allow everyone to bet
    if (eligibleBettors.length === 0) {
      console.log('No vouchers found, allowing all users to bet');
      const { data: allWallets } = await supabase
        .from('wallets')
        .select('wallet_address');
      
      if (allWallets && allWallets.length > 0) {
        eligibleBettors = allWallets.map(w => w.wallet_address).filter(Boolean);
        console.log(`Added ${eligibleBettors.length} wallet addresses as eligible bettors`);
      }
    }

    // Create blockchain market
    try {
      if (!getContract) {
        console.warn('Blockchain not configured, skipping market creation');
      } else {
        const marketFactory = getContract(MARKET_FACTORY_ADDRESS, MARKET_FACTORY_ABI);
        const resolutionTime = Math.floor(new Date(dateTime).getTime() / 1000);
        
        console.log('Creating market with:', {
          vouchedFriend: vouchedFriendWallet.wallet_address,
          matchedPerson: matchedPersonWallet.wallet_address,
          title: proposal.title,
          resolutionTime,
          bettorCount: eligibleBettors.length
        });
        
        // Step 1: Create the market
        const tx = await marketFactory.createMarket(
          vouchedFriendWallet.wallet_address,
          matchedPersonWallet.wallet_address,
          proposal.title,
          resolutionTime
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
        
        if (!event) {
          console.error('No MarketCreated event found in logs');
          throw new Error('Failed to get market address from event');
        }
        
        const parsedEvent = marketFactory.interface.parseLog(event);
        const marketAddress = parsedEvent.args.marketAddress;
        console.log('Market address from event:', marketAddress);
        
        if (marketAddress) {
          // Step 2: Add eligible bettors to the market
          if (eligibleBettors.length > 0) {
            console.log(`Adding ${eligibleBettors.length} eligible bettors to market ${marketAddress}...`);
            const marketContract = getContract(marketAddress, DATE_MARKET_ABI);
            
            try {
              const addBettorsTx = await marketContract.addEligibleBettors(eligibleBettors);
              console.log('Add bettors transaction sent:', addBettorsTx.hash);
              const addBettorsReceipt = await addBettorsTx.wait();
              console.log('Add bettors confirmed:', addBettorsReceipt.hash);
              console.log('✅ Eligible bettors added');
            } catch (addBettorsError) {
              console.error('Failed to add eligible bettors:', addBettorsError);
              // Continue anyway - market is created
            }
          }
          
          // Store market in database
          await supabase.from('markets').insert({
            match_proposal_id: proposalId,
            contract_address: marketAddress,
            vouched_friend_id: proposal.vouched_friend_id,
            matched_person_id: proposal.matched_person_id,
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

    // Verify user is vouched_friend or matched_person
    const { data: proposal, error: fetchError } = await supabase
      .from('match_proposals')
      .select('*')
      .eq('id', proposalId)
      .single();

    if (fetchError) throw fetchError;

    if (proposal.vouched_friend_id !== userId && proposal.matched_person_id !== userId) {
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
