const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const subscriptionsDb = require('../db/subscriptions');

router.get('/plans', (req, res) => {
  res.json(subscriptionsDb.listPlans());
});

router.get('/me', auth, async (req, res) => {
  try {
    const subscription = await subscriptionsDb.getSubscriptionByUserEmail(req.user.email);
    res.json(subscription);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

router.post('/signup', auth, async (req, res) => {
  try {
    const { planCode } = req.body;
    const subscription = await subscriptionsDb.upsertSubscriptionByUserEmail(req.user.email, planCode);
    res.status(201).json(subscription);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

router.post('/cancel', auth, async (req, res) => {
  try {
    const subscription = await subscriptionsDb.cancelSubscriptionByUserEmail(req.user.email);
    if (!subscription) return res.status(404).json({ message: 'No active subscription found' });
    res.json(subscription);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

module.exports = router;
