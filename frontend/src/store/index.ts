import { create } from 'zustand';
import { AgentConfig, Message, ChatSession, GroupChat, AgentTask } from '../types';
import api from '../services/api';

// 初始状态
const initialAgents: AgentConfig[] = [];

export const useAppStore = create<any>((set: any, get: any) => ({
  // 数据
  agents: initialAgents,
  selectedAgentId: null,
  currentSession: null,
  currentSingleSessionId: null,
  currentGroupId: null,
  sessions: [],
  groupChats: [],
  tasks: [],
  
  // UI 状态
  activeTab: 'chat',
  chatMode: 'single',
  
  // 加载状态
  isLoading: false,
  error: null,

  // ===== Agent 操作 =====
  setAgents: (agents: AgentConfig[]) => set({ agents }),
  setSessions: (sessions: ChatSession[]) => set({ sessions }),
  
  addAgent: async (agent: AgentConfig) => {
    set({ isLoading: true });
    try {
      const newAgent = await api.createAgent(agent);
      const agents = [...get().agents, newAgent];
      set({ agents, isLoading: false });
      return newAgent;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  updateAgent: async (agent: AgentConfig) => {
    set({ isLoading: true });
    try {
      await api.updateAgent(agent.id, agent);
      set({
        agents: get().agents.map((a: AgentConfig) => a.id === agent.id ? agent : a),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },
  
  deleteAgent: async (id: string) => {
    set({ isLoading: true });
    try {
      await api.deleteAgent(id);
      set({
        agents: get().agents.filter((a: AgentConfig) => a.id !== id),
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  loadAgents: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.getAgents();
      set({ agents: res.agents || [], isLoading: false });
    } catch (error: any) {
      console.error('Failed to load agents:', error);
      set({ isLoading: false });
    }
  },

  selectAgent: (id: string | null) => set({ selectedAgentId: id }),
  
  setActiveTab: (tab: string) => set({ activeTab: tab }),
  
  setChatMode: (mode: string) => set({ 
    chatMode: mode, 
    currentGroupId: mode === 'group' ? get().groupChats[0]?.id || null : null,
    ...(mode === 'single' ? { currentGroupId: null } : {})
  }),
  
  setCurrentSingleSessionId: (sessionId: string | null) => {
    const state = get();
    const session = state.sessions.find((s: ChatSession) => s.id === sessionId) || null;
    set({ 
      currentSingleSessionId: sessionId,
      currentSession: session,
      chatMode: 'single',
    });
  },

  addMessage: (message: Message, groupId?: string) => {
    const state = get();
    const targetId = groupId || state.currentSingleSessionId;
    if (!targetId) return state;
    
    let targetSession = state.sessions.find((s: ChatSession) => s.id === targetId);
    
    if (targetSession) {
      set({
        sessions: state.sessions.map((s: ChatSession) =>
          s.id === targetId
            ? { ...s, messages: [...s.messages, message], updatedAt: Date.now() }
            : s
        ),
      });
    } else {
      const newSession: ChatSession = {
        id: targetId,
        title: groupId ? '群聊' : '新对话',
        type: groupId ? 'group' : 'single',
        messages: [message],
        participants: groupId ? [] : [state.agents[0]?.id].filter(Boolean),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      set({
        sessions: [...state.sessions, newSession],
        currentSession: newSession,
      });
    }
  },

  setCurrentSession: (session: ChatSession | null) => set({ currentSession: session }),
  
  createNewSession: () => {
    const state = get();
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: '新对话',
      type: 'single',
      messages: [],
      participants: state.selectedAgentId ? [state.selectedAgentId] : [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    set({
      currentSession: newSession,
      sessions: [...state.sessions, newSession],
    });
  },
  
  createGroupSession: (session: ChatSession) => set((state: any) => ({
    sessions: [...state.sessions, session],
  })),
  
  setCurrentGroupId: (groupId: string | null) => set({ currentGroupId: groupId }),
  
  addGroupChat: async (group: GroupChat) => {
    // 保存到后端
    try {
      const res = await api.createGroup({
        name: group.name,
        description: group.description,
        memberIds: group.agents,
      });
      // 使用后端返回的群组（包含真实ID）
      set((state: any) => ({
        groupChats: [...state.groupChats, res],
        currentGroupId: res.id,
        chatMode: 'group',
      }));
    } catch (error) {
      console.error('Failed to save group:', error);
      // 即使保存失败也添加到本地
      set((state: any) => ({
        groupChats: [...state.groupChats, group],
        currentGroupId: group.id,
        chatMode: 'group',
      }));
    }
  },

  loadGroups: async () => {
    try {
      const res = await api.getGroups();
      if (res.groups) {
        set({ groupChats: res.groups });
      }
    } catch (error) {
      console.error('Failed to load groups:', error);
    }
  },

  // 加载会话历史
  loadSessions: async () => {
    try {
      const res = await api.getSessions();
      if (res.sessions && res.sessions.length > 0) {
        // 合并后端会话和当前会话（避免覆盖正在进行的会话）
        const state = get();
        const existingIds = new Set(state.sessions.map((s: ChatSession) => s.id));
        const newSessions = res.sessions.filter((s: any) => !existingIds.has(s.id));
        if (newSessions.length > 0) {
          set({ sessions: [...state.sessions, ...newSessions] });
        }
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  },

  // 保存会话到后端
  saveSession: async (session: ChatSession) => {
    try {
      // 检查是否已存在
      const existing = await api.getSession(session.id).catch(() => null);
      if (existing && existing.id) {
        await api.updateSession(session.id, session);
      } else {
        await api.saveSession(session);
      }
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  },

  addTask: (task: AgentTask) => set((state: any) => ({
    tasks: [...state.tasks, task],
  })),
  
  updateTask: (taskId: string, updates: Partial<AgentTask>) => set((state: any) => ({
    tasks: state.tasks.map((t: AgentTask) => 
      t.id === taskId ? { ...t, ...updates, updatedAt: Date.now() } : t
    ),
  })),
  
  clearTask: (taskId: string) => set((state: any) => ({
    tasks: state.tasks.filter((t: AgentTask) => t.id !== taskId),
  })),

  clearMessages: (sessionId?: string, groupId?: string) => {
    const targetId = groupId || sessionId;
    if (!targetId) return;
    
    set((state: any) => ({
      sessions: state.sessions.map((s: ChatSession) =>
        s.id === targetId
          ? { ...s, messages: [], updatedAt: Date.now() }
          : s
      ),
    }));
  },

  // 导出聊天记录
  exportMessages: (sessionId?: string, groupId?: string): string => {
    const targetId = groupId || sessionId;
    if (!targetId) return '';
    
    const session = get().sessions.find((s: ChatSession) => s.id === targetId);
    if (!session || !session.messages || session.messages.length === 0) {
      return '暂无聊天记录';
    }
    
    let mdContent = `# 聊天记录\n\n`;
    mdContent += `导出时间: ${new Date().toLocaleString()}\n\n`;
    
    session.messages.forEach((msg: Message) => {
      const senderName = msg.sender === 'user' ? '用户' : (msg.agentName || 'Agent');
      const time = new Date(msg.timestamp).toLocaleString();
      mdContent += `## ${senderName} (${time})\n\n`;
      mdContent += `${msg.content}\n\n`;
    });
    
    return mdContent;
  },

  // 导入聊天记录（解析并添加消息）
  importMessages: (content: string, sessionId?: string, groupId?: string) => {
    const targetId = groupId || sessionId;
    if (!targetId) return false;
    
    try {
      // 按 ## 分割，每段是一个消息
      const messages = content.split(/^## /gm).filter(s => s.trim());
      
      if (messages.length === 0) {
        return false;
      }
      
      // 解析消息
      const newMessages: Message[] = messages.map((msgStr: string, idx: number) => {
        // 提取发送者和时间
        const lines = msgStr.split('\n');
        const senderLine = lines[0] || '';
        // 简化处理：把内容直接作为消息
        return {
          id: `imported-${Date.now()}-${idx}`,
          content: msgStr,
          sender: 'user' as const, // 导入默认为用户消息
          timestamp: Date.now(),
        };
      });
      
      // 添加到会话
      set((state: any) => ({
        sessions: state.sessions.map((s: ChatSession) =>
          s.id === targetId
            ? { ...s, messages: [...s.messages, ...newMessages], updatedAt: Date.now() }
            : s
        ),
      }));
      
      return true;
    } catch (e) {
      console.error('导入失败:', e);
      return false;
    }
  },

  // ===== 消息发送 =====
  // 添加 fromType 参数来标识消息发送者类型（用户还是Agent）
  sendMessage: async (content: string, targetAgentId: string, fromType: 'user' | 'agent' = 'user') => {
    const state = get();
    const targetAgent = state.agents.find((a: AgentConfig) => a.id === targetAgentId);
    if (!targetAgent) throw new Error('Agent not found');

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      sender: fromType,
      fromType: fromType,  // 标识发送者类型
      timestamp: Date.now(),
    };
    get().addMessage(userMessage, state.chatMode === 'group' ? state.currentGroupId : undefined);

    const taskId = `task-${Date.now()}-${targetAgentId}`;
    const task: AgentTask = {
      id: taskId,
      agentId: targetAgentId,
      agentName: targetAgent.name,
      task: content,
      status: 'working',
      progress: 0,
      startedAt: Date.now(),
      updatedAt: Date.now(),
      inputTokens: Math.floor(content.length / 4),
      contextTokens: 200000, // 默认上下文长度
    };
    get().addTask(task);

    try {
      const sessionId = state.chatMode === 'group' ? state.currentGroupId : state.currentSingleSessionId;
      const session = state.sessions.find((s: ChatSession) => s.id === sessionId);
      const messages = session?.messages || [];

      const response = await api.chat(targetAgentId, [...messages, userMessage], targetAgent);

      get().updateTask(taskId, {
        progress: 100,
        status: 'completed',
        result: response.content,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
      });

      const agentMessage: Message = {
        id: `msg-${Date.now()}`,
        content: response.content,
        sender: 'agent',
        agentId: targetAgentId,
        agentName: targetAgent.name,
        timestamp: Date.now(),
      };
      get().addMessage(agentMessage, state.chatMode === 'group' ? state.currentGroupId : undefined);

      // 自动保存对话到 OpenViking 记忆
      try {
        const memoryContent = `对话记录 - 用户: ${content.substring(0, 100)}... | Agent: ${targetAgent.name} | 回复: ${response.content.substring(0, 150)}...`;
        await fetch('/api/memory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: memoryContent })
        });
      } catch (memErr) {
        console.log('记忆存储跳过:', memErr);
      }

      try {
        await api.saveConversation(targetAgentId, {
          messages: [...messages, userMessage, agentMessage],
          timestamp: Date.now(),
        });
      } catch (e) {
        console.error('Failed to save conversation:', e);
      }

      // 保存会话到后端
      const updatedSession = get().sessions.find((s: ChatSession) => s.id === (state.chatMode === 'group' ? state.currentGroupId : state.currentSingleSessionId));
      if (updatedSession) {
        get().saveSession(updatedSession);
      }

      return response;
    } catch (error: any) {
      get().updateTask(taskId, {
        status: 'error',
        error: error.message,
      });
      throw error;
    }
  },

  sendGroupMessage: async (content: string, fromType?: 'user' | 'agent') => {
    const state = get();
    const groupId = state.currentGroupId;
    if (!groupId) throw new Error('No group selected');

    const group = state.groupChats.find((g: GroupChat) => g.id === groupId);
    if (!group) throw new Error('Group not found');

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content,
      sender: fromType === 'agent' ? 'agent' : 'user',
      agentId: fromType === 'agent' ? state.currentSingleSessionId : undefined,
      fromType: fromType,
      timestamp: Date.now(),
    };
    get().addMessage(userMessage, groupId);

    // 解析消息中提到的所有 agent 名字
    const mentionMatches = content.match(/@([^@\s]+)/g);
    const mentions = mentionMatches ? mentionMatches.map(m => m.slice(1)) : [];
    
    // 解析消息中提到的所有 agent 名字（不带@）
    const nameMentions = content.split(/[\s,，,。.]+/).filter((word: string) => {
      const agent = state.agents.find((a: AgentConfig) => a.name.includes(word) || word.includes(a.name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '')));
      return agent;
    });
    
    // 合并 @提及 和 名字提及
    const allMentions = [...new Set([...mentions, ...nameMentions])];
    
    let targetAgentIds: string[] = [];
    
    if (fromType === 'agent') {
      // Agent 发送的消息：提到其他 Agent 名字就会触发回复
      targetAgentIds = group.agents.filter((id: string) => {
        const agent = state.agents.find((a: any) => a.id === id);
        if (!agent) return false;
        return allMentions.some((name: string) => agent.name.includes(name) || name.includes(agent.name.replace(/[^a-zA-Z\u4e00-\u9fa5]/g, '')));
      });
    } else {
      // 用户发送的消息：需要 @ 才会触发
      if (mentions.length > 0) {
        targetAgentIds = group.agents.filter((id: string) => {
          const agent = state.agents.find((a: any) => a.id === id);
          return agent && mentions.some((n: string) => agent.name.includes(n));
        });
      }
    }
    
    // 用户消息：如果没有 @ 任何人则不回复
    if (fromType !== 'agent' && targetAgentIds.length === 0) {
      return;
    }

    const taskIds: string[] = [];
    for (const agentId of targetAgentIds) {
      const agent = state.agents.find((a: AgentConfig) => a.id === agentId);
      if (!agent) continue;

      const taskId = `task-${Date.now()}-${agentId}`;
      taskIds.push(taskId);
      
      const task: AgentTask = {
        id: taskId,
        agentId,
        agentName: agent.name,
        task: content,
        status: 'working',
        progress: 0,
        startedAt: Date.now(),
        updatedAt: Date.now(),
        inputTokens: Math.floor(content.length / 4),
      };
      get().addTask(task);
    }

    const results = await Promise.all(
      targetAgentIds.map(async (agentId: string) => {
        const agent = state.agents.find((a: AgentConfig) => a.id === agentId);
        if (!agent) return null;

        try {
          const groupSession = state.sessions.find((s: ChatSession) => s.id === groupId);
          const messages = groupSession?.messages || [];

          const response = await api.chat(agentId, [...messages, userMessage], agent);

          const taskId = taskIds.find(t => t.includes(agentId));
          if (taskId) {
            get().updateTask(taskId, {
              progress: 100,
              status: 'completed',
              result: response.content,
              inputTokens: response.usage.inputTokens,
              outputTokens: response.usage.outputTokens,
              totalTokens: response.usage.totalTokens,
            });
          }

          return {
            agentId,
            content: response.content,
            agentName: agent.name,
            usage: response.usage,
          };
        } catch (error: any) {
          const taskId = taskIds.find(t => t.includes(agentId));
          if (taskId) {
            get().updateTask(taskId, {
              status: 'error',
              error: error.message,
            });
          }
          return { agentId, error: error.message };
        }
      })
    );

    for (const result of results) {
      if (result && 'content' in result) {
        const agentMessage: Message = {
          id: `msg-${Date.now()}-${result.agentId}`,
          content: String(result.content),
          sender: 'agent',
          agentId: result.agentId as string,
          agentName: result.agentName as string,
          timestamp: Date.now(),
        };
        get().addMessage(agentMessage, groupId);
        
        // 如果 agent 的回复中提到了其他 agent，触发下一轮回复
        const replyContent = result.content || "";
        
        // 检查消息中是否提到其他 agent（@ 或 名字）
        const replyMentions = replyContent.match(/@([^@\s]+)/g);
        const replyMentionNames = replyMentions ? replyMentions.map((m: string) => m.slice(1)) : [];
        
        // 也检查名字提及（不带@）
        const allWords = replyContent.split(/[\s,，,。:：]+/);
        const nameMentions = allWords.filter((word: string) => {
          if (!word || word.length < 2) return false;
          return state.agents.some((a: AgentConfig) => a.name.includes(word));
        });
        
        // 合并
        const mentionedNames = [...new Set([...replyMentionNames, ...nameMentions])];
        
        if (mentionedNames.length > 0) {
          const mentionedAgentIds = group.agents.filter((id: string) => {
            const agent = state.agents.find((a: AgentConfig) => a.id === id);
            if (!agent) return false;
            const cleanName = agent.name.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '');
            return mentionedNames.some((n: string) => 
              agent.name.includes(n) || n.includes(cleanName)
            );
          });
          
          if (mentionedAgentIds.length > 0) {
            // 延迟一下再触发，让消息先显示
            setTimeout(() => {
              const mentions = replyMentionNames;
              const replyUserMessage: Message = {
                id: `msg-${Date.now()}-reply`,
                content: String(result.content || ""),
                sender: 'agent',
                agentId: result.agentId as string,
                agentName: result.agentName as string,
                fromType: 'agent',
                timestamp: Date.now(),
              };
              
              // 为被 @ 的 agent 创建任务
              mentionedAgentIds.forEach((targetAgentId: string, idx: number) => {
                const targetAgent = state.agents.find((a: AgentConfig) => a.id === targetAgentId);
                if (!targetAgent) return;
                
                const replyTaskId = `task-${Date.now()}-reply-${targetAgentId}`;
                const replyTask: AgentTask = {
                  id: replyTaskId,
                  agentId: targetAgentId,
                  agentName: targetAgent.name,
                  task: String(result.content || ""),
                  status: 'working',
                  progress: 0,
                  startedAt: Date.now(),
                  updatedAt: Date.now(),
                };
                get().addTask(replyTask);
                
                // 调用 API 获取回复
                setTimeout(async () => {
                  try {
                    const replyResponse = await api.chat(targetAgentId, [replyUserMessage], targetAgent);
                    get().updateTask(replyTaskId, {
                      progress: 100,
                      status: 'completed',
                      result: replyResponse.content,
                    });
                    
                    const replyAgentMessage: Message = {
                      id: `msg-${Date.now()}-${targetAgentId}`,
                      content: replyResponse.content,
                      sender: 'agent',
                      agentId: targetAgentId,
                      agentName: targetAgent.name,
                      timestamp: Date.now(),
                    };
                    get().addMessage(replyAgentMessage, groupId);
                  } catch (e) {
                    get().updateTask(replyTaskId, { status: 'error', error: String(e) });
                  }
                }, (idx + 1) * 2000);
              });
            }, 500);
          }
        }
      }
    }

    return results;
  },
}));

// 初始化加载
setTimeout(() => {
  useAppStore.getState().loadAgents();
  useAppStore.getState().loadGroups();
  useAppStore.getState().loadSessions();
}, 100);