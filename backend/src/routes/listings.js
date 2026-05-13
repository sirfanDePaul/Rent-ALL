const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const items = await db.getListings();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

router.get('/mine', auth, async (req, res) => {
  try {
    const items = await db.getListings({ includeInactive: true, ownerEmail: req.user.email });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await db.getListingById(Number(req.params.id));
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { title, price, category, location, image, desc, status } = req.body;
    if (!title) return res.status(400).json({ message: 'title required' });
    const newItem = await db.createListing({ title, price, category, location, image, desc, status }, req.user.email);
    res.status(201).json(newItem);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

router.patch('/:id', auth, async (req, res) => {
  try {
    const item = await db.updateListing(Number(req.params.id), req.user.email, req.body);
    if (!item) return res.status(404).json({ message: 'Listing not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await db.removeListing(Number(req.params.id), req.user.email);
    if (!item) return res.status(404).json({ message: 'Listing not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(err.status || 500).json({ message: err.status ? err.message : 'Server error' });
  }
});

module.exports = router;
