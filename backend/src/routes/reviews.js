const express = require('express');
const router = express.Router();
const reviewsDb = require('../db/reviews');
const auth = require('../middleware/auth');

router.get('/user/:email', async (req, res) => {
  try {
    const rows = await reviewsDb.getReviewsForUser(req.params.email);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'rating must be 1-5' });
    }
    const review = await reviewsDb.createReview({
      rentalId: Number(req.body.rentalId),
      reviewerEmail: req.user.email,
      rating,
      body: String(req.body.body || '').trim(),
    });
    res.status(201).json(review);
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' });
  }
});

module.exports = router;
