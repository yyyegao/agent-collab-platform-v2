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

  // LLM 调用
  async chat(agentId: string, messages: any[], agentConfig: any) {
    const token = getToken();
    console.log('Token from getToken():', token ? `${token.substring(0, 10)}...` : 'EMPTY');
    
    if (!token) {
      throw new Error('请先在设置中配置 API Key');
    }

    const config = getConfig();
    const appId = getAppId();
    console.log('Config:', config, 'AppId:', appId);
    
    // 处理 provider：custom 也使用 longcat
    let provider = agentConfig?.provider || config?.provider || 'minimax';
    // 如果是 longcat key (ak_开头)，使用 longcat
    if (config?.apiKey && config?.apiKey.startsWith('ak_')) {
      provider = 'longcat';
    }
    
    let model = agentConfig?.model || config?.model || 'LongCat-Flash-Thinking-2601';
    // 修复模型名称 - 转换所有MiniMax模型为LongCat模型
    if (model.includes('MiniMax') || model.includes('mini')) {
      model = 'LongCat-Flash-Thinking-2601';
    } else if (model.includes('qwen')) {
      model = 'LongCat-Flash-Thinking-2601';
    }
    
    // 根据 provider 决定 baseUrl - 用户填写的优先
    let baseUrl = config?.baseUrl || agentConfig?.baseUrl || '';
    if (!baseUrl) {
      if (provider === 'longcat') {
        // 用户提供: https://api.longcat.chat/openai
        baseUrl = 'https://api.longcat.chat/openai';
      } else if (provider === 'minimax') {
        baseUrl = 'https://api.minimax.chat/v1';
      }
    }
    
    console.log('Provider:', provider, 'Model:', model, 'BaseUrl:', baseUrl);

    // 构建消息格式
    const formattedMessages = messages.map((m: any) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    // 添加 system prompt
    const systemPrompt = agentConfig?.systemPrompt || config?.systemPrompt || 
      `你是一个名为 ${agentConfig?.name || '助手'} 的 AI 助手。`;

    // 构建请求体（不再需要，前端只发结构化数据）
    // 直接从浏览器发送请求（跳过后端代理，解决SSL问题）
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...formattedMessages,
        ],
        temperature: agentConfig?.temperature ?? 0.7,
        max_tokens: agentConfig?.maxTokens ?? 4096,
      }),
    });

    // 调试输出
    console.log('Request URL:', baseUrl + '/chat/completions');
    console.log('Token length:', token.trim().length);
    console.log('Token prefix:', token.trim().substring(0, 10));
    console.log('Provider:', provider);
    console.log('Model:', model);

    if (!response.ok) {
      let errorMsg = `API 调用失败: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMsg = errorData.error?.message || errorData.message || errorMsg;
      } catch {}
      throw new Error(errorMsg);
    }

    const data = await response.json();
    
    // 调试日志
    console.log('API Response:', JSON.stringify(data).slice(0, 500));
    
    // 兼容不同返回格式
    let content = '';
    let usage = { inputTokens: 0, outputTokens: 0, totalTokens: 0 };
    
    if (provider === 'minimax') {
      // MiniMax 可能返回不同结构
      content = data.choices?.[0]?.message?.content || 
                data.choices?.[0]?.text || 
                data.text || 
                '';
      console.log('MiniMax content:', content);
      if (data.usage) {
        usage = {
          inputTokens: data.usage.prompt_tokens || 0,
          outputTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        };
      }
    } else {
      content = data.choices?.[0]?.message?.content || '';
      if (data.usage) {
        usage = {
          inputTokens: data.usage.prompt_tokens || 0,
          outputTokens: data.usage.completion_tokens || 0,
          totalTokens: data.usage.total_tokens || 0,
        };
      }
    }

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