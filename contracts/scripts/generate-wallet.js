const { ethers } = require('hardhat');

async function main() {
  console.log("🔑 Generating new wallet for deployment...\n");
  
  const wallet = ethers.Wallet.createRandom();
  
  console.log("=" .repeat(60));
  console.log("⚠️  SAVE THESE CREDENTIALS SECURELY - DO NOT SHARE!");
  console.log("=" .repeat(60));
  console.log("Address:", wallet.address);
  console.log("Private Key:", wallet.privateKey);
  console.log("=" .repeat(60));
  
  console.log("\n📝 Next steps:");
  console.log("1. Add this to your .env file:");
  console.log(`   BLOCKCHAIN_PRIVATE_KEY=${wallet.privateKey}`);
  console.log("\n2. Get testnet ETH for this address:");
  console.log(`   https://www.alchemy.com/faucets/base-sepolia`);
  console.log(`   Send to: ${wallet.address}`);
  console.log("\n3. Then deploy with:");
  console.log("   npx hardhat run scripts/deploy.js --network baseSepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
