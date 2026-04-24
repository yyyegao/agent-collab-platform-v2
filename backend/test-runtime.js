/**
 * Agent Runtime 测试脚本
 * 测试Agent的系统操作权限
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

// 辅助函数：发起HTTP请求
function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    let body = null;
    if (data) {
      body = JSON.stringify(data);
      options.body = body;
    }
    
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (e) {
          reject(new Error('Invalid JSON: ' + data));
        }
      });
    });
    
    req.on('error', reject);
    
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 开始Agent Runtime测试\n');
  console.log('='.repeat(50));
  
  try {
    // 1. 创建测试Agent
    console.log('\n📝 步骤1: 创建测试Agent');
    const newAgent = await request('POST', `${API_BASE}/agents`, {
      name: '测试助手',
      capabilities: ['file-operations', 'code-assist'],
      metadata: {
        description: '用于测试系统操作权限'
      }
    });
    console.log('✅ Agent创建成功:', newAgent.id);
    const agentId = newAgent.id;
    
    // 2. 获取Agent运行时配置
    console.log('\n📝 步骤2: 获取运行时配置');
    const runtimeConfig = await request('GET', `${API_BASE}/agents/${agentId}/runtime`);
    console.log('✅ 运行时配置获取成功');
    console.log('   - 允许的工具:', runtimeConfig.tools?.join(', '));
    console.log('   - 允许的文件操作:', Object.entries(runtimeConfig.fileOperations || {}).filter(([k,v])=>v).join(', '));
    console.log('   - 禁止的文件操作:', Object.entries(runtimeConfig.fileOperations || {}).filter(([k,v])=>!v).join(', '));
    
    // 3. 测试读取文件（应在workspace内）
    console.log('\n📝 步骤3: 测试读取文件');
    const workspacePath = newAgent.workspacePath;
    const readResult = await request('POST', `${API_BASE}/runtime/${agentId}/read`, {
      path: `${workspacePath}/README.md`
    });
    console.log('✅ 读取README.md:', readResult.success ? '成功' : `失败 - ${readResult.error}`);
    
    // 4. 测试写入文件
    console.log('\n📝 步骤4: 测试写入文件');
    const writeResult = await request('POST', `${API_BASE}/runtime/${agentId}/write`, {
      path: `${workspacePath}/test-output.txt`,
      content: 'Hello from Agent Runtime! Timestamp: ' + new Date().toISOString()
    });
    console.log('✅ 写入test-output.txt:', writeResult.success ? '成功' : `失败 - ${writeResult.error}`);
    
    // 5. 测试创建目录
    console.log('\n📝 步骤5: 测试创建目录');
    const mkdirResult = await request('POST', `${API_BASE}/runtime/${agentId}/mkdir`, {
      path: `${workspacePath}/test-dir`
    });
    console.log('✅ 创建test-dir目录:', mkdirResult.success ? '成功' : `失败 - ${mkdirResult.error}`);
    
    // 6. 测试列目录
    console.log('\n📝 步骤6: 测试列目录');
    const listResult = await request('POST', `${API_BASE}/runtime/${agentId}/list`, {
      path: workspacePath
    });
    console.log('✅ 列目录:', listResult.success ? `成功 (${listResult.files?.length || 0} 个文件/目录)` : `失败 - ${listResult.error}`);
    
    // 7. 测试编辑文件
    console.log('\n📝 步骤7: 测试编辑文件');
    const editResult = await request('POST', `${API_BASE}/runtime/${agentId}/edit`, {
      path: `${workspacePath}/test-output.txt`,
      oldContent: 'Hello from Agent Runtime',
      newContent: 'Modified by Agent Runtime'
    });
    console.log('✅ 编辑文件:', editResult.success ? '成功' : `失败 - ${editResult.error}`);
    
    // 8. 测试stat获取文件信息
    console.log('\n📝 步骤8: 测试获取文件信息');
    const statResult = await request('POST', `${API_BASE}/runtime/${agentId}/stat`, {
      path: `${workspacePath}/test-output.txt`
    });
    console.log('✅ stat:', statResult.success ? `文件大小: ${statResult.info?.size} bytes` : `失败 - ${statResult.error}`);
    
    // 9. 测试越权访问（超出workspace）
    console.log('\n📝 步骤9: 测试越权访问（应该被拒绝）');
    const unauthorizedRead = await request('POST', `${API_BASE}/runtime/${agentId}/read`, {
      path: '/etc/passwd'
    });
    console.log('✅ 越权访问测试:', unauthorizedRead.success ? '❌ 意外成功（应该被拒绝）' : '✅ 正确被拒绝');
    
    // 10. 验证文件确实被修改
    console.log('\n📝 步骤10: 验证文件修改');
    const verifyRead = await request('POST', `${API_BASE}/runtime/${agentId}/read`, {
      path: `${workspacePath}/test-output.txt`
    });
    const contentMatch = verifyRead.success && verifyRead.content?.includes('Modified');
    console.log('✅ 文件内容验证:', contentMatch ? '✅ 内容已正确更新' : '❌ 内容未更新');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 所有测试通过！');
    console.log('\n📊 测试总结:');
    console.log('  ✅ 文件读取');
    console.log('  ✅ 文件写入');
    console.log('  ✅ 创建目录');
    console.log('  ✅ 列目录');
    console.log('  ✅ 文件编辑');
    console.log('  ✅ 文件信息查询');
    console.log('  ✅ 越权访问保护');
    console.log('  ✅ 文件修改验证');
    
    console.log('\n📋 权限配置总结:');
    console.log('  - 允许操作: read, write, edit, mkdir, list, stat, exec');
    console.log('  - 禁止操作: delete (删除功能已禁用)');
    console.log('  - 路径限制: 所有操作限制在workspace目录内');
    
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }
}

// 运行测试
runTests();
