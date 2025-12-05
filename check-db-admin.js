import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://bzbctnowqdbytwhsmljg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6YmN0bm93cWRieXR3aHNtbGpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDg1NzgxNiwiZXhwIjoyMDgwNDMzODE2fQ.En9qA3Li2DGtuO46aJYn7m62hyMzg03GxFYy7E25fIo'
);

async function checkDB() {
  console.log('=== ALL PROFILES ===');
  const { data: profiles, error: pError } = await supabase
    .from('profiles')
    .select('*');
  
  if (pError) console.error('Error:', pError);
  else {
    profiles.forEach(p => {
      console.log(`${p.full_name || p.email}:`, {
        id: p.id,
        wallet: p.wallet_address || 'NO WALLET',
        email: p.email
      });
    });
  }
  
  console.log('\n=== ALL FRIENDSHIPS ===');
  const { data: friendships, error: fError } = await supabase
    .from('friendships')
    .select('*');
  
  if (fError) console.error('Error:', fError);
  else console.log(friendships);
  
  process.exit(0);
}

checkDB();
