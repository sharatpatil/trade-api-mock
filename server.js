const express = require('express');
const cors = require('cors');

const stocksRouter = require('./routes/stocks');
const tradesRouter = require('./routes/trades');
const realtimeRouter = require('./routes/realtime');
const walletRouter = require('./routes/wallet');
const watchlistRoutes = require('./routes/watchlist');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const pricesRouter = require('./routes/prices');



const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/stocks', stocksRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/realtime', realtimeRouter);
app.use('/api/wallet', walletRouter);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/prices', pricesRouter);


// health
app.get('/api/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Trade API mock running on http://localhost:${PORT}`));
