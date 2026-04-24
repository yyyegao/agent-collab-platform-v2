const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readCollection, writeCollection } = require('../utils/storage');

// 解析消息中的 @ 提及
function parseMentions(content, agents) {
  const mentions = [];
  const regex = /@([^@\s]+)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const mentionName = match[1];
    // 查找匹配的 agent
    const agent = agents.find(a => a.name.includes(mentionName) || a.name.replace(/[^a-zA-Z]/g, '').toLowerCase().includes(mentionName.toLowerCase()));
    if (agent && !mentions.includes(agent.id)) {
      mentions.push(agent.id);
    }
  }
  
  return mentions;
}

// 判断发送者是否是项目经理或产品经理
function isManager(agents, senderId) {
  const sender = agents.find(a => a.id === senderId);
  if (!sender) return false;
  
  const name = sender.name;
  // 项目经理或产品经理
  return name.includes('经理') || name.includes('产品');
}

// GET /api/messages - List messages (with optional filters)
router.get('/', (req, res) => {
  const messages = readCollection('messages');
  let result = messages;

  if (req.query.from) {
    result = result.filter(m => m.from === req.query.from);
  }
  if (req.query.to) {
    result = result.filter(m => m.to === req.query.to);
  }
  if (req.query.groupId) {
    result = result.filter(m => m.groupId === req.query.groupId);
  }

  result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;
  result = result.slice(offset, offset + limit);

  res.json({ count: result.length, messages: result });
});

// GET /api/messages/:id - Get single message
router.get('/:id', (req, res) => {
  const messages = readCollection('messages');
  const message = messages.find(m => m.id === req.params.id);
  if (!message) return res.status(404).json({ error: 'Message not found' });
  res.json(message);
});

// POST /api/messages - Create/send new message
router.post('/', (req, res) => {
  const { from, to, content, groupId, type } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });

  const agents = readCollection('agents');
  const mentions = parseMentions(content, agents);
  
  // 判断发送者是否是经理
  const isSenderManager = isManager(agents, from);
  
  // 如果是经理@，则所有agent都可以回复
  const targetAgents = isSenderManager ? agents.map(a => a.id) : mentions;

  const message = {
    id: uuidv4(),
    from,
    to,
    groupId,
    type: type || 'text',
    content,
    mentions,           // @提及的agent ID列表
    targetAgents,      // 应该回复的agent列表
    isSenderManager,   // 发送者是否是经理
    read: false,
    timestamp: new Date().toISOString()
  };

  const messages = readCollection('messages');
  messages.push(message);
  writeCollection('messages', messages);

  res.status(201).json(message);
});

// PUT /api/messages/:id/read - Mark message as read
router.put('/:id/read', (req, res) => {
  const messages = readCollection('messages');
  const idx = messages.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Message not found' });

  messages[idx].read = true;
  messages[idx].readAt = new Date().toISOString();
  writeCollection('messages', messages);
  res.json(messages[idx]);
});

// DELETE /api/messages/:id - Delete message
router.delete('/:id', (req, res) => {
  const messages = readCollection('messages');
  const idx = messages.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Message not found' });

  const [deleted] = messages.splice(idx, 1);
  writeCollection('messages', messages);
  res.json({ message: 'Message deleted', message: deleted });
});

// GET /api/messages/unread/:agentId - Get unread messages for agent
router.get('/unread/:agentId', (req, res) => {
  const messages = readCollection('messages');
  const agents = readCollection('agents');
  
  const unread = messages.filter(m => {
    // 发送给该 agent 的消息
    if (m.to === req.params.agentId && !m.read) return true;
    
    // 群聊中 @ 了该 agent 的消息
    if (m.groupId && m.mentions && m.mentions.includes(req.params.agentId) && !m.read) {
      return true;
    }
    
    // 如果是经理发送的，所有agent都可以回复（显示给所有agent）
    if (m.isSenderManager && !m.read) {
      return true;
    }
    
    return false;
  });
  
  res.json({ count: unread.length, messages: unread });
});

// GET /api/messages/mentions/:agentId - Get messages that mention this agent
router.get('/mentions/:agentId', (req, res) => {
  const messages = readCollection('messages');
  
  const mentions = messages.filter(m => 
    m.mentions && m.mentions.includes(req.params.agentId)
  );
  
  res.json({ count: mentions.length, messages: mentions });
});

module.exports = router;
