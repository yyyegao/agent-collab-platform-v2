import React from 'react';
import { AgentConfig } from '../types';
import { useAppStore } from '../store';

interface AgentCardProps {
  agent: AgentConfig;
  onDragStart?: (e: React.DragEvent) => void;
  onEdit?: (agent: AgentConfig) => void;
}

const statusColors = {
  online: 'bg-success',
  offline: 'bg-gray-400',
  busy: 'bg-warning',
};

const statusLabels = {
  online: '在线',
  offline: '离线',
  busy: '忙碌',
};

const providerLabels = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama',
  custom: '自定义',
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onDragStart, onEdit }) => {
  const { selectedAgentId, selectAgent } = useAppStore();
  const isSelected = selectedAgentId === agent.id;

  const handleEditClick = (e: React.MouseEvent) => {
    // 完全阻止所有冒泡
    e.stopPropagation();
    e.preventDefault();
    e.nativeEvent.stopImmediatePropagation();
    
    // 直接调用，不通过 props
    alert('点击成功: ' + agent.name);
    
    // 同时调用 props 回调
    if (onEdit) {
      onEdit(agent);
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => { console.log('[AgentCard] Card clicked:', agent.name); selectAgent(agent.id); }}
      className={`card-feishu p-4 cursor-pointer group ${
        isSelected ? 'ring-2 ring-primary border-primary' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* 头像 */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold shrink-0">
          {agent.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            agent.name[0]?.toUpperCase()
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{agent.name}</h3>
            <span
              className={`status-indicator ${statusColors[agent.status]}`}
              title={statusLabels[agent.status]}
            />
          </div>
          <p className="text-sm text-gray-500 truncate mt-0.5">{agent.description}</p>
          
          {/* 模型信息 */}
          <div className="flex items-center gap-2 mt-2">
            <span className="tag-feishu text-xs">
              {providerLabels[agent.provider]}
            </span>
            <span className="text-xs text-gray-400">{agent.model}</span>
          </div>
        </div>

        {/* 编辑按钮 - 移到外部了，这里保留一个简化版本 */}
        {/* 这里不再显示编辑按钮，编辑功能在 AgentList 中通过外部按钮实现 */}
      </div>
      
      {/* 能力标签 */}
      {agent.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-100">
          {agent.capabilities.slice(0, 5).map((cap) => (
            <span
              key={cap}
              className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 5 && (
            <span className="text-xs text-gray-400 px-2.5 py-1">
              +{agent.capabilities.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
