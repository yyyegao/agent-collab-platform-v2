// Agent 类型配置
export interface AgentConfig {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy';
  capabilities: string[];
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  workspacePath?: string;
  createdAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

// Agent 类型别名（兼容使用）
export type Agent = AgentConfig;

// Agent 任务状态
export type TaskStatus = 'idle' | 'working' | 'completed' | 'error';

// Agent 任务
export interface AgentTask {
  id: string;
  agentId: string;
  agentName: string;
  task: string;
  status: TaskStatus;
  progress: number; // 0-100
  startedAt: number;
  updatedAt: number;
  result?: string;
  error?: string;
  // Token 统计
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  contextTokens?: number; // 上下文长度
}

// 消息类型
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  fromType?: 'user' | 'agent';  // 消息发送者类型
  agentId?: string;
  agentName?: string;
  timestamp: number;
  mentions?: string[];      // @ 提及的 agent ID 列表
  isManager?: boolean;     // 发送者是否是经理（可 @ 所有 Agent）
}

// 聊天会话类型
export type SessionType = 'single' | 'group';

// 聊天会话
export interface ChatSession {
  id: string;
  title: string;
  type: SessionType;
  messages: Message[];
  participants: string[]; // agent IDs
  createdAt: number;
  updatedAt: number;
}

// 群聊
export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  agents: string[]; // agent IDs
  createdAt: number;
}
