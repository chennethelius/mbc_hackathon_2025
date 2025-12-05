import { supabase } from './config/supabase.js';

async function checkData() {
  console.log('=== Checking Profiles ===');
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('id, email, full_name, wallet_address');
  
  if (pError) console.error('Profile error:', pError);
  else console.log('Profiles:', profiles);
  
  console.log('\n=== Checking Friendships ===');
  const { data: friendships, error: fError } = await supabase
    .from('friendships')
    .select('*');
  
  if (fError) console.error('Friendship error:', fError);
  else console.log('Friendships:', friendships);
  
  process.exit(0);
}

checkData();
