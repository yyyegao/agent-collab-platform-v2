/**
 * Agent Workspace Manager
 * 为每个 Agent 创建独立的工作空间，包含技能、对话、输出和日志
 */

const fs = require('fs');
const path = require('path');

class WorkspaceManager {
  constructor(basePath) {
    this.basePath = basePath;
  }

  /**
   * 为 Agent 创建工作空间
   * @param {string} agentId - Agent ID
   * @param {string} agentName - Agent 名称
   */
  async createWorkspace(agentId, agentName) {
    const sanitizedName = this.sanitizeFolderName(agentName);
    const workspacePath = path.join(this.basePath, `${agentId}_${sanitizedName}`);
    
    // 检查工作空间是否已存在
    if (fs.existsSync(workspacePath)) {
      console.log(`[Workspace] Workspace for ${agentName} already exists at ${workspacePath}`);
      return workspacePath;
    }

    // 创建目录结构
    const directories = [
      'skills',        // Agent 技能
      'conversations', // 对话历史
      'output',       // 输出文件
      'logs',         // 运行日志
      'memory',       // 记忆/上下文
      'temp',         // 临时文件
    ];

    try {
      for (const dir of directories) {
        const dirPath = path.join(workspacePath, dir);
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // 创建 agent.json 配置文件
      const configPath = path.join(workspacePath, 'agent.json');
      const agentConfig = {
        id: agentId,
        name: agentName,
        createdAt: Date.now(),
        workspacePath: workspacePath,
        directories: directories
      };
      fs.writeFileSync(configPath, JSON.stringify(agentConfig, null, 2));

      // 创建 README.md
      const readmePath = path.join(workspacePath, 'README.md');
      const readmeContent = `# Agent Workspace: ${agentName}\n\n## 目录结构\n\n- **skills/** - Agent 技能文件\n- **conversations/** - 对话历史记录\n- **output/** - 生成的输出文件\n- **logs/** - 运行日志\n- **memory/** - 长期记忆/上下文\n- **temp/** - 临时文件\n\n## 创建时间\n${new Date().toLocaleString()}\n`;
      fs.writeFileSync(readmePath, readmeContent);

      console.log(`[Workspace] Created workspace for ${agentName} at ${workspacePath}`);
      return workspacePath;
    } catch (error) {
      console.error(`[Workspace] Error creating workspace:`, error);
      throw error;
    }
  }

  /**
   * 删除 Agent 工作空间
   * @param {string} agentId - Agent ID
   */
  async deleteWorkspace(agentId) {
    const workspacePath = this.findWorkspacePath(agentId);
    
    if (workspacePath && fs.existsSync(workspacePath)) {
      fs.rmSync(workspacePath, { recursive: true, force: true });
      console.log(`[Workspace] Deleted workspace for agent ${agentId}`);
      return true;
    }
    return false;
  }

  /**
   * 获取 Agent 的工作空间路径
   * @param {string} agentId - Agent ID
   * @returns {string|null} 工作空间路径
   */
  getWorkspacePath(agentId) {
    return this.findWorkspacePath(agentId);
  }

  /**
   * 查找工作空间路径
   * @param {string} agentId - Agent ID
   * @returns {string|null}
   */
  findWorkspacePath(agentId) {
    if (!fs.existsSync(this.basePath)) return null;
    
    const entries = fs.readdirSync(this.basePath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(agentId + '_')) {
        return path.join(this.basePath, entry.name);
      }
    }
    return null;
  }

  /**
   * 获取工作空间内的文件列表
   * @param {string} agentId - Agent ID
   * @param {string} subDir - 子目录 (如 'conversations')
   */
  listFiles(agentId, subDir = null) {
    const workspacePath = this.findWorkspacePath(agentId);
    if (!workspacePath) return [];

    const targetPath = subDir ? path.join(workspacePath, subDir) : workspacePath;
    if (!fs.existsSync(targetPath)) return [];

    return fs.readdirSync(targetPath);
  }

  /**
   * 保存对话到工作空间
   * @param {string} agentId - Agent ID
   * @param {object} conversation - 对话数据
   */
  async saveConversation(agentId, conversation) {
    const workspacePath = this.findWorkspacePath(agentId);
    if (!workspacePath) {
      throw new Error(`Workspace not found for agent ${agentId}`);
    }

    const convPath = path.join(workspacePath, 'conversations');
    const filename = `conv_${Date.now()}.json`;
    const filepath = path.join(convPath, filename);

    fs.writeFileSync(filepath, JSON.stringify(conversation, null, 2));
    console.log(`[Workspace] Saved conversation to ${filepath}`);
    return filepath;
  }

  /**
   * 保存日志到工作空间
   * @param {string} agentId - Agent ID
   * @param {string} logContent - 日志内容
   * @param {string} logType - 日志类型 (info, error, debug)
   */
  async saveLog(agentId, logContent, logType = 'info') {
    const workspacePath = this.findWorkspacePath(agentId);
    if (!workspacePath) return;

    const logPath = path.join(workspacePath, 'logs');
    const date = new Date().toISOString().slice(0, 10);
    const filename = `log_${date}.log`;
    const filepath = path.join(logPath, filename);

    const logLine = `[${new Date().toISOString()}] [${logType.toUpperCase()}] ${logContent}\n`;
    fs.appendFileSync(filepath, logLine);
  }

  /**
   * 清理文件夹名称，移除非法字符
   */
  sanitizeFolderName(name) {
    return name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_').substring(0, 50);
  }

  /**
   * 获取所有工作空间列表
   */
  listWorkspaces() {
    if (!fs.existsSync(this.basePath)) return [];

    const entries = fs.readdirSync(this.basePath, { withFileTypes: true });
    const workspaces = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const configPath = path.join(entry.path, entry.name, 'agent.json');
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
          workspaces.push(config);
        }
      }
    }

    return workspaces;
  }
}

module.exports = WorkspaceManager;