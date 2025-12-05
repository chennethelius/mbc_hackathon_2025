import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const txHash = '0x35e51ae4df354f6e7a98aa3f19ea63fa095d94361699cfdb4f7eb289893274f2';

console.log('Checking transaction:', txHash);
const receipt = await provider.getTransactionReceipt(txHash);

console.log('\nTransaction status:', receipt.status === 1 ? '✅ SUCCESS' : '❌ FAILED');
console.log('Gas used:', receipt.gasUsed.toString());
console.log('Logs count:', receipt.logs.length);

if (receipt.status === 0) {
  console.log('\n❌ TRANSACTION FAILED - Bettors were NOT added!');
}

// Check current eligible bettor count
const dateMarketABI = ['function eligibleBettorCount() view returns (uint256)'];
const market = new ethers.Contract(receipt.to, dateMarketABI, provider);
const count = await market.eligibleBettorCount();
console.log('\nCurrent eligible bettor count:', count.toString());

process.exit(0);
