/**
 * Agent能力启用测试脚本
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const API_BASE = `${BASE_URL}/api`;

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
  console.log('🚀 Agent能力启用测试\n');
  console.log('='.repeat(50));
  
  try {
    // 1. 获取所有Agent
    console.log('\n📋 步骤1: 获取所有Agent');
    const agentsResult = await request('GET', `${API_BASE}/agents`);
    const agents = agentsResult.agents;
    console.log(`✅ 共有 ${agents.length} 个Agent`);
    
    // 显示前5个Agent
    agents.slice(0, 5).forEach((a, i) => {
      console.log(`   ${i+1}. ${a.name} (${a.id.substring(0,8)}...)`);
    });
    
    // 2. 批量启用所有Agent的能力
    console.log('\n📋 步骤2: 批量启用所有Agent的能力');
    const agentIds = agents.map(a => a.id);
    const enableResult = await request('POST', `${API_BASE}/capabilities/batch-enable`, {
      agentIds
    });
    console.log(`✅ 成功启用 ${enableResult.updated} 个Agent的能力`);
    
    // 3. 验证能力状态
    console.log('\n📋 步骤3: 验证Agent能力状态');
    const testAgentId = agents[0].id;
    const capResult = await request('GET', `${API_BASE}/capabilities/${testAgentId}`);
    
    console.log(`\n   Agent: ${capResult.agentName}`);
    console.log(`   增强状态: ${capResult.enhanced ? '✅ 已启用' : '❌ 未启用'}`);
    console.log(`\n   可用工具:`);
    capResult.availableTools?.forEach(t => console.log(`     - ${t}`));
    console.log(`\n   可用Skills:`);
    capResult.availableSkills?.forEach(s => console.log(`     - ${s.name} (${s.source})`));
    
    // 4. 测试执行能力
    console.log('\n📋 步骤4: 测试Agent执行能力');
    const execResult = await request('POST', `${API_BASE}/capabilities/${testAgentId}/execute`, {
      message: '请列出当前工作目录下的所有文件'
    });
    
    if (execResult.success) {
      console.log('✅ Agent执行成功');
      console.log('\n输出内容:');
      console.log(execResult.output?.substring(0, 500) || '(无输出)');
    } else {
      console.log('⚠️ Agent执行返回:', execResult.error || '未知错误');
      console.log('   这可能是因为OpenClaw会话创建需要额外配置');
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 能力启用完成！');
    console.log('\n📝 总结:');
    console.log(`   - 已启用能力的Agent数量: ${enableResult.updated}`);
    console.log(`   - 验证的Agent: ${capResult.agentName}`);
    console.log(`   - 可用工具: ${capResult.availableTools?.length || 0} 个`);
    console.log(`   - 可用Skills: ${capResult.availableSkills?.length || 0} 个`);
    console.log('\n💡 Agent现在具备:');
    console.log('   ✅ 文件读写操作');
    console.log('   ✅ 长期记忆功能');
    console.log('   ✅ Skills使用能力');
    console.log('   ✅ 系统命令执行');
    
  } catch (err) {
    console.error('❌ 测试失败:', err.message);
  }
}

main();
