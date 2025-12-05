import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const marketAddress = '0x3402eD2f754bC89060625B0aa5F7628F96A227Ba';
const userAddress = '0x24A95C49E7DFd830C0cEe2D0a357553D548c4556';
const usdcAddress = '0x537dab0C9d23d2cE30a5898E42C07b1840a227Df';

const dateMarketABI = [
  'function canBet(address) view returns (bool)',
  'function totalYesAmount() view returns (uint256)',
  'function totalNoAmount() view returns (uint256)',
  'function bets(address) view returns (bool hasVoted, bool position, uint256 amount)',
  'function resolved() view returns (bool)'
];

const erc20ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)'
];

const market = new ethers.Contract(marketAddress, dateMarketABI, provider);
const usdc = new ethers.Contract(usdcAddress, erc20ABI, provider);

console.log('🔍 MARKET STATE CHECK\n');
const [canBet, totalYes, totalNo, bet, resolved] = await Promise.all([
  market.canBet(userAddress),
  market.totalYesAmount(),
  market.totalNoAmount(),
  market.bets(userAddress),
  market.resolved()
]);

console.log('Can Max bet?', canBet);
console.log('Already voted?', bet.hasVoted);
console.log('Market resolved?', resolved);
console.log('Total YES:', ethers.formatUnits(totalYes, 6), 'USDC');
console.log('Total NO:', ethers.formatUnits(totalNo, 6), 'USDC');

console.log('\n💵 USDC STATE CHECK\n');
const [balance, allowance] = await Promise.all([
  usdc.balanceOf(userAddress),
  usdc.allowance(userAddress, marketAddress)
]);

console.log('Max USDC balance:', ethers.formatUnits(balance, 6), 'USDC');
console.log('Allowance for market:', ethers.formatUnits(allowance, 6), 'USDC');

if (!canBet) console.log('\n❌ PROBLEM: Not eligible to bet!');
if (bet.hasVoted) console.log('\n❌ PROBLEM: Already voted!');
if (resolved) console.log('\n❌ PROBLEM: Market resolved!');
if (balance < ethers.parseUnits('32', 6)) console.log('\n❌ PROBLEM: Insufficient balance!');
if (allowance < ethers.parseUnits('32', 6)) console.log('\n❌ PROBLEM: Insufficient allowance!');

process.exit(0);
