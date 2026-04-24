/**
 * OpenClaw Runtime Adapter
 * 为Agent协作平台提供OpenClaw运行时能力
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class OpenClawRuntime {
  constructor(agentId, workspacePath, options = {}) {
    this.agentId = agentId;
    this.workspacePath = workspacePath;
    this.options = {
      allowedCommands: options.allowedCommands || [],
      deniedCommands: options.deniedCommands || ['rm', 'del', 'format', 'mkfs'],
      maxFileSize: options.maxFileSize || 10 * 1024 * 1024, // 10MB
      ...options
    };
  }

  /**
   * 检查命令是否允许执行
   */
  isCommandAllowed(command) {
    // 检查黑名单
    for (const denied of this.options.deniedCommands) {
      if (command.includes(denied)) {
        return { allowed: false, reason: `命令 ${denied} 被禁止` };
      }
    }
    
    // 检查白名单（如果配置了白名单）
    if (this.options.allowedCommands.length > 0) {
      for (const allowed of this.options.allowedCommands) {
        if (command.includes(allowed)) {
          return { allowed: true };
        }
      }
      return { allowed: false, reason: '命令不在允许列表中' };
    }
    
    return { allowed: true };
  }

  /**
   * 检查文件路径是否在workspace内
   */
  isPathAllowed(filePath) {
    const resolvedPath = path.resolve(filePath);
    const workspaceResolved = path.resolve(this.workspacePath);
    
    // 必须在workspace目录下
    if (!resolvedPath.startsWith(workspaceResolved)) {
      return { allowed: false, reason: '路径超出工作空间范围' };
    }
    
    return { allowed: true };
  }

  /**
   * 执行命令
   */
  async execute(command, args = [], options = {}) {
    // 检查命令权限
    const cmdCheck = this.isCommandAllowed(command);
    if (!cmdCheck.allowed) {
      return { success: false, error: cmdCheck.reason, type: 'permission' };
    }

    // 如果是文件操作，检查路径权限
    if (command === 'write' || command === 'read' || command === 'edit') {
      if (args[0]) {
        const pathCheck = this.isPathAllowed(args[0]);
        if (!pathCheck.allowed) {
          return { success: false, error: pathCheck.reason, type: 'permission' };
        }
      }
    }

    // 使用子进程直接执行命令（绕过openclaw exec）
    return new Promise((resolve) => {
      // 构建命令和参数
      const execCmd = command;
      const execArgs = args || [];
      
      if (options.timeout) {
        execArgs.push('--timeout', options.timeout.toString());
      }

      const proc = spawn(execCmd, execArgs, {
        cwd: this.workspacePath,
        env: { ...process.env, OPENCLAW_WORKSPACE: this.workspacePath },
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

      proc.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output: stdout, type: 'execute' });
        } else {
          resolve({ 
            success: false, 
            error: stderr || `命令执行失败 (code: ${code})`, 
            type: 'execute',
            code 
          });
        }
      });

      // 超时处理
      setTimeout(() => {
        proc.kill();
        resolve({ success: false, error: '命令执行超时', type: 'timeout' });
      }, options.timeout ? options.timeout * 1000 : 30000);
    });
  }

  /**
   * 读取文件
   */
  async readFile(filePath) {
    const pathCheck = this.isPathAllowed(filePath);
    if (!pathCheck.allowed) {
      return { success: false, error: pathCheck.reason, type: 'permission' };
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content, type: 'read' };
    } catch (err) {
      return { success: false, error: err.message, type: 'read' };
    }
  }

  /**
   * 写入文件
   */
  async writeFile(filePath, content) {
    const pathCheck = this.isPathAllowed(filePath);
    if (!pathCheck.allowed) {
      return { success: false, error: pathCheck.reason, type: 'permission' };
    }

    // 检查文件大小
    if (content.length > this.options.maxFileSize) {
      return { success: false, error: '文件大小超出限制', type: 'size' };
    }

    try {
      // 确保目录存在
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true, type: 'write' };
    } catch (err) {
      return { success: false, error: err.message, type: 'write' };
    }
  }

  /**
   * 编辑文件
   */
  async editFile(filePath, oldContent, newContent) {
    const pathCheck = this.isPathAllowed(filePath);
    if (!pathCheck.allowed) {
      return { success: false, error: pathCheck.reason, type: 'permission' };
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.includes(oldContent)) {
        return { success: false, error: '原内容不存在', type: 'edit' };
      }
      
      const newContentUpdated = content.replace(oldContent, newContent);
      fs.writeFileSync(filePath, newContentUpdated, 'utf-8');
      return { success: true, type: 'edit' };
    } catch (err) {
      return { success: false, error: err.message, type: 'edit' };
    }
  }

  /**
   * 创建目录
   */
  async createDir(dirPath) {
    const pathCheck = this.isPathAllowed(dirPath);
    if (!pathCheck.allowed) {
      return { success: false, error: pathCheck.reason, type: 'permission' };
    }

    try {
      fs.mkdirSync(dirPath, { recursive: true });
      return { success: true, type: 'mkdir' };
    } catch (err) {
      return { success: false, error: err.message, type: 'mkdir' };
    }
  }

  /**
   * 列出目录
   */
  async listDir(dirPath) {
    const pathCheck = this.isPathAllowed(dirPath);
    if (!pathCheck.allowed) {
      return { success: false, error: pathCheck.reason, type: 'permission' };
    }

    try {
      const files = fs.readdirSync(dirPath);
      return { success: true, files, type: 'list' };
    } catch (err) {
      return { success: false, error: err.message, type: 'list' };
    }
  }

  /**
   * 获取文件信息
   */
  async stat(filePath) {
    const pathCheck = this.isPathAllowed(filePath);
    if (!pathCheck.allowed) {
      return { success: false, error: pathCheck.reason, type: 'permission' };
    }

    try {
      const stats = fs.statSync(filePath);
      return { 
        success: true, 
        info: {
          size: stats.size,
          isDirectory: stats.isDirectory(),
          isFile: stats.isFile(),
          mtime: stats.mtime,
          ctime: stats.ctime
        },
        type: 'stat' 
      };
    } catch (err) {
      return { success: false, error: err.message, type: 'stat' };
    }
  }
}

module.exports = OpenClawRuntime;
