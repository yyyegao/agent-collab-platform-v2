import React from 'react';
import { AgentConfig } from '../types';

const AvatarSVG = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#e85d04"/>
    <circle cx="24" cy="20" r="8" fill="white" fillOpacity="0.9"/>
    <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" fillOpacity="0.9"/>
  </svg>
);
import { useAppStore } from '../store';

interface AgentCardProps {
  agent: AgentConfig;
  onDragStart?: (e: React.DragEvent) => void;
  onEdit?: (agent: AgentConfig) => void;
}

const statusColors = {
  online: 'bg-green-500',
  offline: 'bg-warm-400',
  busy: 'bg-amber-500',
};

const statusLabels = {
  online: '在线',
  offline: '离线',
  busy: '忙碌',
};

const providerLabels: Record<string, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  ollama: 'Ollama',
  custom: '自定义',
  longcat: 'LongCat',
  minimax: 'MiniMax',
};

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onDragStart, onEdit }) => {
  const { selectedAgentId, selectAgent } = useAppStore();
  const isSelected = selectedAgentId === agent.id;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => { selectAgent(agent.id); }}
      className={`card-warm p-4 cursor-pointer group transition-all h-[180px] overflow-hidden flex flex-col ${
        isSelected ? 'ring-2 ring-accent-orange border-accent-orange' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
          {agent.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <AvatarSVG size={56} />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-txt-primary truncate">{agent.name}</h3>
            <span
              className={`w-2.5 h-2.5 rounded-full ${statusColors[agent.status]} shrink-0`}
              title={statusLabels[agent.status]}
            />
          </div>
          <p className="text-sm text-txt-muted truncate mt-0.5">{agent.description}</p>
          
          <div className="flex items-center gap-2 mt-2">
            <span className="tag-warm text-xs">
              {providerLabels[agent.provider] || agent.provider}
            </span>
            <span className="text-xs text-txt-muted truncate">{agent.model}</span>
          </div>
        </div>
      </div>
      
      {agent.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-warm-200 max-h-[52px] overflow-hidden">
          {agent.capabilities.slice(0, 5).map((cap) => (
            <span
              key={cap}
              className="text-xs bg-warm-100 text-txt-secondary px-2.5 py-1 rounded-lg"
            >
              {cap}
            </span>
          ))}
          {agent.capabilities.length > 5 && (
            <span className="text-xs text-txt-muted px-2.5 py-1">
              +{agent.capabilities.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
