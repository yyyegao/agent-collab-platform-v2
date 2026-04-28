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
    const systemPrompt = agentConfig?.systemPrompt || config?.systemPrompt || 
      `你是一个名为 ${agentConfig?.name || '助手'} 的 AI 助手。`;

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