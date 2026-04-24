import React from 'react';
import { AgentConfig, ChatSession } from '../types';
import { ChatActions } from './ChatActions';
import { useAppStore } from '../store';

interface AgentChatListProps {
  agents: AgentConfig[];
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: (agentId: string) => void;
}

export const AgentChatList: React.FC<AgentChatListProps> = ({
  agents,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
}) => {
  // 筛选单聊会话，并按最近消息时间倒序
  const singleSessions = sessions
    .filter(s => s.type === 'single')
    .sort((a, b) => {
      const ta = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : (a.updatedAt || 0);
      const tb = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : (b.updatedAt || 0);
      return tb - ta;
    });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-txt-primary">单聊</h2>
        <span className="text-xs text-txt-muted">{agents.length} Agents</span>
      </div>

      <div className="space-y-2">
        {/* 有会话的 Agent，按最近消息时间倒序 */}
        {singleSessions.map(session => {
          const agent = agents.find(a => session.participants.includes(a.id));
          if (!agent) return null;
          const isSelected = currentSessionId === session.id;
          return (
            <div
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`card-warm p-3 cursor-pointer mb-2 transition-all ${
                isSelected ? 'ring-2 ring-accent-orange border-accent-orange' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm"
                    style={{ background: 'linear-gradient(135deg, #e85d04, #dc4a00)' }}>
                    {agent.name[0]}
                  </div>
                  {agent.status === 'online' && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full status-online border-2 border-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-txt-primary truncate text-sm">{agent.name}</h3>
                    <span className="text-xs text-txt-muted">
                      {new Date(session.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-xs text-txt-muted truncate mt-0.5">
                    {session.messages[session.messages.length - 1]?.content.slice(0, 30) || '暂无消息'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        {/* 没有会话的 Agent */}
        {agents
          .filter(agent => !singleSessions.find(s => s.participants.includes(agent.id)))
          .map(agent => (
            <div
              key={agent.id}
              onClick={() => onNewChat(agent.id)}
              className="card-warm p-3 cursor-pointer mb-2 hover:border-accent-orange transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold text-sm bg-warm-200">
                  {agent.name[0]}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-txt-primary text-sm">{agent.name}</h3>
                  <p className="text-xs text-txt-muted">点击开始对话</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};