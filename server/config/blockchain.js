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
if (process.env.BLOCKCHAIN_PRIVATE_KEY) {
  wallet = new ethers.Wallet(process.env.BLOCKCHAIN_PRIVATE_KEY, provider);
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
export const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e'; // Base Sepolia USDC
export const USDC_DECIMALS = 6;

// Helper to format USDC amounts
export function formatUSDC(amount) {
  return ethers.parseUnits(amount.toString(), USDC_DECIMALS);
}

export function parseUSDC(amount) {
  return ethers.formatUnits(amount, USDC_DECIMALS);
}
