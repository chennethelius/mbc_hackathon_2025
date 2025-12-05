import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const marketAddress = '0x3402eD2f754bC89060625B0aa5F7628F96A227Ba';

console.log('Checking contract at:', marketAddress);
const code = await provider.getCode(marketAddress);
console.log('Contract code length:', code.length);
console.log('Has code?', code !== '0x');

if (code === '0x') {
  console.log('\n❌ CONTRACT DOES NOT EXIST!');
  console.log('The transaction may have failed or the address is wrong.');
}

process.exit(0);
