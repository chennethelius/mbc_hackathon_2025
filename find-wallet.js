// Paste this in your browser console after logging into the app
// This will help you find your Privy embedded wallet address

console.log('=== WALLET ADDRESS FINDER ===\n');

// Method 1: Check Privy user object
if (typeof window !== 'undefined') {
    // Try to access Privy context (may need to be on the app page)
    console.log('📱 Checking for wallet in page context...');
    
    // Check if React DevTools can see Privy context
    console.log('💡 TIP: Look at the Wallet page in the app - your address should be displayed there');
}

// Method 2: Check localStorage for Privy data
console.log('\n📦 Checking localStorage for Privy data...');
const privyKeys = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.includes('privy')) {
        privyKeys.push(key);
    }
}

if (privyKeys.length > 0) {
    console.log(`Found ${privyKeys.length} Privy-related keys:`);
    privyKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`\n🔑 ${key}:`);
        try {
            const parsed = JSON.parse(value);
            console.log(parsed);
            
            // Try to find wallet address in the data
            if (typeof parsed === 'object') {
                JSON.stringify(parsed).match(/0x[a-fA-F0-9]{40}/g)?.forEach(addr => {
                    console.log('   🎯 Potential wallet address:', addr);
                });
            }
        } catch (e) {
            console.log('   (not JSON or too large to display)');
        }
    });
} else {
    console.log('❌ No Privy data found in localStorage');
    console.log('💡 Make sure you are logged in to the app first!');
}

// Method 3: Check if MetaMask/Web3 is available
console.log('\n🦊 Checking for Web3 providers...');
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.request({ method: 'eth_requestAccounts' })
        .then(accounts => {
            console.log('✅ Connected wallet address:', accounts[0]);
            console.log('📋 Copy this address:', accounts[0]);
        })
        .catch(err => {
            console.log('❌ Could not get wallet address:', err.message);
        });
} else {
    console.log('ℹ️ No Web3 provider detected (this is normal for Privy embedded wallets)');
}

// Method 4: Instructions
console.log('\n=== HOW TO FIND YOUR WALLET ADDRESS ===');
console.log('1. Go to the Wallet page in the app');
console.log('2. Your address should be displayed at the top');
console.log('3. Or check the Settings page');
console.log('4. Or use the wallet-helper.html tool');
console.log('5. Or check Privy Dashboard: https://dashboard.privy.io');

console.log('\n✅ Script complete! Check the output above for your wallet address.');
