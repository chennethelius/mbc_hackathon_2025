import { getContract } from '../config/blockchain.js';

// ABI stubs - replace with actual ABIs after compilation
export const MARKET_FACTORY_ABI = [
  "function createMarket(address friend1, address friend2, string title, uint256 resolutionTime) returns (address)",
  "function getMarketsByCreator(address creator) view returns (address[])",
  "function getMarketCount() view returns (uint256)",
  "function allMarkets(uint256) view returns (address)",
  "event MarketCreated(address indexed marketAddress, address indexed creator, address friend1, address friend2, string title, uint256 timestamp)"
];

export const DATE_MARKET_ABI = [
  "function placeBet(bool position, uint256 amount)",
  "function addSponsorship(uint256 amount)",
  "function resolve(bool outcome)",
  "function claimWinnings()",
  "function getCurrentOdds() view returns (uint256, uint256)",
  "function getTotalPool() view returns (uint256)",
  "function getUserBet(address user) view returns (uint256, bool, bool)",
  "function totalYesPool() view returns (uint256)",
  "function totalNoPool() view returns (uint256)",
  "function totalSponsorships() view returns (uint256)",
  "function resolved() view returns (bool)",
  "function outcome() view returns (bool)",
  "function creator() view returns (address)",
  "event BetPlaced(address indexed user, bool position, uint256 amount)",
  "event MarketResolved(bool outcome, uint256 timestamp)",
  "event WinningsClaimed(address indexed user, uint256 amount)"
];

export const USDC_ABI = [
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function faucet()", // For MockUSDC testing
  "function decimals() view returns (uint8)"
];

// Contract addresses - UPDATE AFTER DEPLOYMENT
export const CONTRACT_ADDRESSES = {
  MARKET_FACTORY: process.env.MARKET_FACTORY_ADDRESS || '0x0000000000000000000000000000000000000000',
  USDC: process.env.USDC_CONTRACT_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e'
};

// Helper to get contract instances
export function getMarketFactory() {
  return getContract(CONTRACT_ADDRESSES.MARKET_FACTORY, MARKET_FACTORY_ABI);
}

export function getDateMarket(address) {
  return getContract(address, DATE_MARKET_ABI);
}

export function getUSDC() {
  return getContract(CONTRACT_ADDRESSES.USDC, USDC_ABI);
}
