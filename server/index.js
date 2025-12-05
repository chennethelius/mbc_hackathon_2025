import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import marketsRouter from './routes/markets.js';
import betsRouter from './routes/bets.js';
import friendsRouter from './routes/friends.js';
import paymentsRouter from './routes/payments.js';
import usersRouter from './routes/users.js';
import vouchersRouter from './routes/vouchers.js';
import matchProposalsRouter from './routes/matchProposals.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Dating Market API is running' });
});

// API Routes
app.use('/api/markets', marketsRouter);
app.use('/api/bets', betsRouter);
app.use('/api/friends', friendsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/users', usersRouter);
app.use('/api/vouchers', vouchersRouter);
app.use('/api/match-proposals', matchProposalsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
});
