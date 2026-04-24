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
  // 筛选单聊会话
  const singleSessions = sessions.filter(s => s.type === 'single');

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">单聊</h2>
      </div>

      {/* Agent 列表 - 可以发起新会话 */}
      <div className="space-y-2">
        {agents.map(agent => {
          // 查找该 agent 最近的会话
          const agentSession = singleSessions.find(s => 
            s.participants.includes(agent.id)
          );
          const isSelected = currentSessionId === agentSession?.id;
          
          return (
            <div key={agent.id}>
              {/* 如果有会话，显示会话卡片 */}
              {agentSession ? (
                <div
                  onClick={() => onSelectSession(agentSession.id)}
                  className={`card-feishu p-3 cursor-pointer mb-2 ${
                    isSelected ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                      agent.status === 'online' ? 'bg-gradient-to-br from-primary to-secondary' :
                      agent.status === 'busy' ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {agent.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
                        <span className="text-xs text-gray-400">
                          {new Date(agentSession.updatedAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {agentSession.messages[agentSession.messages.length - 1]?.content.slice(0, 30) || '暂无消息'}
                        {agentSession.messages[agentSession.messages.length - 1]?.content.length > 30 ? '...' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* 如果没有会话，显示为可发起聊天 */
                <div
                  onClick={() => onNewChat(agent.id)}
                  className="card-feishu p-3 cursor-pointer mb-2 hover:border-primary"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                      agent.status === 'online' ? 'bg-gradient-to-br from-primary to-secondary' :
                      agent.status === 'busy' ? 'bg-gradient-to-br from-orange-400 to-orange-500' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      {agent.name[0]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-xs text-gray-400">点击开始对话</p>
                    </div>
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 历史会话记录（如果有的话） */}
      {singleSessions.length > agents.length && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-2">历史会话</h3>
          <div className="space-y-2">
            {singleSessions.slice(agents.length).map(session => {
              const sessionAgent = agents.find(a => session.participants.includes(a.id));
              return (
                <div
                  key={session.id}
                  onClick={() => onSelectSession(session.id)}
                  className="p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold">
                      {sessionAgent?.name[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{sessionAgent?.name || '未知'}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {session.messages[session.messages.length - 1]?.content.slice(0, 20)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};