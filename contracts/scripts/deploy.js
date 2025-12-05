const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying contracts to Base Sepolia...\n");

  const signers = await hre.ethers.getSigners();
  const deployer = signers[0];
  console.log("Deploying with account:", await deployer.getAddress());
  
  const balance = await hre.ethers.provider.getBalance(await deployer.getAddress());
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    console.error("❌ No ETH in account! Get testnet ETH from https://www.alchemy.com/faucets/base-sepolia");
    process.exit(1);
  }

  // 1. Deploy MockUSDC
  console.log("📝 Deploying MockUSDC...");
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("✅ MockUSDC deployed to:", usdcAddress);

  // Mint some USDC to deployer for testing
  const mintAmount = hre.ethers.parseUnits("10000", 6); // 10,000 USDC
  await usdc.mint(await deployer.getAddress(), mintAmount);
  console.log("💰 Minted 10,000 USDC to deployer\n");

  // 2. Deploy MarketFactory
  console.log("📝 Deploying MarketFactory...");
  const MarketFactory = await hre.ethers.getContractFactory("MarketFactory");
  const factory = await MarketFactory.deploy(usdcAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ MarketFactory deployed to:", factoryAddress);

  console.log("\n🎉 Deployment Complete!\n");
  console.log("=" .repeat(60));
  console.log("Contract Addresses:");
  console.log("=" .repeat(60));
  console.log("MockUSDC:       ", usdcAddress);
  console.log("MarketFactory:  ", factoryAddress);
  console.log("=" .repeat(60));

  console.log("\n📋 Next Steps:");
  console.log("1. Update USDC_ADDRESS in server/config/blockchain.js");
  console.log("2. Update MARKET_FACTORY_ADDRESS in your frontend config");
  console.log("3. Add this to your .env:");
  console.log(`   USDC_ADDRESS=${usdcAddress}`);
  console.log(`   MARKET_FACTORY_ADDRESS=${factoryAddress}`);

  // Save addresses to file
  const fs = require('fs');
  const addresses = {
    network: "baseSepolia",
    chainId: 84532,
    contracts: {
      mockUSDC: usdcAddress,
      marketFactory: factoryAddress
    },
    deployedAt: new Date().toISOString(),
    deployer: await deployer.getAddress()
  };

  fs.writeFileSync(
    './deployed-addresses.json',
    JSON.stringify(addresses, null, 2)
  );
  console.log("\n💾 Addresses saved to contracts/deployed-addresses.json");

  // Verify contracts (optional)
  if (process.env.BASESCAN_API_KEY) {
    console.log("\n⏳ Waiting 30 seconds before verification...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    console.log("\n🔍 Verifying contracts on BaseScan...");
    try {
      await hre.run("verify:verify", {
        address: usdcAddress,
        constructorArguments: []
      });
      console.log("✅ MockUSDC verified");
    } catch (e) {
      console.log("⚠️  MockUSDC verification failed:", e.message);
    }

    try {
      await hre.run("verify:verify", {
        address: factoryAddress,
        constructorArguments: [usdcAddress]
      });
      console.log("✅ MarketFactory verified");
    } catch (e) {
      console.log("⚠️  MarketFactory verification failed:", e.message);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
