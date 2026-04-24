const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readCollection, writeCollection } = require('../utils/storage');

// GET /api/sessions - List all sessions
router.get('/', (req, res) => {
  const sessions = readCollection('sessions');
  res.json({ count: sessions.length, sessions });
});

// GET /api/sessions/:id - Get single session
router.get('/:id', (req, res) => {
  const sessions = readCollection('sessions');
  const session = sessions.find(s => s.id === req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// POST /api/sessions - Create new session
router.post('/', (req, res) => {
  const { title, type, messages, participants } = req.body;
  
  const session = {
    id: req.body.id || uuidv4(),
    title: title || '新对话',
    type: type || 'single',
    messages: messages || [],
    participants: participants || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const sessions = readCollection('sessions');
  sessions.push(session);
  writeCollection('sessions', sessions);

  res.status(201).json(session);
});

// PUT /api/sessions/:id - Update session (e.g., add messages)
router.put('/:id', (req, res) => {
  const sessions = readCollection('sessions');
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Session not found' });

  sessions[idx] = {
    ...sessions[idx],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  writeCollection('sessions', sessions);
  res.json(sessions[idx]);
});

// DELETE /api/sessions/:id - Delete session
router.delete('/:id', (req, res) => {
  const sessions = readCollection('sessions');
  const idx = sessions.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Session not found' });

  const [deleted] = sessions.splice(idx, 1);
  writeCollection('sessions', sessions);
  res.json({ message: 'Session deleted', session: deleted });
});

module.exports = router;
