import { supabase } from './supabase';

/**
 * Vouch Service
 * Implements the vouching/reputation system where users vouch for their friends
 * 
 * Core Algorithm:
 * - Users get a budget (BASE_BUDGET + POINTS_PER_FRIEND * numFriends)
 * - Can vouch for friends with 0-5 points
 * - Vouch score = average of all points received
 * - Budget dynamically updates based on date outcomes (rewards/penalties)
 */

// Constants
export const BASE_BUDGET = 20.0;
export const POINTS_PER_FRIEND = 3.0;
export const REWARD_PER_POINT = 1.0;
export const PENALTY_PER_POINT = 2.0;

/**
 * Initialize vouch stats for a user (if not already exists)
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function initializeUserVouchStats(userId) {
  try {
    console.log('🎯 Initializing vouch stats for user:', userId);

    // Check if already exists
    const { data: existing, error: checkError } = await supabase
      .from('user_vouch_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existing) {
      console.log('✅ User vouch stats already exist');
      return { success: true, data: existing };
    }

    // Get friend count
    const { data: friendships, error: friendError } = await supabase
      .from('friendships')
      .select('id')
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (friendError) {
      console.error('❌ Error getting friend count:', friendError);
      return { success: false, error: friendError.message };
    }

    const friendCount = friendships?.length || 0;
    const initialBudget = BASE_BUDGET + (POINTS_PER_FRIEND * friendCount);

    // Create stats
    const { data, error } = await supabase
      .from('user_vouch_stats')
      .insert({
        user_id: userId,
        budget: initialBudget,
        base_budget: BASE_BUDGET,
        points_per_friend: POINTS_PER_FRIEND,
        total_allocated: 0,
        vouch_score: 0,
        total_vouches_received: 0
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating vouch stats:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Vouch stats initialized:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception initializing vouch stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get vouch stats for a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, stats?: any, error?: string}>}
 */
export async function getUserVouchStats(userId) {
  try {
    console.log('📊 Getting vouch stats for user:', userId);

    const { data, error } = await supabase
      .from('user_vouch_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If not found, initialize
      if (error.code === 'PGRST116') {
        return await initializeUserVouchStats(userId);
      }
      console.error('❌ Error getting vouch stats:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Got vouch stats:', data);
    return { success: true, stats: data };
  } catch (error) {
    console.error('❌ Exception getting vouch stats:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all vouches given by a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, vouches?: Array, error?: string}>}
 */
export async function getVouchesGiven(userId) {
  try {
    console.log('🎯 Getting vouches given by user:', userId);

    const { data, error } = await supabase
      .from('vouches')
      .select(`
        *,
        vouchee:profiles!vouches_vouchee_id_fkey(
          id,
          username,
          display_name,
          email,
          avatar_url,
          photos
        )
      `)
      .eq('voucher_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting vouches given:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Found', data?.length || 0, 'vouches given');
    return { success: true, vouches: data || [] };
  } catch (error) {
    console.error('❌ Exception getting vouches given:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all vouches received by a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, vouches?: Array, error?: string}>}
 */
export async function getVouchesReceived(userId) {
  try {
    console.log('🎯 Getting vouches received by user:', userId);

    const { data, error } = await supabase
      .from('vouches')
      .select(`
        *,
        voucher:profiles!vouches_voucher_id_fkey(
          id,
          username,
          display_name,
          email,
          avatar_url,
          photos
        )
      `)
      .eq('vouchee_id', userId)
      .gt('points', 0)
      .order('points', { ascending: false });

    if (error) {
      console.error('❌ Error getting vouches received:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Found', data?.length || 0, 'vouches received');
    return { success: true, vouches: data || [] };
  } catch (error) {
    console.error('❌ Exception getting vouches received:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Set or update a vouch for a friend
 * @param {string} voucherId - ID of user giving the vouch
 * @param {string} voucheeId - ID of user receiving the vouch
 * @param {number} points - Vouch points (0-5)
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function setVouch(voucherId, voucheeId, points) {
  try {
    console.log('🎯 Setting vouch:', voucherId, '->', voucheeId, 'points:', points);

    // Validate points
    points = Math.max(0, Math.min(5, parseFloat(points)));

    // Check if users are friends
    const { data: friendship, error: friendError } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${voucherId},friend_id.eq.${voucheeId}),and(user_id.eq.${voucheeId},friend_id.eq.${voucherId})`)
      .eq('status', 'accepted')
      .single();

    if (friendError || !friendship) {
      return { success: false, error: 'You can only vouch for friends' };
    }

    // Get current user stats
    const statsResult = await getUserVouchStats(voucherId);
    if (!statsResult.success) {
      return statsResult;
    }
    const stats = statsResult.stats;

    // Check if vouch already exists
    const { data: existing, error: checkError } = await supabase
      .from('vouches')
      .select('*')
      .eq('voucher_id', voucherId)
      .eq('vouchee_id', voucheeId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Error checking existing vouch:', checkError);
      return { success: false, error: checkError.message };
    }

    const oldPoints = existing ? parseFloat(existing.points) : 0;
    const delta = points - oldPoints;

    // Check budget
    if (delta > 0 && stats.budget < delta) {
      return { 
        success: false, 
        error: `Not enough vouch points. You have ${stats.budget.toFixed(1)} points available, but need ${delta.toFixed(1)}.` 
      };
    }

    // Update or insert vouch
    let vouchData;
    if (existing) {
      // Update existing vouch
      const { data, error } = await supabase
        .from('vouches')
        .update({ 
          points: points,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating vouch:', error);
        return { success: false, error: error.message };
      }
      vouchData = data;
    } else {
      // Insert new vouch
      const { data, error } = await supabase
        .from('vouches')
        .insert({
          voucher_id: voucherId,
          vouchee_id: voucheeId,
          points: points
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating vouch:', error);
        return { success: false, error: error.message };
      }
      vouchData = data;
    }

    // Update user stats
    const newBudget = parseFloat(stats.budget) - delta;
    const newAllocated = parseFloat(stats.total_allocated) + delta;

    const { error: updateError } = await supabase
      .from('user_vouch_stats')
      .update({
        budget: newBudget,
        total_allocated: newAllocated,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', voucherId);

    if (updateError) {
      console.error('❌ Error updating user stats:', updateError);
      return { success: false, error: updateError.message };
    }

    // Log the event
    await supabase.from('vouch_history').insert({
      user_id: voucherId,
      event_type: existing ? 'vouch_updated' : 'vouch_given',
      points_change: -delta,
      budget_after: newBudget,
      related_user_id: voucheeId,
      details: { old_points: oldPoints, new_points: points }
    });

    console.log('✅ Vouch set successfully');
    return { success: true, data: vouchData };
  } catch (error) {
    console.error('❌ Exception setting vouch:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a vouch (set to 0)
 * @param {string} voucherId - ID of user giving the vouch
 * @param {string} voucheeId - ID of user receiving the vouch
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeVouch(voucherId, voucheeId) {
  return await setVouch(voucherId, voucheeId, 0);
}

/**
 * Get vouches for friends (combines friend list with vouch data)
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, friendVouches?: Array, error?: string}>}
 */
export async function getFriendVouches(userId) {
  try {
    console.log('👥 Getting friend vouches for user:', userId);

    // Get all friends
    const { data: friendships, error: friendError } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        created_at
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (friendError) {
      console.error('❌ Error getting friends:', friendError);
      return { success: false, error: friendError.message };
    }

    if (!friendships || friendships.length === 0) {
      return { success: true, friendVouches: [] };
    }

    // Get friend IDs
    const friendIds = friendships.map(f => f.user_id === userId ? f.friend_id : f.user_id);

    // Get friend profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, username, display_name, email, avatar_url, photos')
      .in('id', friendIds);

    if (profileError) {
      console.error('❌ Error getting friend profiles:', profileError);
      return { success: false, error: profileError.message };
    }

    // Get existing vouches
    const { data: vouches, error: vouchError } = await supabase
      .from('vouches')
      .select('*')
      .eq('voucher_id', userId)
      .in('vouchee_id', friendIds);

    if (vouchError) {
      console.error('❌ Error getting vouches:', vouchError);
      return { success: false, error: vouchError.message };
    }

    // Get vouch scores for all friends
    const { data: vouchStats, error: statsError } = await supabase
      .from('user_vouch_stats')
      .select('user_id, vouch_score')
      .in('user_id', friendIds);

    if (statsError) {
      console.error('❌ Error getting vouch stats:', statsError);
    }

    // Combine data
    const friendVouches = profiles.map(profile => {
      const vouch = vouches?.find(v => v.vouchee_id === profile.id);
      const stats = vouchStats?.find(s => s.user_id === profile.id);
      return {
        ...profile,
        display_name: profile.display_name || profile.username || profile.email,
        vouch_points: vouch ? parseFloat(vouch.points) : 0,
        vouch_score: stats ? parseFloat(stats.vouch_score) : 0,
        vouch_id: vouch?.id
      };
    });

    // Sort by vouch points descending
    friendVouches.sort((a, b) => b.vouch_points - a.vouch_points);

    console.log('✅ Got', friendVouches.length, 'friend vouches');
    return { success: true, friendVouches };
  } catch (error) {
    console.error('❌ Exception getting friend vouches:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Process date outcome and update vouch budgets
 * @param {string} user1Id - First user in the date
 * @param {string} user2Id - Second user in the date
 * @param {boolean} success - Whether the date was successful
 * @param {number} dateId - Optional date ID for logging
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function processDateOutcome(user1Id, user2Id, success, dateId = null) {
  try {
    console.log(`🎲 Processing ${success ? 'successful' : 'failed'} date outcome:`, user1Id, user2Id);

    // Get all vouchers for both participants
    const { data: vouchers1, error: error1 } = await supabase
      .from('vouches')
      .select('voucher_id, points')
      .eq('vouchee_id', user1Id)
      .gt('points', 0);

    const { data: vouchers2, error: error2 } = await supabase
      .from('vouches')
      .select('voucher_id, points')
      .eq('vouchee_id', user2Id)
      .gt('points', 0);

    if (error1 || error2) {
      console.error('❌ Error getting vouchers:', error1 || error2);
      return { success: false, error: (error1 || error2).message };
    }

    // Combine all vouchers
    const allVouchers = [
      ...(vouchers1 || []).map(v => ({ ...v, vouchee_id: user1Id })),
      ...(vouchers2 || []).map(v => ({ ...v, vouchee_id: user2Id }))
    ];

    // Process each voucher
    for (const vouch of allVouchers) {
      const points = parseFloat(vouch.points);
      let budgetChange;
      let eventType;

      if (success) {
        // Reward vouchers for successful date
        budgetChange = points * REWARD_PER_POINT;
        eventType = 'date_success';
      } else {
        // Penalize vouchers for failed date
        budgetChange = -(points * PENALTY_PER_POINT);
        eventType = 'date_fail';
      }

      // Update voucher's budget
      const { data: stats, error: statsError } = await supabase
        .from('user_vouch_stats')
        .select('budget')
        .eq('user_id', vouch.voucher_id)
        .single();

      if (statsError) {
        console.error('❌ Error getting voucher stats:', statsError);
        continue;
      }

      const newBudget = Math.max(0, parseFloat(stats.budget) + budgetChange);

      const { error: updateError } = await supabase
        .from('user_vouch_stats')
        .update({
          budget: newBudget,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', vouch.voucher_id);

      if (updateError) {
        console.error('❌ Error updating voucher budget:', updateError);
        continue;
      }

      // Log the event
      await supabase.from('vouch_history').insert({
        user_id: vouch.voucher_id,
        event_type: eventType,
        points_change: budgetChange,
        budget_after: newBudget,
        related_user_id: vouch.vouchee_id,
        related_date_id: dateId,
        details: { 
          vouch_points: points,
          date_participants: [user1Id, user2Id],
          success 
        }
      });

      console.log(`✅ Updated budget for voucher ${vouch.voucher_id}: ${budgetChange > 0 ? '+' : ''}${budgetChange.toFixed(1)}`);
    }

    console.log('✅ Date outcome processed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Exception processing date outcome:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get vouch history for a user
 * @param {string} userId - User's ID
 * @param {number} limit - Maximum number of records to return
 * @returns {Promise<{success: boolean, history?: Array, error?: string}>}
 */
export async function getVouchHistory(userId, limit = 50) {
  try {
    console.log('📜 Getting vouch history for user:', userId);

    const { data, error } = await supabase
      .from('vouch_history')
      .select(`
        *,
        related_user:profiles!vouch_history_related_user_id_fkey(
          id,
          username,
          display_name,
          email,
          avatar_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Error getting vouch history:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Found', data?.length || 0, 'history records');
    return { success: true, history: data || [] };
  } catch (error) {
    console.error('❌ Exception getting vouch history:', error);
    return { success: false, error: error.message };
  }
}

