/**
 * Workspace API Routes
 * 管理 Agent 工作空间
 */

const express = require('express');
const router = express.Router();
const WorkspaceManager = require('../utils/workspaceManager');

const workspaceManager = new WorkspaceManager(require('path').join(__dirname, '../workspaces'));

// 获取所有工作空间
router.get('/', (req, res) => {
  try {
    const workspaces = workspaceManager.listWorkspaces();
    res.json({ workspaces });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 为 Agent 创建工作空间
router.post('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { agentName } = req.body;
    
    if (!agentName) {
      return res.status(400).json({ error: 'agentName is required' });
    }
    
    const workspacePath = await workspaceManager.createWorkspace(agentId, agentName);
    res.json({ success: true, workspacePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取特定 Agent 的工作空间
router.get('/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const workspacePath = workspaceManager.getWorkspacePath(agentId);
    
    if (!workspacePath) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    const files = {};
    ['skills', 'conversations', 'output', 'logs', 'memory'].forEach(dir => {
      files[dir] = workspaceManager.listFiles(agentId, dir);
    });
    
    res.json({ workspacePath, files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除工作空间
router.delete('/:agentId', async (req, res) => {
  try {
    const { agentId } = req.params;
    const result = await workspaceManager.deleteWorkspace(agentId);
    res.json({ success: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 保存对话
router.post('/:agentId/conversations', async (req, res) => {
  try {
    const { agentId } = req.params;
    const conversation = req.body;
    
    const filepath = await workspaceManager.saveConversation(agentId, conversation);
    res.json({ success: true, filepath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 保存日志
router.post('/:agentId/logs', async (req, res) => {
  try {
    const { agentId } = req.params;
    const { content, type = 'info' } = req.body;
    
    await workspaceManager.saveLog(agentId, content, type);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;