const express = require('express');
const router = express.Router();
const rentalsDb = require('../db/rentals');
const auth = require('../middleware/auth');

function logError(e) {
  if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') {
    console.error('[DB] Cannot reach database:', e.hostname || e.address || '');
  } else {
    console.error(e);
  }
}

router.post('/', auth, async (req, res) => {
  try {
    const r = await rentalsDb.createRental({ ...req.body, renterEmail: req.user.email, renterName: req.user.name });
    res.status(201).json(r);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.post('/request', auth, async (req, res) => {
  try {
    const r = await rentalsDb.createRentalRequest(req.body, req.user);
    res.status(201).json(r);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.post('/:id/respond', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { decision } = req.body;
    const r = await rentalsDb.respondToRentalRequest(id, req.user.email, decision);
    if (!r) return res.status(404).json({ message: 'Rental request not found' });
    res.json(r);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.post('/:id/payment', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await rentalsDb.submitRentalPayment(id, req.user.email);
    if (!r) return res.status(404).json({ message: 'Accepted rental not found' });
    res.json(r);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.post('/:id/initiate-return', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await rentalsDb.initiateReturn(id, req.user.email);
    if (!r) return res.status(404).json({ message: 'Active confirmed rental not found' });
    res.json(r);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.post('/:id/confirm-return', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const r = await rentalsDb.confirmReturn(id, req.user.email);
    if (!r) return res.status(404).json({ message: 'Rental pending return not found' });
    res.json(r);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.post('/:id/dispute', auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { reason, description, photos } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });
    const r = await rentalsDb.fileDispute(id, req.user.email, reason, description || '', photos || []);
    if (!r) return res.status(404).json({ message: 'Rental not found or cannot be disputed' });
    res.json(r);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.get('/', auth, async (req, res) => {
  try {
    const r = await rentalsDb.getRentals(req.user.email);
    res.json(r);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

module.exports = router;
