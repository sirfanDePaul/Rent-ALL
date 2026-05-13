const express = require('express');
const router = express.Router();
const messagesDb = require('../db/messages');
const auth = require('../middleware/auth');

function logError(e) {
  if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED') {
    console.error('[DB] Cannot reach database:', e.hostname || e.address || '');
  } else {
    console.error(e);
  }
}

router.get('/conversations/:email', auth, async (req, res) => {
  try {
    if (req.params.email.toLowerCase() !== req.user.email.toLowerCase()) return res.status(403).json({ message: 'Forbidden' });
    const rows = await messagesDb.getConversations(req.user.email);
    res.json(rows);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.get('/:conversationId', auth, async (req, res) => {
  try {
    const participants = req.params.conversationId.split(':').map(v => v.toLowerCase());
    if (!participants.includes(req.user.email.toLowerCase())) return res.status(403).json({ message: 'Forbidden' });
    const rows = await messagesDb.getMessages(req.params.conversationId);
    res.json(rows);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const to = String(req.body.to || '').trim().toLowerCase();
    const body = String(req.body.body || '').trim();
    if (!to || !body) return res.status(400).json({ message: 'to and body required' });
    const msg = await messagesDb.sendMessage({ from: req.user.email, to, body });
    res.status(201).json(msg);
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

router.post('/mark-read', auth, async (req, res) => {
  try {
    await messagesDb.markRead(req.body.conversationId, req.user.email);
    res.json({ success: true });
  } catch (e) { logError(e); res.status(e.status || 500).json({ message: e.status ? e.message : 'Server error' }); }
});

module.exports = router;
