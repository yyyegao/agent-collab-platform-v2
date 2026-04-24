import React from 'react';
import { GroupChat, AgentConfig, ChatSession } from '../types';

interface GroupChatListProps {
  groupChats: GroupChat[];
  sessions: ChatSession[];
  agents: AgentConfig[];
  currentGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}

export const GroupChatList: React.FC<GroupChatListProps> = ({
  groupChats,
  sessions,
  agents,
  currentGroupId,
  onSelectGroup,
  onCreateGroup,
}) => {
  const getGroupAgents = (agentIds: string[]) => {
    return agents.filter(a => agentIds.includes(a.id));
  };

  // 按最近消息时间倒序排列群聊
  const sortedGroupChats = [...groupChats].sort((a, b) => {
    const sessionA = sessions.find(s => s.id === a.id);
    const sessionB = sessions.find(s => s.id === b.id);
    const timeA = sessionA?.updatedAt || a.createdAt;
    const timeB = sessionB?.updatedAt || b.createdAt;
    return timeB - timeA;
  });

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-txt-primary">群聊</h2>
        <button
          onClick={onCreateGroup}
          className="w-8 h-8 rounded-xl bg-accent-orange text-white flex items-center justify-center hover:bg-orange-600 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {groupChats.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-warm-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-warm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-txt-secondary mb-2">还没有群聊</p>
            <p className="text-xs text-txt-muted">点击 + 创建群聊，邀请多个 Agent 协作</p>
          </div>
        ) : (
          sortedGroupChats.map(group => {
            const groupAgents = getGroupAgents(group.agents);
            const isSelected = currentGroupId === group.id;
            
            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`card-warm p-3 cursor-pointer ${
                  isSelected ? 'ring-2 ring-accent-orange border-accent-orange' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12">
                    {groupAgents.length === 1 ? (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white font-semibold">
                        {groupAgents[0].name[0]}
                      </div>
                    ) : (
                      <div className="w-12 h-12 relative">
                        {groupAgents.slice(0, 3).map((agent, idx) => (
                          <div
                            key={agent.id}
                            className="absolute w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white"
                            style={{
                              left: idx * 4,
                              zIndex: 10 - idx,
                              background: idx === 0 ? 'linear-gradient(135deg, #e85d04, #dc4a00)' : idx === 1 ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #0d9488, #0f766e)',
                            }}
                          >
                            {agent.name[0]}
                          </div>
                        ))}
                        {groupAgents.length > 3 && (
                          <div
                            className="absolute w-7 h-7 rounded-lg bg-warm-400 flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white"
                            style={{ left: 12, zIndex: 0 }}
                          >
                            +{groupAgents.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-txt-primary truncate text-sm">{group.name}</h3>
                    <p className="text-xs text-txt-muted truncate">
                      {groupAgents.map(a => a.name).join(' · ')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
