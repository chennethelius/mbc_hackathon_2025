import { supabase } from './supabase';
import { getVouchesReceived } from './vouchService';

/**
 * Notification Service
 * Handles sending and retrieving notifications for users
 */

/**
 * Send a match notification to both users
 * @param {string} user1Id - First user's ID
 * @param {string} user2Id - Second user's ID
 * @param {Object} user1Profile - First user's profile data
 * @param {Object} user2Profile - Second user's profile data
 * @param {string} matcherId - ID of the user who made the match
 * @param {Object} matcherProfile - Profile data of the user who made the match
 * @param {string} deadline - ISO string of the deadline date
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function sendMatchNotification(user1Id, user2Id, user1Profile, user2Profile, matcherId, matcherProfile, deadline) {
  try {
    console.log('💌 Sending match notifications:', user1Id, 'and', user2Id, 'matched by', matcherId);

    const matcherName = matcherProfile?.display_name || matcherProfile?.username || 'Someone';
    const user1Name = user1Profile?.display_name || user1Profile?.username || 'someone';
    const user2Name = user2Profile?.display_name || user2Profile?.username || 'someone';
    
    // Create identical notification message for both users
    const matchMessage = `${matcherName} matched ${user1Name} with ${user2Name}`;

    // Create notification for user1 (top carousel - needs to respond)
    const notification1 = {
      user_id: user1Id,
      type: 'match',
      title: 'You were matched!',
      message: matchMessage,
      related_user_id: user2Id,
      related_user_profile: user2Profile, // Store profile data in notification
      matcher_id: matcherId,
      matcher_profile: matcherProfile, // Store matcher's profile data
      deadline: deadline, // Deadline for response
      requires_response: true, // This user needs to accept/reject
      read: false,
      created_at: new Date().toISOString()
    };

    // Create notification for user2 (bottom carousel - no response needed)
    const notification2 = {
      user_id: user2Id,
      type: 'match',
      title: 'You were matched!',
      message: matchMessage,
      related_user_id: user1Id,
      related_user_profile: user1Profile, // Store profile data in notification
      matcher_id: matcherId,
      matcher_profile: matcherProfile, // Store matcher's profile data
      deadline: deadline, // Deadline for response
      requires_response: false, // This user doesn't need to respond
      read: false,
      created_at: new Date().toISOString()
    };

    // Insert both notifications
    const { error: error1 } = await supabase
      .from('notifications')
      .insert(notification1);

    if (error1) {
      console.error('❌ Error creating notification for user1:', error1);
      return { success: false, error: error1.message };
    }

    const { error: error2 } = await supabase
      .from('notifications')
      .insert(notification2);

    if (error2) {
      console.error('❌ Error creating notification for user2:', error2);
      return { success: false, error: error2.message };
    }

    // Get all vouches for user1 (the person who needs to respond)
    // and send notifications to all their vouchers
    console.log('📬 Getting vouches for user1 to notify vouchers...');
    const vouchesResult = await getVouchesReceived(user1Id);
    
    if (vouchesResult.success && vouchesResult.vouches) {
      const vouchers = vouchesResult.vouches
        .map(vouch => vouch.voucher)
        .filter(voucher => voucher && voucher.id) // Filter out null/undefined
        .filter(voucher => 
          voucher.id !== user1Id && 
          voucher.id !== user2Id && 
          voucher.id !== matcherId
        ); // Don't send to the matched users or matcher

      // Remove duplicates (in case someone vouched multiple times)
      const uniqueVouchers = Array.from(
        new Map(vouchers.map(v => [v.id, v])).values()
      );

      console.log(`📬 Sending notifications to ${uniqueVouchers.length} vouchers`);

      // Create notifications for each voucher
      const voucherNotifications = uniqueVouchers.map(voucher => ({
        user_id: voucher.id,
        type: 'match',
        title: 'You were matched!',
        message: matchMessage,
        related_user_id: user1Id,
        related_user_profile: user1Profile, // Store profile data of the person they vouched for
        matcher_id: matcherId,
        matcher_profile: matcherProfile, // Store matcher's profile data
        deadline: deadline, // Deadline for response
        requires_response: false, // Vouchers don't need to respond
        read: false,
        created_at: new Date().toISOString()
      }));

      // Insert all voucher notifications at once
      if (voucherNotifications.length > 0) {
        const { error: voucherError } = await supabase
          .from('notifications')
          .insert(voucherNotifications);

        if (voucherError) {
          console.error('❌ Error creating notifications for vouchers:', voucherError);
          // Don't fail the whole operation if voucher notifications fail
        } else {
          console.log(`✅ Sent notifications to ${voucherNotifications.length} vouchers`);
        }
      }
    } else {
      console.log('⚠️ Could not fetch vouches for user1, skipping voucher notifications');
    }

    console.log('✅ Match notifications sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Exception sending match notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get all notifications for a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, notifications?: Array, error?: string}>}
 */
export async function getUserNotifications(userId) {
  try {
    console.log('📬 Getting notifications for user:', userId);

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error getting notifications:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Found', data?.length || 0, 'notifications');
    return { success: true, notifications: data || [] };
  } catch (error) {
    console.error('❌ Exception getting notifications:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('❌ Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Exception marking notification as read:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User's ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function markAllNotificationsAsRead(userId) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('❌ Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Exception marking all notifications as read:', error);
    return { success: false, error: error.message };
  }
}

