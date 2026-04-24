const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readCollection, writeCollection } = require('../utils/storage');
const WorkspaceManager = require('../utils/workspaceManager');

const workspaceManager = new WorkspaceManager(require('path').join(__dirname, '../workspaces'));

// 默认权限配置 - 基础系统操作权限（无删除）
const DEFAULT_RUNTIME_CONFIG = {
  enabled: true,
  // 允许的命令
  allowedCommands: [
    'mkdir', 'touch', 'echo', 'cat', 'ls', 'cd', 'pwd', 'cp', 'mv',
    'chmod', 'chown', 'grep', 'find', 'head', 'tail', 'diff',
    'git', 'npm', 'node', 'python', 'pip', 'curl', 'wget',
    'sed', 'awk', 'sort', 'uniq', 'wc', 'tar', 'zip', 'unzip',
    '/home/gxd/openviking-env/bin/ov'
  ],
  // 禁止的命令（删除类）
  deniedCommands: [
    'rm', 'rmdir', 'del', 'delete', 'format', 'mkfs', 'dd',
    '>','>>'  // 重定向到危险路径会被拦截
  ],
  // 允许的文件操作
  fileOperations: {
    read: true,
    write: true,
    edit: true,
    create: true,
    mkdir: true,
    list: true,
    // 禁止删除
    delete: false
  },
  // 允许的工具
  tools: [
    'read',
    'write', 
    'edit',
    'mkdir',
    'list',
    'stat',
    'exec'
  ]
};

// GET /api/agents - List all agents
router.get('/', (req, res) => {
  const agents = readCollection('agents');
  res.json({ count: agents.length, agents });
});

// GET /api/agents/:id - Get single agent
router.get('/:id', (req, res) => {
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  // 获取工作空间信息
  const workspacePath = workspaceManager.getWorkspacePath(req.params.id);
  res.json({ ...agent, workspacePath });
});

// GET /api/agents/:id/runtime - Get agent runtime config
router.get('/:id/runtime', (req, res) => {
  const agents = readCollection('agents');
  const agent = agents.find(a => a.id === req.params.id);
  if (!agent) return res.status(404).json({ error: 'Agent not found' });
  
  // 返回运行时配置（不含敏感信息）
  const runtimeConfig = agent.runtimeConfig || DEFAULT_RUNTIME_CONFIG;
  res.json(runtimeConfig);
});

// PUT /api/agents/:id/runtime - Update agent runtime config
router.put('/:id/runtime', (req, res) => {
  const agents = readCollection('agents');
  const idx = agents.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Agent not found' });
  
  // 合并配置，保留默认配置
  agents[idx].runtimeConfig = {
    ...DEFAULT_RUNTIME_CONFIG,
    ...req.body,
    // 确保delete始终为false
    fileOperations: {
      ...DEFAULT_RUNTIME_CONFIG.fileOperations,
      ...(req.body.fileOperations || {}),
      delete: false
    }
  };
  writeCollection('agents', agents);
  
  res.json(agents[idx].runtimeConfig);
});

// POST /api/agents - Create new agent
router.post('/', async (req, res) => {
  const { name, capabilities, metadata, runtimeConfig, systemPrompt } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  
  const agentId = uuidv4();
  
  // 默认systemPrompt模板
  const defaultSystemPrompt = `你是 ${name}。\n\n【重要】你具有记忆功能：\n- 可以调用内部 API /api/memory 存储重要信息\n- 存储格式：POST /api/memory, body: {\"content\": \"要记忆的内容\"}\n- 搜索记忆：GET /api/memory?q=关键词\n- 当用户说「记住」或需要记住重要信息时，使用这个功能\n\n---\n\n## 📋 代码编程规范 (摘要)\n\n【命名】Python: snake_case, 类: PascalCase, 常量: UPPER_SNAKE_CASE\n【缩进】4空格(Python), 行长≤120字符\n【注释】解释\"为什么\"而非\"做什么\", 改代码必加注释含时间\n【组织】标准库→第三方→本地; 函数≤50行, 参数≤5个\n【异常】捕获具体类型, 记日志, 避免空except, 资源释放\n【性能】列表推导式替代循环, join替代字符串拼接\n【测试】覆盖率: 核心≥90%, 工具≥80%, 整体≥70%\n【提交】feat/fix/docs/style/refactor/test/chore: 简短描述\n\n完整规范: viking://resources/coding-standards`;
  
  const agent = {
    id: agentId,
    name,
    capabilities: capabilities || [],
    metadata: metadata || {},
    status: 'offline',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    systemPrompt: systemPrompt || defaultSystemPrompt,
    // 添加运行时配置
    runtimeConfig: {
      ...DEFAULT_RUNTIME_CONFIG,
      ...runtimeConfig
    }
  };
  
  const agents = readCollection('agents');
  agents.push(agent);
  writeCollection('agents', agents);
  
  // 为 Agent 创建工作空间
  try {
    const workspacePath = await workspaceManager.createWorkspace(agentId, name);
    agent.workspacePath = workspacePath;
  } catch (err) {
    console.error('Failed to create workspace:', err);
  }
  
  res.status(201).json(agent);
});

// PUT /api/agents/:id - Update agent
router.put('/:id', (req, res) => {
  const agents = readCollection('agents');
  const idx = agents.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Agent not found' });
  
  const oldName = agents[idx].name;
  agents[idx] = {
    ...agents[idx],
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  writeCollection('agents', agents);
  
  // 如果名称变更，可能需要更新工作空间
  if (req.body.name && req.body.name !== oldName) {
    // 可以选择重命名工作空间，这里暂不处理
  }
  
  res.json(agents[idx]);
});

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', async (req, res) => {
  const agents = readCollection('agents');
  const idx = agents.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Agent not found' });
  const [deleted] = agents.splice(idx, 1);
  writeCollection('agents', agents);
  
  // 删除工作空间
  try {
    await workspaceManager.deleteWorkspace(req.params.id);
  } catch (err) {
    console.error('Failed to delete workspace:', err);
  }
  
  res.json({ message: 'Agent deleted', agent: deleted });
});

module.exports = router;
