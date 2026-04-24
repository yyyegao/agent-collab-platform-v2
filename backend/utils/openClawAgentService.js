/**
 * OpenClaw SubAgent 集成服务
 * 将Agent协作平台的Agent接入真正的OpenClaw运行时
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { readCollection, writeCollection } = require('../utils/storage');

class OpenClawAgentService {
  constructor() {
    this.activeSessions = new Map(); // agentId -> { sessionKey, proc }
  }

  /**
   * 获取OpenClaw配置
   */
  getOpenClawConfig() {
    const configPath = path.join(process.env.HOME || '/home/gxd', '.openclaw', 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    }
    return null;
  }

  /**
   * 获取Agent的工作空间路径
   */
  getAgentWorkspace(agentId) {
    const workspacesPath = path.join(__dirname, '../workspaces');
    if (!fs.existsSync(workspacesPath)) return null;
    
    const entries = fs.readdirSync(workspacesPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(agentId)) {
        return path.join(workspacesPath, entry.name);
      }
    }
    return null;
  }

  /**
   * 获取Agent可用的工具列表
   */
  getAvailableTools(agentConfig) {
    const tools = [];
    
    // 基础文件操作工具
    if (agentConfig.capabilities?.includes('file-operations') || agentConfig.runtimeConfig?.fileOperations?.read) {
      tools.push('read', 'write', 'edit', 'mkdir', 'list', 'stat');
    }
    
    // 代码执行工具
    if (agentConfig.capabilities?.includes('code-execution')) {
      tools.push('exec', 'bash');
    }
    
    // 网络工具
    if (agentConfig.capabilities?.includes('web-access')) {
      tools.push('web_fetch', 'web_search');
    }
    
    // 记忆工具
    if (agentConfig.capabilities?.includes('memory')) {
      tools.push('memory_get', 'memory_search');
    }
    
    return tools;
  }

  /**
   * 获取Agent可用的Skills
   */
  getAvailableSkills(agentConfig) {
    // 读取OpenClaw的skills目录
    const skillsPath = path.join(process.env.HOME || '/home/gxd', '.openclaw', 'workspace', 'skills');
    const agentSkillsPath = path.join(process.env.HOME || '/home/gxd', '.openclaw', 'workspace', 'agent-collab-platform', 'backend', 'workspaces', agentConfig.id + '_' + agentConfig.name, 'skills');
    
    const skills = [];
    
    // 加载全局skills
    if (fs.existsSync(skillsPath)) {
      const globalSkills = fs.readdirSync(skillsPath).filter(f => f.endsWith('.md') && f !== 'SKILL.md');
      skills.push(...globalSkills.map(s => ({ name: s.replace('.md', ''), source: 'global' })));
    }
    
    // 加载agent特定的skills
    if (fs.existsSync(agentSkillsPath)) {
      const agentSpecificSkills = fs.readdirSync(agentSkillsPath).filter(f => f.endsWith('.md') && f !== 'SKILL.md');
      skills.push(...agentSpecificSkills.map(s => ({ name: s.replace('.md', ''), source: 'agent' })));
    }
    
    return skills;
  }

  /**
   * 为Agent创建OpenClaw子会话
   */
  async createSession(agentId, message, options = {}) {
    const agents = readCollection('agents');
    const agent = agents.find(a => a.id === agentId);
    
    if (!agent) {
      throw new Error('Agent not found');
    }

    const workspacePath = this.getAgentWorkspace(agentId);
    if (!workspacePath) {
      throw new Error('Agent workspace not found');
    }

    // 获取可用工具和skills
    const availableTools = this.getAvailableTools(agent);
    const availableSkills = this.getAvailableSkills(agent);

    // 构建系统提示词，包含工具和记忆能力
    let systemPrompt = agent.systemPrompt || `你是 ${agent.name}。`;
    
    // 添加工具能力描述
    if (availableTools.length > 0) {
      systemPrompt += `\n\n## 可用工具\n你可以使用以下工具来完成任务：\n`;
      systemPrompt += `- ${availableTools.join(', ')}\n`;
      
      // 添加工具使用说明
      if (availableTools.includes('read')) {
        systemPrompt += `\n### 读取文件\n当需要读取文件内容时，使用 read 工具。`;
      }
      if (availableTools.includes('write')) {
        systemPrompt += `\n### 写入文件\n当需要创建或修改文件时，使用 write 工具。`;
      }
      if (availableTools.includes('exec')) {
        systemPrompt += `\n### 执行命令\n当需要执行系统命令时，使用 exec 工具。`;
      }
    }

    // 添加记忆能力描述
    if (availableSkills.includes('memory') || agent.capabilities?.includes('memory')) {
      systemPrompt += `\n\n## 长期记忆\n你具有长期记忆能力，可以：\n`;
      systemPrompt += `- 搜索记忆库获取相关信息\n`;
      systemPrompt += `- 保存重要的对话和知识\n`;
      systemPrompt += `记忆文件位于: ${workspacePath}/memory/\n`;
    }

    // 添加Skills描述
    if (availableSkills.length > 0) {
      systemPrompt += `\n\n## 可用Skills\n你可以使用以下技能：\n`;
      for (const skill of availableSkills) {
        systemPrompt += `- ${skill.name} (${skill.source})\n`;
      }
    }

    // 使用OpenClaw CLI创建会话并执行
    return new Promise((resolve, reject) => {
      const args = [
        'agent',
        '--local',
        '-m', message,
        '--timeout', (options.timeout || 120).toString(),
        '--json'
      ];

      // 使用agent name作为标识
      const agentIdentifier = agent.name.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 20);
      args.push('--agent', agentIdentifier);
      
      // 禁用思考以加快响应
      args.push('--thinking', 'off');

      console.log(`[OpenClawAgent] Running agent ${agent.name} locally`);
      console.log(`[OpenClawAgent] Command: openclaw ${args.join(' ')}`);

      const proc = spawn('openclaw', args, {
        cwd: workspacePath,
        env: { 
          ...process.env, 
          OPENCLAW_WORKSPACE: workspacePath 
        },
        shell: true
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // 保存会话
      this.activeSessions.set(agentId, {
        sessionKey: `${agentId}_${Date.now()}`,
        proc,
        workspacePath,
        startedAt: new Date().toISOString()
      });

      proc.on('close', (code) => {
        this.activeSessions.delete(agentId);
        
        if (code === 0) {
          resolve({
            success: true,
            output: stdout,
            agentId,
            sessionKey: this.activeSessions.get(agentId)?.sessionKey
          });
        } else {
          resolve({
            success: false,
            error: stderr || `Process exited with code ${code}`,
            output: stdout,
            agentId
          });
        }
      });

      proc.on('error', (err) => {
        this.activeSessions.delete(agentId);
        reject(err);
      });

      // 超时处理
      setTimeout(() => {
        if (this.activeSessions.has(agentId)) {
          proc.kill();
          resolve({
            success: false,
            error: 'Execution timeout',
            output: stdout,
            agentId
          });
        }
      }, (options.timeout || 120) * 1000);
    });
  }

  /**
   * 读取Agent记忆
   */
  async getMemory(agentId, query = '') {
    const workspacePath = this.getAgentWorkspace(agentId);
    if (!workspacePath) {
      return { success: false, error: 'Workspace not found' };
    }

    const memoryPath = path.join(workspacePath, 'memory');
    if (!fs.existsSync(memoryPath)) {
      return { success: true, memories: [] };
    }

    const files = fs.readdirSync(memoryPath);
    const memories = [];

    for (const file of files) {
      if (file.endsWith('.md') || file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(memoryPath, file), 'utf-8');
        if (!query || content.includes(query)) {
          memories.push({
            file,
            content: content.substring(0, 1000) // 限制长度
          });
        }
      }
    }

    return { success: true, memories };
  }

  /**
   * 保存Agent记忆
   */
  async saveMemory(agentId, key, content) {
    const workspacePath = this.getAgentWorkspace(agentId);
    if (!workspacePath) {
      return { success: false, error: 'Workspace not found' };
    }

    const memoryPath = path.join(workspacePath, 'memory');
    if (!fs.existsSync(memoryPath)) {
      fs.mkdirSync(memoryPath, { recursive: true });
    }

    const filename = `${key}_${Date.now()}.md`;
    const filepath = path.join(memoryPath, filename);
    
    fs.writeFileSync(filepath, content, 'utf-8');
    
    return { success: true, path: filepath };
  }

  /**
   * 检查Agent是否在线
   */
  isAgentOnline(agentId) {
    return this.activeSessions.has(agentId);
  }

  /**
   * 终止Agent会话
   */
  async terminateSession(agentId) {
    const session = this.activeSessions.get(agentId);
    if (session) {
      session.proc.kill();
      this.activeSessions.delete(agentId);
      return { success: true };
    }
    return { success: false, error: 'No active session' };
  }
}

module.exports = new OpenClawAgentService();
