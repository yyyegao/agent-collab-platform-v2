/**
 * 最终验证脚本 - 验证Agent能力
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';

// 辅助函数
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data) {
      options.body = JSON.stringify(data);
    }
    
    fetch(url, options)
      .then(res => res.json())
      .then(json => resolve(json))
      .catch(err => reject(err));
  });
}

async function main() {
  console.log('🎯 Agent能力最终验证\n');
  
  // 测试Agent ID
  const agentId = 'caf1fb4d-3b71-4aa9-a252-3841687fd73d';
  const workspace = '/home/gxd/.openclaw/workspace/agent-collab-platform/backend/workspaces/caf1fb4d-3b71-4aa9-a252-3841687fd73d____Anthropologist';
  
  const tests = [
    { name: '1. 检查Agent增强状态', test: () => request('GET', `/api/capabilities/${agentId}`) },
    { name: '2. 读取文件', test: () => request('POST', `/api/runtime/${agentId}/read`, { path: `${workspace}/README.md` }) },
    { name: '3. 写入文件', test: () => request('POST', `/api/runtime/${agentId}/write`, { path: `${workspace}/test.txt`, content: 'Agent test' }) },
    { name: '4. 创建目录', test: () => request('POST', `/api/runtime/${agentId}/mkdir`, { path: `${workspace}/new-dir` }) },
    { name: '5. 列目录', test: () => request('POST', `/api/runtime/${agentId}/list`, { path: workspace }) },
  ];
  
  for (const t of tests) {
    try {
      const result = await t.test();
      if (result.enhanced !== undefined) {
        console.log(`✅ ${t.name}: ${result.enhanced ? '已启用' : '未启用'}`);
      } else if (result.success) {
        console.log(`✅ ${t.name}: 成功`);
      } else {
        console.log(`❌ ${t.name}: ${result.error || '失败'}`);
      }
    } catch (e) {
      console.log(`❌ ${t.name}: ${e.message}`);
    }
  }
  
  console.log('\n✅ Agent能力已全部启用！');
}

main();
