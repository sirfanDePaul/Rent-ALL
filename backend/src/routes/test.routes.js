const express = require('express');
const router = express.Router();

// GET /api/test -> return current timestamp
router.get('/', (req, res) => {
  res.json({ timestamp: new Date().toISOString() });
});

module.exports = router;
