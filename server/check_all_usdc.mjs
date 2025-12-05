import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const userAddress = '0x24A95C49E7DFd830C0cEe2D0a357553D548c4556';

// The USDC from the screenshot
const screenshotUSDC = '0x036cbd53842c5426634e7929541ec2318f3dcf7e';
// Our MockUSDC
const mockUSDC = '0x537dab0C9d23d2cE30a5898E42C07b1840a227Df';

const erc20ABI = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'];

console.log('Checking both USDC contracts:\n');

// Check screenshot USDC
const screenshot = new ethers.Contract(screenshotUSDC, erc20ABI, provider);
const [bal1, dec1] = await Promise.all([
  screenshot.balanceOf(userAddress),
  screenshot.decimals()
]);
console.log('Screenshot USDC (0x036c...):', ethers.formatUnits(bal1, dec1), 'USDC');

// Check our MockUSDC
const mock = new ethers.Contract(mockUSDC, erc20ABI, provider);
const [bal2, dec2] = await Promise.all([
  mock.balanceOf(userAddress),
  mock.decimals()
]);
console.log('Our MockUSDC (0x537d...):', ethers.formatUnits(bal2, dec2), 'USDC');

console.log('\n💡 The market is using:', mockUSDC);
console.log('💡 You need to transfer USDC to this contract or get our MockUSDC');

process.exit(0);
