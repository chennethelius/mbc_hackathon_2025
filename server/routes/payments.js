import express from 'express';
import axios from 'axios';
import { supabase } from '../config/supabase.js';

const router = express.Router();

const CIRCLE_API_URL = 'https://api-sandbox.circle.com';
const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;

// Helper function to make Circle API requests
async function circleRequest(method, endpoint, data = null) {
  try {
    const response = await axios({
      method,
      url: `${CIRCLE_API_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      data
    });
    return response.data;
  } catch (error) {
    console.error('Circle API Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Circle API request failed');
  }
}

// Deposit USDC (from credit card to user wallet)
router.post('/deposit', async (req, res) => {
  try {
    const { user_id, amount, source } = req.body;

    if (!user_id || !amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    // Get user's wallet address
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user_id)
      .single();

    if (!profile?.wallet_address) {
      return res.status(400).json({ error: 'User wallet not found' });
    }

    // Create payment with Circle (sandbox mode)
    const payment = await circleRequest('POST', '/v1/payments', {
      amount: {
        amount: amount.toString(),
        currency: 'USD'
      },
      source: source || { type: 'card' },
      description: 'USDC deposit for dating market',
      metadata: {
        userId: user_id,
        email: profile.email
      }
    });

    // Record transaction in database
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        user_id,
        type: 'deposit',
        amount,
        currency: 'USDC',
        status: 'pending',
        circle_payment_id: payment.data?.id,
        metadata: { payment }
      })
      .select()
      .single();

    res.json({
      transaction,
      payment: payment.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Withdraw USDC (from platform to external wallet)
router.post('/withdraw', async (req, res) => {
  try {
    const { user_id, amount, destination_address } = req.body;

    if (!user_id || !amount || !destination_address) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check user balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('usdc_balance')
      .eq('id', user_id)
      .single();

    if (parseFloat(profile.usdc_balance) < parseFloat(amount)) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Create Circle transfer
    const transfer = await circleRequest('POST', '/v1/transfers', {
      source: {
        type: 'wallet',
        id: 'platform_wallet_id' // You'll configure this
      },
      destination: {
        type: 'blockchain',
        address: destination_address,
        chain: 'BASE'
      },
      amount: {
        amount: amount.toString(),
        currency: 'USD'
      }
    });

    // Update user balance
    await supabase
      .from('profiles')
      .update({
        usdc_balance: parseFloat(profile.usdc_balance) - parseFloat(amount)
      })
      .eq('id', user_id);

    // Record transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .insert({
        user_id,
        type: 'withdrawal',
        amount,
        currency: 'USDC',
        status: 'pending',
        circle_payment_id: transfer.data?.id,
        metadata: { transfer, destination_address }
      })
      .select()
      .single();

    res.json({ transaction, transfer: transfer.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payment status
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const payment = await circleRequest('GET', `/v1/payments/${req.params.paymentId}`);
    res.json({ payment: payment.data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's transaction history
router.get('/transactions/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json({ transactions: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user balance
router.get('/balance/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('usdc_balance')
      .eq('id', req.params.userId)
      .single();

    if (error) throw error;
    res.json({ balance: data.usdc_balance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for Circle payment notifications
router.post('/webhook/circle', async (req, res) => {
  try {
    const event = req.body;
    
    console.log('Circle webhook received:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'payment.confirmed':
        // Update transaction status
        await supabase
          .from('transactions')
          .update({ status: 'completed' })
          .eq('circle_payment_id', event.payment?.id);
        
        // Update user balance for deposits
        if (event.payment) {
          const { data: transaction } = await supabase
            .from('transactions')
            .select('user_id, amount')
            .eq('circle_payment_id', event.payment.id)
            .eq('type', 'deposit')
            .single();

          if (transaction) {
            await supabase.rpc('increment_decimal', {
              table_name: 'profiles',
              row_id: transaction.user_id,
              column_name: 'usdc_balance',
              amount: transaction.amount
            });
          }
        }
        break;

      case 'payment.failed':
        await supabase
          .from('transactions')
          .update({ status: 'failed' })
          .eq('circle_payment_id', event.payment?.id);
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
