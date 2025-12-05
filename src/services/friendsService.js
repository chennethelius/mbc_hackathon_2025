import { supabase } from './supabase';

/**
 * Friends Service
 * Handles all friend-related operations including requests, accepts, and searches
 */

/**
 * Send a friend request to another user
 * @param {string} userId - Current user's ID
 * @param {string} friendId - Target user's ID to send request to
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function sendFriendRequest(userId, friendId) {
  try {
    console.log('📤 Sending friend request:', userId, '->', friendId);

    // Check if friendship already exists
    const { data: existing, error: checkError } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`);

    if (checkError) {
      console.error('❌ Error checking existing friendship:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existing && existing.length > 0) {
      return { success: false, error: 'Friend request already exists' };
    }

    // Create new friend request
    const { data, error } = await supabase
      .from('friendships')
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error sending friend request:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Friend request sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception sending friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Accept a friend request
 * @param {number} friendshipId - ID of the friendship to accept
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function acceptFriendRequest(friendshipId) {
  try {
    console.log('✅ Accepting friend request:', friendshipId);

    const { data, error } = await supabase
      .from('friendships')
      .update({ status: 'accepted' })
      .eq('id', friendshipId)
      .select()
      .single();

    if (error) {
      console.error('❌ Error accepting friend request:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Friend request accepted:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Exception accepting friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Reject a friend request
 * @param {number} friendshipId - ID of the friendship to reject
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function rejectFriendRequest(friendshipId) {
  try {
    console.log('❌ Rejecting friend request:', friendshipId);

    const { error } = await supabase
      .from('friendships')
      .update({ status: 'rejected' })
      .eq('id', friendshipId);

    if (error) {
      console.error('❌ Error rejecting friend request:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Friend request rejected');
    return { success: true };
  } catch (error) {
    console.error('❌ Exception rejecting friend request:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Remove a friend or cancel a friend request
 * @param {number} friendshipId - ID of the friendship to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function removeFriend(friendshipId) {
  try {
    console.log('🗑️ Removing friend:', friendshipId);

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      console.error('❌ Error removing friend:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Friend removed successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Exception removing friend:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all accepted friends for a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, friends?: Array, error?: string}>}
 */
export async function getFriends(userId) {
  try {
    console.log('👥 Getting friends for user:', userId);

    // Get friendships where user is either user_id or friend_id and status is accepted
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) {
      console.error('❌ Error getting friends:', error);
      return { success: false, error: error.message };
    }

    // Get profile details for each friend
    const friendIds = data.map(f => f.user_id === userId ? f.friend_id : f.user_id);
    
    if (friendIds.length === 0) {
      return { success: true, friends: [] };
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds);

    if (profileError) {
      console.error('❌ Error getting friend profiles:', profileError);
      return { success: false, error: profileError.message };
    }

    // Combine friendship data with profile data
    const friends = data.map(friendship => {
      const friendId = friendship.user_id === userId ? friendship.friend_id : friendship.user_id;
      const profile = profiles.find(p => p.id === friendId);
      return {
        ...friendship,
        friendId,
        profile
      };
    });

    console.log('✅ Found', friends.length, 'friends');
    return { success: true, friends };
  } catch (error) {
    console.error('❌ Exception getting friends:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get pending incoming friend requests for a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, requests?: Array, error?: string}>}
 */
export async function getPendingRequests(userId) {
  try {
    console.log('📥 Getting pending requests for user:', userId);

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting pending requests:', error);
      return { success: false, error: error.message };
    }

    // Get profile details for each requester
    const requesterIds = data.map(r => r.user_id);
    
    if (requesterIds.length === 0) {
      return { success: true, requests: [] };
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', requesterIds);

    if (profileError) {
      console.error('❌ Error getting requester profiles:', profileError);
      return { success: false, error: profileError.message };
    }

    // Combine request data with profile data
    const requests = data.map(request => {
      const profile = profiles.find(p => p.id === request.user_id);
      return {
        ...request,
        profile
      };
    });

    console.log('✅ Found', requests.length, 'pending requests');
    return { success: true, requests };
  } catch (error) {
    console.error('❌ Exception getting pending requests:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get outgoing friend requests sent by a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, requests?: Array, error?: string}>}
 */
export async function getSentRequests(userId) {
  try {
    console.log('📤 Getting sent requests for user:', userId);

    const { data, error } = await supabase
      .from('friendships')
      .select(`
        id,
        user_id,
        friend_id,
        status,
        created_at
      `)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting sent requests:', error);
      return { success: false, error: error.message };
    }

    // Get profile details for each recipient
    const recipientIds = data.map(r => r.friend_id);
    
    if (recipientIds.length === 0) {
      return { success: true, requests: [] };
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', recipientIds);

    if (profileError) {
      console.error('❌ Error getting recipient profiles:', profileError);
      return { success: false, error: profileError.message };
    }

    // Combine request data with profile data
    const requests = data.map(request => {
      const profile = profiles.find(p => p.id === request.friend_id);
      return {
        ...request,
        profile
      };
    });

    console.log('✅ Found', requests.length, 'sent requests');
    return { success: true, requests };
  } catch (error) {
    console.error('❌ Exception getting sent requests:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Search for users by username or display name
 * @param {string} query - Search query
 * @param {string} currentUserId - Current user's ID (to exclude from results)
 * @returns {Promise<{success: boolean, users?: Array, error?: string}>}
 */
export async function searchUsers(query, currentUserId) {
  try {
    console.log('🔍 Searching users with query:', query);

    if (!query || query.trim().length === 0) {
      return { success: true, users: [] };
    }

    const searchQuery = `%${query.trim()}%`;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`username.ilike.${searchQuery},display_name.ilike.${searchQuery},email.ilike.${searchQuery}`)
      .neq('id', currentUserId)
      .limit(20);

    if (error) {
      console.error('❌ Error searching users:', error);
      return { success: false, error: error.message };
    }

    // Accept all users - they need at least an email to be in profiles table
    console.log('✅ Found', data.length, 'users matching query');
    return { success: true, users: data };
  } catch (error) {
    console.error('❌ Exception searching users:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get friendship status between two users
 * @param {string} userId - First user's ID
 * @param {string} friendId - Second user's ID
 * @returns {Promise<{success: boolean, status?: string, friendship?: any, error?: string}>}
 */
export async function getFriendshipStatus(userId, friendId) {
  try {
    const { data, error } = await supabase
      .from('friendships')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${userId})`)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No friendship found
        return { success: true, status: 'none', friendship: null };
      }
      console.error('❌ Error getting friendship status:', error);
      return { success: false, error: error.message };
    }

    return { success: true, status: data.status, friendship: data };
  } catch (error) {
    console.error('❌ Exception getting friendship status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get count of pending friend requests for a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function getPendingRequestsCount(userId) {
  try {
    const { count, error } = await supabase
      .from('friendships')
      .select('*', { count: 'exact', head: true })
      .eq('friend_id', userId)
      .eq('status', 'pending');

    if (error) {
      console.error('❌ Error getting pending requests count:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('❌ Exception getting pending requests count:', error);
    return { success: false, error: error.message };
  }
}

