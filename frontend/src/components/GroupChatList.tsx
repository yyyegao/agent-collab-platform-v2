import React from 'react';
import { GroupChat, AgentConfig } from '../types';

interface GroupChatListProps {
  groupChats: GroupChat[];
  agents: AgentConfig[];
  currentGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onCreateGroup: () => void;
}

export const GroupChatList: React.FC<GroupChatListProps> = ({
  groupChats,
  agents,
  currentGroupId,
  onSelectGroup,
  onCreateGroup,
}) => {
  const getGroupAgents = (agentIds: string[]) => {
    return agents.filter(a => agentIds.includes(a.id));
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">群聊</h2>
        <button
          onClick={onCreateGroup}
          className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {groupChats.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-gray-500 mb-2">还没有群聊</p>
            <p className="text-sm text-gray-400">点击 + 创建群聊，邀请多个 Agent 协作</p>
          </div>
        ) : (
          groupChats.map(group => {
            const groupAgents = getGroupAgents(group.agents);
            const isSelected = currentGroupId === group.id;
            
            return (
              <div
                key={group.id}
                onClick={() => onSelectGroup(group.id)}
                className={`card-feishu p-3 cursor-pointer ${
                  isSelected ? 'ring-2 ring-primary border-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* 群头像堆叠 */}
                  <div className="relative w-12 h-12">
                    {groupAgents.length === 1 ? (
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {groupAgents[0].name[0]}
                      </div>
                    ) : (
                      <div className="avatar-stack w-12 h-12">
                        {groupAgents.slice(0, 3).map((agent, idx) => (
                          <div
                            key={agent.id}
                            className="absolute w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              left: idx * 4,
                              zIndex: 3 - idx,
                            }}
                          >
                            {agent.name[0]}
                          </div>
                        ))}
                        {groupAgents.length > 3 && (
                          <div
                            className="absolute w-7 h-7 rounded-lg bg-gray-400 flex items-center justify-center text-white text-xs font-bold"
                            style={{ left: 12, zIndex: 0 }}
                          >
                            +{groupAgents.length - 3}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{group.name}</h3>
                    <p className="text-sm text-gray-500 truncate">
                      {groupAgents.map(a => a.name).join('、')}
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
