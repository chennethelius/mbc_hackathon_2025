import { ethers } from 'ethers';
import dotenv from 'dotenv';
dotenv.config();

const provider = new ethers.JsonRpcProvider('https://sepolia.base.org');
const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey, provider);

const mockUSDC = '0x537dab0C9d23d2cE30a5898E42C07b1840a227Df';
const recipientAddress = '0x24A95C49E7DFd830C0cEe2D0a357553D548c4556';

const abi = ['function mint(address to, uint256 amount) public'];
const usdc = new ethers.Contract(mockUSDC, abi, wallet);

console.log('Minting 1000 USDC to:', recipientAddress);
const amount = ethers.parseUnits('1000', 6); // 1000 USDC

const tx = await usdc.mint(recipientAddress, amount);
console.log('Transaction sent:', tx.hash);

const receipt = await tx.wait();
console.log('✅ Minted! Transaction confirmed:', receipt.hash);
console.log('You now have 1000 USDC to test betting');

process.exit(0);
