const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readCollection, writeCollection } = require('../utils/storage');

// GET /api/groups - List all groups
router.get('/', (req, res) => {
  const groups = readCollection('groups');
  // 统一返回 agents 字段（兼容前端）
  const normalizedGroups = groups.map(g => ({
    ...g,
    agents: g.memberIds || g.agents || []
  }));
  res.json({ count: groups.length, groups: normalizedGroups });
});

// GET /api/groups/:id - Get single group with members
router.get('/:id', (req, res) => {
  const groups = readCollection('groups');
  const group = groups.find(g => g.id === req.params.id);
  if (!group) return res.status(404).json({ error: 'Group not found' });

  // Get member details
  const agents = readCollection('agents');
  const members = group.memberIds.map(id => agents.find(a => a.id === id)).filter(Boolean);

  res.json({ ...group, members });
});

// POST /api/groups - Create new group
router.post('/', (req, res) => {
  const { name, description, memberIds } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const group = {
    id: uuidv4(),
    name,
    description: description || '',
    memberIds: memberIds || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const groups = readCollection('groups');
  groups.push(group);
  writeCollection('groups', groups);

  res.status(201).json(group);
});

// PUT /api/groups/:id - Update group
router.put('/:id', (req, res) => {
  const groups = readCollection('groups');
  const idx = groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  groups[idx] = {
    ...groups[idx],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  writeCollection('groups', groups);
  res.json(groups[idx]);
});

// DELETE /api/groups/:id - Delete group
router.delete('/:id', (req, res) => {
  const groups = readCollection('groups');
  const idx = groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  const [deleted] = groups.splice(idx, 1);
  writeCollection('groups', groups);
  res.json({ message: 'Group deleted', group: deleted });
});

// POST /api/groups/:id/members - Add member to group
router.post('/:id/members', (req, res) => {
  const { agentId } = req.body;
  if (!agentId) return res.status(400).json({ error: 'agentId is required' });

  const groups = readCollection('groups');
  const idx = groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  if (!groups[idx].memberIds.includes(agentId)) {
    groups[idx].memberIds.push(agentId);
    groups[idx].updatedAt = new Date().toISOString();
    writeCollection('groups', groups);
  }

  res.json(groups[idx]);
});

// DELETE /api/groups/:id/members/:agentId - Remove member from group
router.delete('/:id/members/:agentId', (req, res) => {
  const groups = readCollection('groups');
  const idx = groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Group not found' });

  groups[idx].memberIds = groups[idx].memberIds.filter(id => id !== req.params.agentId);
  groups[idx].updatedAt = new Date().toISOString();
  writeCollection('groups', groups);

  res.json({ message: 'Member removed', group: groups[idx] });
});

module.exports = router;