import React, { useState } from 'react';
import { AgentConfig, GroupChat } from '../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (group: GroupChat) => void;
  agents: AgentConfig[];
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  agents,
}) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);

  React.useEffect(() => {
    if (isOpen) {
      setGroupName('');
      setDescription('');
      setSelectedAgents([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleAgent = (agentId: string) => {
    setSelectedAgents(prev =>
      prev.includes(agentId)
        ? prev.filter(id => id !== agentId)
        : [...prev, agentId]
    );
  };

  const handleCreate = () => {
    if (!groupName.trim() || selectedAgents.length < 2) return;
    
    const newGroup: GroupChat = {
      id: `group-${Date.now()}`,
      name: groupName.trim(),
      description: description.trim(),
      agents: selectedAgents,
      createdAt: Date.now(),
    };
    
    onCreate(newGroup);
    onClose();
  };

  return (
    <div className="modal-overlay-warm" onClick={onClose}>
      <div className="modal-content-warm max-w-lg max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header - fixed */}
        <div className="shrink-0 px-6 py-4 border-b border-warm-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-txt-primary">创建群聊</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-warm-100 flex items-center justify-center text-txt-muted"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          {/* 群聊名称 */}
          <div className="mb-4">
            <label className="label-warm">群聊名称 *</label>
            <input
              type="text"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
              placeholder="例如：项目讨论组"
              className="input-warm"
            />
          </div>

          {/* 群描述 */}
          <div className="mb-5">
            <label className="label-warm">群描述</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="这个群聊的用途是..."
              className="input-warm min-h-[60px] resize-none"
            />
          </div>

          {/* 选择 Agent */}
          <div className="mb-4">
            <label className="label-warm">
              选择 Agent (至少 2 个) *
              <span className="ml-2 text-txt-muted font-normal">
                ({selectedAgents.length} 已选择)
              </span>
            </label>
            <div className="space-y-2">
              {agents.map(agent => {
                const isSelected = selectedAgents.includes(agent.id);
                return (
                  <div
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-accent-orange/10 border-2 border-accent-orange'
                        : 'bg-warm-50 border-2 border-transparent hover:bg-warm-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white font-bold">
                      {agent.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-txt-primary truncate">{agent.name}</h4>
                      <p className="text-sm text-txt-muted truncate">{agent.description}</p>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? 'border-accent-orange bg-accent-orange'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer buttons - fixed */}
        <div className="shrink-0 px-6 py-4 border-t border-warm-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl bg-warm-100 text-txt-secondary font-medium hover:bg-warm-200 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!groupName.trim() || selectedAgents.length < 2}
            className="flex-1 px-4 py-2.5 rounded-xl bg-accent-orange text-white font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-warm"
          >
            创建群聊
          </button>
        </div>
      </div>
    </div>
  );
};
