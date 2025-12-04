import { useState } from 'react';
import { useSendTransaction } from '@privy-io/react-auth';
import './SendTransaction.css';

export default function SendTransaction() {
  const { sendTransaction } = useSendTransaction();
  const [recipient, setRecipient] = useState('0xE3070d3e4309afA3bC9a6b057685743CF42da77C');
  const [amount, setAmount] = useState('0.001');
  const [loading, setLoading] = useState(false);

  const onSendTransaction = async () => {
    try {
      setLoading(true);
      // Convert ETH to Wei (1 ETH = 10^18 Wei)
      const valueInWei = Math.floor(parseFloat(amount) * 1e18);
      
      await sendTransaction({
        to: recipient,
        value: valueInWei
      });
      
      alert('Transaction sent successfully!');
    } catch (error) {
      console.error('Transaction error:', error);
      alert('Transaction failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="send-transaction">
      <h3>Send Transaction</h3>
      <div className="transaction-form">
        <div className="form-group">
          <label>Recipient Address</label>
          <input
            type="text"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            placeholder="0x..."
          />
        </div>
        
        <div className="form-group">
          <label>Amount (ETH)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.001"
            min="0"
            placeholder="0.001"
          />
        </div>

        <button 
          onClick={onSendTransaction}
          disabled={loading || !recipient || !amount}
          className="send-btn"
        >
          {loading ? 'Sending...' : 'Send Transaction'}
        </button>
      </div>
    </div>
  );
}

