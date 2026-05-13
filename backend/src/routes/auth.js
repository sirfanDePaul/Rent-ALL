const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const usersDb = require('../db/users');
const subscriptionsDb = require('../db/subscriptions');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is required but was not provided in environment variables.');
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const signToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  location: user.location,
  image: user.image,
});

router.post('/register', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const name = String(req.body.name || '').trim();
    const location = String(req.body.location || '').trim();
    const subscriptionPlan = String(req.body.subscriptionPlan || '').trim().toLowerCase();
    if (!email || !password || !name || !location)
      return res.status(400).json({ message: 'name, email, password, and location required' });
    if (!emailPattern.test(email))
      return res.status(400).json({ message: 'valid email required' });
    if (password.length < 8)
      return res.status(400).json({ message: 'password must be at least 8 characters' });
    const existing = await usersDb.getUserByEmail(email);
    if (existing) return res.status(409).json({ message: 'User exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await usersDb.createUser({ email, passwordHash: hash, name, location });
    const selectedPlan = subscriptionPlan || 'basic';
    const subscription = await subscriptionsDb.upsertSubscriptionByUserId(user.id, selectedPlan);
    res.status(201).json({ token: signToken(user), user: publicUser(user), subscription });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!email || !password)
      return res.status(400).json({ message: 'email and password required' });
    const user = await usersDb.getUserByEmail(email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!user.passwordHash)
      return res.status(401).json({ message: 'This account uses Google sign-in. Please use the Google button to log in.' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const subscription = await subscriptionsDb.getSubscriptionByUserEmail(user.email);
    res.json({ token: signToken(user), user: publicUser(user), subscription });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential)
      return res.status(400).json({ message: 'Google credential required' });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email.trim().toLowerCase();
    const name = payload.name?.trim() || email;
    const image = payload.picture || '';
    const oauthId = payload.sub;

    let user = await usersDb.getUserByEmail(email);
    if (!user) {
      user = await usersDb.createOAuthUser({ email, name, image, oauthProvider: 'google', oauthId });
    }

    const subscription = await subscriptionsDb.getSubscriptionByUserEmail(user.email);
    res.json({ token: signToken(user), user: publicUser(user), subscription });
  } catch (e) {
    console.error(e);
    res.status(401).json({ message: 'Google sign-in failed' });
  }
});

module.exports = router;
