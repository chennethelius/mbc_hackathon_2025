// Test script to create a match proposal with notifications
import { supabase } from '../config/supabase.js';

async function createTestProposal() {
  // Get some user IDs from your database
  const { data: users } = await supabase
    .from('profiles')
    .select('id, display_name')
    .limit(3);

  if (!users || users.length < 3) {
    console.error('Need at least 3 users in database');
    return;
  }

  const [matchmaker, friendB, girlC] = users;

  console.log('Creating test match proposal...');
  console.log('Matchmaker:', matchmaker.display_name);
  console.log('Friend B:', friendB.display_name);
  console.log('Girl C:', girlC.display_name);

  const response = await fetch('http://localhost:3001/api/match-proposals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      matchmakerId: matchmaker.id,
      friendBId: friendB.id,
      girlCId: girlC.id,
      title: `${friendB.display_name} + ${girlC.display_name} test match`
    })
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('✅ Match proposal created:', result.proposal.id);
    console.log('Check notifications for Friend B and Girl C!');
  } else {
    console.error('❌ Error:', result.error);
  }
}

createTestProposal()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
