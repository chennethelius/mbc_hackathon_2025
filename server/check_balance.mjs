import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const marketAddress = '0x3402eD2f754bC89060625B0aa5F7628F96A227Ba';
const userAddress = '0x24A95C49E7DFd830C0cEe2D0a357553D548c4556';

const marketABI = ['function usdcToken() view returns (address)'];
const market = new ethers.Contract(marketAddress, marketABI, provider);
const usdcAddress = await market.usdcToken();

const erc20ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address,address) view returns (uint256)'
];
const usdc = new ethers.Contract(usdcAddress, erc20ABI, provider);

const [balance, allowance] = await Promise.all([
  usdc.balanceOf(userAddress),
  usdc.allowance(userAddress, marketAddress)
]);

console.log('USDC Balance:', ethers.formatUnits(balance, 6), 'USDC');
console.log('Allowance to Market:', ethers.formatUnits(allowance, 6), 'USDC');

if (balance > 0) {
  console.log('\n✅ You have USDC! Ready to bet.');
  const maxBet = balance < ethers.parseUnits('1', 6) ? balance : ethers.parseUnits('1', 6);
  console.log('Can bet up to:', ethers.formatUnits(maxBet, 6), 'USDC');
} else {
  console.log('\n❌ Still showing 0 USDC. Transaction may not be confirmed yet.');
}

process.exit(0);
