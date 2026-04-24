const express = require('express');
const router = express.Router();
const { exec } = require('child_process');

// 同步脚本路径
const SYNC_SCRIPT = '/home/gxd/.openclaw/scripts/sync-memory-to-openviking.sh';

// 执行命令的辅助函数
function execCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { shell: '/bin/bash' }, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve({ stdout, stderr });
    });
  });
}

// POST /api/memory - 存储记忆
router.post('/', async (req, res) => {
  const { content, sessionId } = req.body;
  if (!content) return res.status(400).json({ error: 'content is required' });
  
  try {
    // 使用 ov add-memory 命令
    const safeContent = content.replace(/"/g, '\\"').replace(/\n/g, ' ');
    const cmd = `cd /home/gxd/openviking-env && source bin/activate && ov add-memory "${safeContent}"`;
    await execCommand(cmd);
    
    res.json({ success: true, message: 'Memory saved' });
  } catch (error) {
    console.error('Error saving memory:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/memory - 搜索记忆
router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'query parameter q is required' });
  
  try {
    const safeQuery = q.replace(/"/g, '\\"');
    const cmd = `cd /home/gxd/openviking-env && source bin/activate && ov find "${safeQuery}"`;
    console.log('Executing:', cmd);
    
    const { stdout, stderr } = await execCommand(cmd);
    console.log('OV stdout:', stdout);
    console.log('OV stderr:', stderr);
    
    // 解析输出
    const lines = stdout.split('\n').filter(l => l.trim() && !l.startsWith('cmd:'));
    const results = [];
    
    for (const line of lines) {
      // 跳过表头
      if (line.includes('context_type') || line.includes('---')) continue;
      
      // 简单的解析
      const parts = line.trim().split(/\s{2,}/);
      if (parts.length >= 4) {
        results.push({
          type: parts[0],
          uri: parts[1],
          level: parts[2],
          score: parts[3],
          abstract: parts.slice(4).join('  ')
        });
      }
    }
    
    res.json({ query: q, count: results.length, results });
  } catch (error) {
    console.error('Error searching memory:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/memory/sync - 手动触发同步
router.post('/sync', async (req, res) => {
  try {
    await execCommand(SYNC_SCRIPT);
    res.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    console.error('Error syncing:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
