import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Base Sepolia testnet configuration
export const BASE_SEPOLIA_CHAIN_ID = 84532;
export const BASE_RPC_URL = process.env.BASE_RPC_URL || 'https://sepolia.base.org';

// Create provider for Base Sepolia
export const provider = new ethers.JsonRpcProvider(BASE_RPC_URL);

// Create wallet if private key is provided
let wallet = null;
if (process.env.BLOCKCHAIN_PRIVATE_KEY && process.env.BLOCKCHAIN_PRIVATE_KEY.startsWith('0x') && process.env.BLOCKCHAIN_PRIVATE_KEY.length === 66) {
  try {
    wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
    console.log('✅ Blockchain wallet configured:', wallet.address);
  } catch (error) {
    console.warn('⚠️  Invalid blockchain private key, wallet not configured');
  }
} else {
  console.warn('⚠️  Blockchain private key not configured (this is ok for testing match proposals)');
}

export { wallet };

// Helper function to get contract instance
export function getContract(address, abi) {
  if (!wallet) {
    throw new Error('Wallet not configured');
  }
  return new ethers.Contract(address, abi, wallet);
}

// USDC contract on Base Sepolia (you'll need to deploy or use existing testnet USDC)
export const USDC_ADDRESS = '0x537dab0C9d23d2cE30a5898E42C07b1840a227Df'; // MockUSDC deployed
export const MARKET_FACTORY_ADDRESS = '0x200aC27d73eDd6E469C842b7EFb60CFcf9059773'; // MarketFactory deployed
export const USDC_DECIMALS = 6;

// Helper to format USDC amounts
export function formatUSDC(amount) {
  return ethers.parseUnits(amount.toString(), USDC_DECIMALS);
}

export function parseUSDC(amount) {
  return ethers.formatUnits(amount, USDC_DECIMALS);
}
