/**
 * Agent能力增强路由
 * 为Agent提供真正的系统操作权限、长期记忆和Skills
 */

const express = require('express');
const router = express.Router();
const openClawAgentService = require('../utils/openClawAgentService');
const { readCollection } = require('../utils/storage');

// 默认能力配置
const DEFAULT_CAPABILITIES = {
  // 系统操作权限
  'file-operations': {
    enabled: true,
    description: '文件操作权限',
    tools: ['read', 'write', 'edit', 'mkdir', 'list', 'stat']
  },
  // 代码执行权限
  'code-execution': {
    enabled: true,
    description: '代码执行权限',
    tools: ['exec', 'bash']
  },
  // 长期记忆
  'memory': {
    enabled: true,
    description: '长期记忆功能',
    tools: ['memory_get', 'memory_search', 'memory_save']
  },
  // 网络访问
  'web-access': {
    enabled: true,
    description: '网络访问功能',
    tools: ['web_fetch', 'web_search']
  },
  // Skills使用
  'skills': {
    enabled: true,
    description: '使用Skills的权限',
    tools: []
  }
};

// POST /api/capabilities/:agentId/enable - 启用Agent能力
router.post('/:agentId/enable', (req, res) => {
  const { agentId } = req.params;
  const { capabilities } = req.body;
  
  const agents = readCollection('agents');
  const idx = agents.findIndex(a => a.id === agentId);
  
  if (idx === -1) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  // 合并能力配置
  const currentCapabilities = agents[idx].capabilities || [];
  const newCapabilities = Array.isArray(capabilities) 
    ? capabilities 
    : [...new Set([...currentCapabilities, ...(capabilities || ['file-operations', 'memory', 'skills'])])];
  
  agents[idx].capabilities = newCapabilities;
  agents[idx].enabledCapabilities = {
    ...DEFAULT_CAPABILITIES,
    ...(agents[idx].enabledCapabilities || {}),
    ...(capabilities || {})
  };
  
  // 标记Agent已启用增强能力
  agents[idx].enhanced = true;
  agents[idx].enhancedAt = new Date().toISOString();
  
  const { writeCollection } = require('../utils/storage');
  writeCollection('agents', agents);
  
  res.json({
    success: true,
    agentId,
    capabilities: agents[idx].capabilities,
    enabledCapabilities: agents[idx].enabledCapabilities
  });
});

// GET /api/capabilities/:agentId - 获取Agent能力
router.get('/:agentId', (req, res) => {
  const { agentId } = req.params;
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  // 返回能力状态
  const capabilities = {
    ...DEFAULT_CAPABILITIES,
    ...(agent.enabledCapabilities || {})
  };
  
  // 获取可用的工具列表
  const availableTools = openClawAgentService.getAvailableTools(agent);
  const availableSkills = openClawAgentService.getAvailableSkills(agent);
  
  res.json({
    agentId: agent.id,
    agentName: agent.name,
    enhanced: agent.enhanced || false,
    capabilities,
    availableTools,
    availableSkills,
    workspacePath: openClawAgentService.getAgentWorkspace(agentId)
  });
});

// POST /api/capabilities/:agentId/execute - 使用OpenClaw执行任务
router.post('/:agentId/execute', async (req, res) => {
  const { agentId } = req.params;
  const { message, timeout } = req.body;
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  if (!agent.enhanced) {
    return res.status(403).json({ 
      error: 'Agent not enhanced yet',
      message: '请先启用Agent的能力: POST /api/capabilities/:agentId/enable'
    });
  }
  
  try {
    const result = await openClawAgentService.createSession(agentId, message, { timeout: timeout || 120 });
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/capabilities/:agentId/memory - 获取Agent记忆
router.get('/:agentId/memory', async (req, res) => {
  const { agentId } = req.params;
  const { query } = req.query;
  
  try {
    const result = await openClawAgentService.getMemory(agentId, query);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/capabilities/:agentId/memory - 保存Agent记忆
router.post('/:agentId/memory', async (req, res) => {
  const { agentId } = req.params;
  const { key, content } = req.body;
  
  if (!key || !content) {
    return res.status(400).json({ error: 'key and content are required' });
  }
  
  try {
    const result = await openClawAgentService.saveMemory(agentId, key, content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/capabilities/:agentId/skills - 获取Agent可用的Skills
router.get('/:agentId/skills', (req, res) => {
  const { agentId } = req.params;
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  
  if (!agent) {
    return res.status(404).json({ error: 'Agent not found' });
  }
  
  const skills = openClawAgentService.getAvailableSkills(agent);
  res.json({ success: true, skills });
});

// GET /api/capabilities - 获取所有可用能力配置
router.get('/', (req, res) => {
  res.json({
    defaultCapabilities: DEFAULT_CAPABILITIES,
    description: 'Agent能力配置说明'
  });
});

// POST /api/capabilities/batch-enable - 批量启用所有Agent能力
router.post('/batch-enable', (req, res) => {
  const { agentIds } = req.body;
  
  const agents = readCollection('agents');
  const { writeCollection } = require('../utils/storage');
  
  const updated = [];
  
  for (const agentId of agentIds) {
    const idx = agents.findIndex(a => a.id === agentId);
    if (idx !== -1) {
      agents[idx].capabilities = [
        ...new Set([...(agents[idx].capabilities || []), 'file-operations', 'memory', 'skills'])
      ];
      agents[idx].enabledCapabilities = DEFAULT_CAPABILITIES;
      agents[idx].enhanced = true;
      agents[idx].enhancedAt = new Date().toISOString();
      updated.push(agentId);
    }
  }
  
  writeCollection('agents', agents);
  
  res.json({
    success: true,
    updated: updated.length,
    agentIds: updated
  });
});

module.exports = router;
