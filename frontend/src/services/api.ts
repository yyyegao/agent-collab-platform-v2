/**
 * API Service - 与后端通信
 */

// 使用相对路径，通过 vite 代理访问后端
const API_BASE = '/api';

// 获取当前配置
const getConfig = () => {
  const configStr = localStorage.getItem('apiConfig');
  return configStr ? JSON.parse(configStr) : null;
};

// 获取 appId
const getAppId = () => localStorage.getItem('appId') || '';

// 获取 token
const getToken = () => {
  // 优先从 apiConfig 读（Settings 页面保存后的完整配置）
  const configStr = localStorage.getItem('apiConfig');
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      if (config.apiKey) return config.apiKey.trim();
    } catch {}
  }
  // 回退到单独的 apiKey
  const token = localStorage.getItem('apiKey');
  return token ? token.trim() : null;
};

export default {
  // Agent 管理
  async getAgents() {
    const res = await fetch(`${API_BASE}/agents`);
    return res.json();
  },

  async createAgent(agent: any) {
    const res = await fetch(`${API_BASE}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
    return res.json();
  },

  async updateAgent(id: string, agent: any) {
    const res = await fetch(`${API_BASE}/agents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent),
    });
    return res.json();
  },

  async deleteAgent(id: string) {
    const res = await fetch(`${API_BASE}/agents/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // 群聊管理
  async getGroups() {
    const res = await fetch(`${API_BASE}/groups`);
    return res.json();
  },

  async createGroup(group: any) {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(group),
    });
    return res.json();
  },

  // 会话管理
  async getSessions() {
    const res = await fetch(`${API_BASE}/sessions`);
    return res.json();
  },

  async getSession(id: string) {
    const res = await fetch(`${API_BASE}/sessions/${id}`);
    return res.json();
  },

  async saveSession(session: any) {
    const res = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return res.json();
  },

  async updateSession(id: string, session: any) {
    const res = await fetch(`${API_BASE}/sessions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    return res.json();
  },

  // LLM 调用 - 通过后端代理避免 CORS
  async chat(agentId: string, messages: any[], agentConfig: any) {
    const config = getConfig();
    
    // API Key 优先级：Agent 自己的 > Settings 全局的
    const token = agentConfig?.apiKey?.trim() || getToken();
    if (!token) {
      throw new Error('请先在设置中配置 API Key');
    }
    
    // 处理 provider
    let provider = agentConfig?.provider || config?.provider || 'minimax';
    if (token.startsWith('ak_')) {
      provider = 'longcat';
    }
    
    let model = agentConfig?.model || config?.model || 'LongCat-Flash-Thinking-2601';
    if (model.includes('MiniMax') || model.includes('mini') || model.includes('qwen')) {
      model = 'LongCat-Flash-Thinking-2601';
    }

    // 构建消息格式
    const formattedMessages = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // 添加 system prompt
    let systemPrompt = agentConfig?.systemPrompt || config?.systemPrompt || 
      `你是一个名为 ${agentConfig?.name || '助手'} 的 AI 助手。`;
    
    // 告诉 Agent 有哪些工具可用
    systemPrompt += `\n\n【你可使用的工具】
当你需要执行操作时，可以通过以下工具来完成：
- exec: 执行 Shell 命令
- read: 读取文件
- write: 写入文件
- edit: 编辑文件
- web_search: 搜索网页
- web_fetch: 获取网页内容
- memory_search: 搜索记忆库
- image_generate: 生成图片

当用户请求需要执行这些操作时，你应该主动调用相应的工具。`;
    
    // 将 agent 的 capabilities 追加到 system prompt
    if (agentConfig?.capabilities && agentConfig.capabilities.length > 0) {
      const capsText = agentConfig.capabilities.join('、');
      systemPrompt += `\n\n【额外技能】${capsText}`;
    }

    // OpenClaw 工具定义 (OpenAI function calling 格式)
    const openclawTools = [
      {
        type: 'function' as const,
        function: {
          name: 'exec',
          description: '执行 Shell 命令并返回输出结果。用于文件操作、git、系统命令等。',
          parameters: {
            type: 'object' as const,
            properties: {
              command: { type: 'string' as const, description: '要执行的 shell 命令' },
              timeout: { type: 'integer' as const, description: '超时时间(秒)，默认30' }
            },
            required: ['command' as const]
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'read',
          description: '读取文件内容',
          parameters: {
            type: 'object' as const,
            properties: {
              path: { type: 'string' as const, description: '文件路径' }
            },
            required: ['path' as const]
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'write',
          description: '创建或覆盖文件',
          parameters: {
            type: 'object' as const,
            properties: {
              path: { type: 'string' as const, description: '文件路径' },
              content: { type: 'string' as const, description: '文件内容' }
            },
            required: ['path' as const, 'content' as const]
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'edit',
          description: '编辑文件中的特定文本',
          parameters: {
            type: 'object' as const,
            properties: {
              path: { type: 'string' as const, description: '文件路径' },
              oldText: { type: 'string' as const, description: '要替换的原始文本' },
              newText: { type: 'string' as const, description: '新的替换文本' }
            },
            required: ['path' as const, 'oldText' as const, 'newText' as const]
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'web_search',
          description: '搜索网页获取实时信息',
          parameters: {
            type: 'object' as const,
            properties: {
              query: { type: 'string' as const, description: '搜索关键词' },
              count: { type: 'integer' as const, description: '返回结果数量，默认5' }
            },
            required: ['query' as const]
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'web_fetch',
          description: '获取网页内容并提取文本',
          parameters: {
            type: 'object' as const,
            properties: {
              url: { type: 'string' as const, description: '网页 URL' }
            },
            required: ['url' as const]
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'memory_search',
          description: '搜索长期记忆库获取之前保存的信息',
          parameters: {
            type: 'object' as const,
            properties: {
              query: { type: 'string' as const, description: '搜索查询' }
            },
            required: ['query' as const]
          }
        }
      },
      {
        type: 'function' as const,
        function: {
          name: 'image_generate',
          description: '生成 AI 图片',
          parameters: {
            type: 'object' as const,
            properties: {
              prompt: { type: 'string' as const, description: '图片生成描述' },
              size: { type: 'string' as const, description: '图片尺寸如 1024x1024' }
            },
            required: ['prompt' as const]
          }
        }
      }
    ];

    // 通过后端 /api/llm/chat 代理请求，避免 CORS
    const response = await fetch('/api/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': token.trim(),
      },
      body: JSON.stringify({
        provider,
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedMessages,
        ],
        temperature: agentConfig?.temperature ?? 0.7,
        maxTokens: agentConfig?.maxTokens ?? 4096,
        tools: openclawTools,
      }),
    });

    if (!response.ok) {
      let errorMsg = `API 调用失败: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error?.message || errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    const content = data.choices?.[0]?.message?.content || '';
    const usage = {
      inputTokens: data.usage?.prompt_tokens || 0,
      outputTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    };

    return {
      content,
      usage,
    };
  },

  // 工作空间
  async getWorkspace(agentId: string) {
    const res = await fetch(`${API_BASE}/workspaces/${agentId}`);
    if (!res.ok) return null;
    return res.json();
  },

  async saveConversation(agentId: string, conversation: any) {
    const res = await fetch(`${API_BASE}/workspaces/${agentId}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conversation),
    });
    return res.json();
  },

  async saveLog(agentId: string, logContent: string, logType: string) {
    const res = await fetch(`${API_BASE}/workspaces/${agentId}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: logContent, type: logType }),
    });
    return res.json();
  },
};