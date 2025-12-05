import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const marketAddress = '0x3402eD2f754bC89060625B0aa5F7628F96A227Ba';
const userAddress = '0x24A95C49E7DFd830C0cEe2D0a357553D548c4556';

const abi = [
  'function canBet(address) view returns (bool)',
  'function eligibleBettorCount() view returns (uint256)'
];

const market = new ethers.Contract(marketAddress, abi, provider);

try {
  const canBet = await market.canBet(userAddress);
  const count = await market.eligibleBettorCount();
  
  console.log('Eligible bettor count:', count.toString());
  console.log('Can', userAddress, 'bet?', canBet);
  
  if (!canBet) {
    console.log('\n❌ PROBLEM: Your address is NOT in the eligible bettors list!');
    console.log('This means the address was not added when calling addEligibleBettors.');
  }
} catch (error) {
  console.log('Error:', error.message);
}

process.exit(0);
