/**
 * Agent Runtime 执行路由
 * 处理Agent对系统的实际操作请求
 */

const express = require('express');
const router = express.Router();
const { readCollection } = require('../utils/storage');
const WorkspaceManager = require('../utils/workspaceManager');
const OpenClawRuntime = require('../utils/openClawRuntime');

const workspaceManager = new WorkspaceManager(require('path').join(__dirname, '../workspaces'));

// 默认运行时配置
const DEFAULT_RUNTIME_CONFIG = {
  enabled: true,
  allowedCommands: [
    'mkdir', 'touch', 'echo', 'cat', 'ls', 'cd', 'pwd', 'cp', 'mv',
    'chmod', 'chown', 'grep', 'find', 'head', 'tail', 'diff',
    'git', 'npm', 'node', 'python', 'pip', 'curl', 'wget',
    'sed', 'awk', 'sort', 'uniq', 'wc', 'tar', 'zip', 'unzip'
  ],
  deniedCommands: [
    'rm', 'rmdir', 'del', 'delete', 'format', 'mkfs', 'dd', '>','>>'
  ],
  fileOperations: {
    read: true,
    write: true,
    edit: true,
    create: true,
    mkdir: true,
    list: true,
    delete: false
  },
  tools: ['read', 'write', 'edit', 'mkdir', 'list', 'stat', 'exec']
};

// 获取Agent运行时实例
function getAgentRuntime(agentId) {
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  if (!agent) return null;
  
  const workspacePath = workspaceManager.getWorkspacePath(agentId);
  if (!workspacePath) return null;
  
  const runtimeConfig = agent.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  
  return new OpenClawRuntime(agentId, workspacePath, {
    allowedCommands: runtimeConfig.allowedCommands,
    deniedCommands: runtimeConfig.deniedCommands,
    maxFileSize: runtimeConfig.maxFileSize || 10 * 1024 * 1024
  });
}

// POST /api/runtime/:agentId/exec - 执行命令
router.post('/:agentId/exec', async (req, res) => {
  const { agentId } = req.params;
  const { command, args, options } = req.body;
  
  const runtime = getAgentRuntime(agentId);
  if (!runtime) {
    return res.status(404).json({ error: 'Agent not found or no workspace' });
  }
  
  // 检查工具是否启用
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  const runtimeConfig = agent?.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  
  if (!runtimeConfig.enabled) {
    return res.status(403).json({ error: 'Runtime is disabled for this agent' });
  }
  
  if (!runtimeConfig.tools.includes('exec')) {
    return res.status(403).json({ error: 'exec tool is not allowed' });
  }
  
  try {
    const result = await runtime.execute(command, args, options);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, type: 'execute' });
  }
});

// POST /api/runtime/:agentId/read - 读取文件
router.post('/:agentId/read', async (req, res) => {
  const { agentId } = req.params;
  const { path: filePath } = req.body;
  
  const runtime = getAgentRuntime(agentId);
  if (!runtime) {
    return res.status(404).json({ error: 'Agent not found or no workspace' });
  }
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  const runtimeConfig = agent?.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  
  if (!runtimeConfig.enabled || !runtimeConfig.fileOperations.read) {
    return res.status(403).json({ error: 'read tool is not allowed' });
  }
  
  try {
    const result = await runtime.readFile(filePath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, type: 'read' });
  }
});

// POST /api/runtime/:agentId/write - 写入文件
router.post('/:agentId/write', async (req, res) => {
  const { agentId } = req.params;
  const { path: filePath, content } = req.body;
  
  const runtime = getAgentRuntime(agentId);
  if (!runtime) {
    return res.status(404).json({ error: 'Agent not found or no workspace' });
  }
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  const runtimeConfig = agent?.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  
  if (!runtimeConfig.enabled || !runtimeConfig.fileOperations.write) {
    return res.status(403).json({ error: 'write tool is not allowed' });
  }
  
  try {
    const result = await runtime.writeFile(filePath, content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, type: 'write' });
  }
});

// POST /api/runtime/:agentId/edit - 编辑文件
router.post('/:agentId/edit', async (req, res) => {
  const { agentId } = req.params;
  const { path: filePath, oldContent, newContent } = req.body;
  
  const runtime = getAgentRuntime(agentId);
  if (!runtime) {
    return res.status(404).json({ error: 'Agent not found or no workspace' });
  }
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  const runtimeConfig = agent?.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  
  if (!runtimeConfig.enabled || !runtimeConfig.fileOperations.edit) {
    return res.status(403).json({ error: 'edit tool is not allowed' });
  }
  
  try {
    const result = await runtime.editFile(filePath, oldContent, newContent);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, type: 'edit' });
  }
});

// POST /api/runtime/:agentId/mkdir - 创建目录
router.post('/:agentId/mkdir', async (req, res) => {
  const { agentId } = req.params;
  const { path: dirPath } = req.body;
  
  const runtime = getAgentRuntime(agentId);
  if (!runtime) {
    return res.status(404).json({ error: 'Agent not found or no workspace' });
  }
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  const runtimeConfig = agent?.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  
  if (!runtimeConfig.enabled || !runtimeConfig.fileOperations.mkdir) {
    return res.status(403).json({ error: 'mkdir tool is not allowed' });
  }
  
  try {
    const result = await runtime.createDir(dirPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, type: 'mkdir' });
  }
});

// POST /api/runtime/:agentId/list - 列出目录
router.post('/:agentId/list', async (req, res) => {
  const { agentId } = req.params;
  const { path: dirPath } = req.body;
  
  const runtime = getAgentRuntime(agentId);
  if (!runtime) {
    return res.status(404).json({ error: 'Agent not found or no workspace' });
  }
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  const runtimeConfig = agent?.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  
  if (!runtimeConfig.enabled || !runtimeConfig.fileOperations.list) {
    return res.status(403).json({ error: 'list tool is not allowed' });
  }
  
  try {
    const result = await runtime.listDir(dirPath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, type: 'list' });
  }
});

// POST /api/runtime/:agentId/stat - 获取文件信息
router.post('/:agentId/stat', async (req, res) => {
  const { agentId } = req.params;
  const { path: filePath } = req.body;
  
  const runtime = getAgentRuntime(agentId);
  if (!runtime) {
    return res.status(404).json({ error: 'Agent not found or no workspace' });
  }
  
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === agentId);
  const runtimeConfig = agent?.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  
  if (!runtimeConfig.enabled || !runtimeConfig.tools.includes('stat')) {
    return res.status(403).json({ error: 'stat tool is not allowed' });
  }
  
  try {
    const result = await runtime.stat(filePath);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, type: 'stat' });
  }
});

module.exports = router;
