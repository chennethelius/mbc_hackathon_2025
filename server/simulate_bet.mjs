import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const marketAddress = '0x3402eD2f754bC89060625B0aa5F7628F96A227Ba';
const userAddress = '0x24A95C49E7DFd830C0cEe2D0a357553D548c4556';

// Get USDC address from market
const marketABI = ['function usdcToken() view returns (address)'];
const market = new ethers.Contract(marketAddress, marketABI, provider);
const usdcAddress = await market.usdcToken();

console.log('USDC Token:', usdcAddress);

// Check USDC balance and allowance
const erc20ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)',
  'function decimals() view returns (uint8)'
];
const usdc = new ethers.Contract(usdcAddress, erc20ABI, provider);

const [balance, allowance, decimals] = await Promise.all([
  usdc.balanceOf(userAddress),
  usdc.allowance(userAddress, marketAddress),
  usdc.decimals()
]);

console.log('\nUSdc Balance:', ethers.formatUnits(balance, decimals), 'USDC');
console.log('Allowance:', ethers.formatUnits(allowance, decimals), 'USDC');
console.log('Decimals:', decimals);

const betAmount = ethers.parseUnits('32', decimals);
console.log('\nTrying to bet:', ethers.formatUnits(betAmount, decimals), 'USDC');

if (balance < betAmount) {
  console.log('❌ INSUFFICIENT BALANCE!');
  console.log('You need', ethers.formatUnits(betAmount - balance, decimals), 'more USDC');
}

if (allowance < betAmount) {
  console.log('❌ INSUFFICIENT ALLOWANCE!');
  console.log('Need to approve', ethers.formatUnits(betAmount - allowance, decimals), 'more USDC');
}

process.exit(0);
