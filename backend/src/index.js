const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const listingsRouter = require('./routes/listings');
const authRouter = require('./routes/auth');
const reviewsRouter = require('./routes/reviews');
const subscriptionsRouter = require('./routes/subscriptions');

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
// Allow larger JSON payloads (frontend may send base64 images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes
app.use('/api/auth', authRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/subscriptions', subscriptionsRouter);

// Add DB connection
const testRoutes = require('./routes/test.routes');
app.use('/api/test', testRoutes);

const rentalsRouter = require('./routes/rentals');
const messagesRouter = require('./routes/messages');
app.use('/api/rentals', rentalsRouter);
app.use('/api/messages', messagesRouter);


// Serve frontend build if present so backend and frontend are on the same origin
const buildPath = path.join(__dirname, '..', '..', 'frontend', 'build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ message: 'Not found' });
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => res.send({ status: 'ok', message: 'RentAll backend' }));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
