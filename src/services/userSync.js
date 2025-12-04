import { supabase } from './supabase';

/**
 * Syncs Privy user data to Supabase
 * This is called automatically after Privy login to ensure user data is in Supabase
 * 
 * @param {Object} privyUser - The Privy user object from usePrivy hook
 * @returns {Object} { success: boolean, userId?: string, error?: string }
 */
export async function syncPrivyUserToSupabase(privyUser) {
  try {
    if (!privyUser || !privyUser.id) {
      throw new Error('Invalid Privy user object');
    }

    const email = privyUser.email?.address;
    const privyUserId = privyUser.id;
    
    // Get wallet address if exists - only match actual wallet types
    const wallet = privyUser.linkedAccounts?.find(
      account => (
        account.type === 'wallet' || 
        account.type === 'smart_wallet' ||
        account.walletClientType === 'privy'
      )
    );
    const walletAddress = wallet?.address;

    console.log('🔄 Syncing Privy user to Supabase...', {
      userId: privyUserId,
      email,
      hasWallet: !!walletAddress
    });

    // 1. Upsert user record in users table
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: privyUserId,
        email: email,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'id'
      });

    if (userError) {
      console.error('Error upserting user:', userError);
      throw userError;
    }

    // 2. Ensure profile exists (create if doesn't exist)
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', privyUserId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: privyUserId,
          email: email,
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
        throw profileError;
      }
      console.log('✅ Profile created for user:', privyUserId);
    } else {
      console.log('✅ Profile already exists for user:', privyUserId);
    }

    // 3. Sync wallet if it exists
    if (walletAddress) {
      const { data: existingWallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('wallet_address', walletAddress)
        .single();

      if (!existingWallet) {
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: privyUserId,
            wallet_address: walletAddress,
            wallet_type: 'privy_embedded'
          });

        if (walletError) {
          console.error('Error creating wallet record:', walletError);
          // Don't throw - wallet sync is not critical
          console.warn('⚠️ Wallet sync failed, but user/profile created successfully');
        } else {
          console.log('✅ Wallet synced for user:', privyUserId);
        }
      } else {
        console.log('✅ Wallet already synced for user:', privyUserId);
      }
    } else {
      console.log('ℹ️ No wallet found yet for user:', privyUserId);
    }

    console.log('✅ User sync completed successfully:', privyUserId);
    return { success: true, userId: privyUserId };
    
  } catch (error) {
    console.error('❌ Error syncing user to Supabase:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches complete user profile from Supabase
 * Includes user data, profile, and linked wallets
 * 
 * @param {string} privyUserId - The Privy user ID
 * @returns {Object} { success: boolean, user?: Object, error?: string }
 */
export async function fetchUserProfile(privyUserId) {
  try {
    if (!privyUserId) {
      throw new Error('User ID is required');
    }

    // Fetch user with profile and wallets
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        profiles(*),
        wallets(*)
      `)
      .eq('id', privyUserId)
      .single();

    if (userError) {
      console.error('Error fetching user profile:', userError);
      throw userError;
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates user profile in Supabase
 * 
 * @param {string} privyUserId - The Privy user ID
 * @param {Object} profileData - Profile fields to update
 * @returns {Object} { success: boolean, error?: string }
 */
export async function updateUserProfile(privyUserId, profileData) {
  try {
    if (!privyUserId) {
      throw new Error('User ID is required');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', privyUserId);

    if (error) throw error;

    console.log('✅ Profile updated successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Syncs a newly created wallet to Supabase
 * This is called after manual wallet creation
 * 
 * @param {string} privyUserId - The Privy user ID
 * @param {string} walletAddress - The wallet address to sync
 * @returns {Object} { success: boolean, error?: string }
 */
export async function syncWalletToSupabase(privyUserId, walletAddress) {
  try {
    if (!privyUserId || !walletAddress) {
      throw new Error('User ID and wallet address are required');
    }

    console.log('💼 Syncing wallet to Supabase...', {
      userId: privyUserId,
      walletAddress
    });

    // Check if wallet already exists
    const { data: existingWallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (existingWallet) {
      console.log('✅ Wallet already exists in Supabase');
      return { success: true };
    }

    // Insert new wallet
    const { error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: privyUserId,
        wallet_address: walletAddress,
        wallet_type: 'privy_embedded'
      });

    if (walletError) {
      console.error('Error inserting wallet:', walletError);
      throw walletError;
    }

    console.log('✅ Wallet synced to Supabase successfully');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Error syncing wallet to Supabase:', error);
    return { success: false, error: error.message };
  }
}

