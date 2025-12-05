import { supabase } from './config/supabase.js';

async function testFriendsQuery() {
  console.log('Testing friends query...\n');
  
  // First, let's see what users exist
  console.log('1. Checking all profiles:');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email, full_name, wallet_address')
    .limit(5);
  
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
  } else {
    console.log('Found profiles:', JSON.stringify(profiles, null, 2));
  }
  
  console.log('\n2. Checking friendships:');
  const { data: friendships, error: friendshipsError } = await supabase
    .from('friendships')
    .select('*')
    .limit(5);
  
  if (friendshipsError) {
    console.error('Error fetching friendships:', friendshipsError);
  } else {
    console.log('Found friendships:', JSON.stringify(friendships, null, 2));
  }
  
  // If we have a user, test the friends query
  if (profiles && profiles.length > 0) {
    const userId = profiles[0].id;
    console.log(`\n3. Testing friends query for user: ${userId}`);
    
    const { data, error } = await supabase
      .from('friendships')
      .select(`
        *,
        user1:profiles!friendships_user_id_1_fkey(id, email, full_name, avatar_url, wallet_address),
        user2:profiles!friendships_user_id_2_fkey(id, email, full_name, avatar_url, wallet_address)
      `)
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) {
      console.error('Error:', error);
    } else {
      console.log('Friends query result:', JSON.stringify(data, null, 2));
      
      // Format like the API does
      const friends = data.map(friendship => {
        const friend = friendship.user_id_1 === userId ? friendship.user2 : friendship.user1;
        return {
          id: friend.id,
          email: friend.email,
          full_name: friend.full_name,
          display_name: friend.full_name || friend.email,
          avatar_url: friend.avatar_url,
          wallet_address: friend.wallet_address
        };
      });
      
      console.log('\nFormatted friends:', JSON.stringify(friends, null, 2));
    }
  }
  
  process.exit(0);
}

testFriendsQuery();
