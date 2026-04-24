import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '../store';
import { ChatActions } from './ChatActions';
import { ImportChat } from './ImportChat';

export const MessageInput: React.FC = () => {
  const { 
    agents, 
    chatMode, 
    currentGroupId, 
    currentSingleSessionId, 
    sessions,
    addMessage,
    groupChats,
  } = useAppStore();
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const listRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // 获取当前群聊的所有 agents
  const groupAgents = chatMode === 'group' && currentGroupId 
    ? agents.filter(a => groupChats.find(g => g.id === currentGroupId)?.agents.includes(a.id))
    : [];

  // 获取当前会话对应的 agent
  const currentSession = sessions.find(s => s.id === (chatMode === 'group' ? currentGroupId : currentSingleSessionId));
  const targetAgentId = currentSession?.participants?.[0] || agents[0]?.id;

  // 过滤群成员
  const filteredGroupAgents = groupAgents.filter(a => 
    a.name.toLowerCase().includes(mentionFilter.toLowerCase())
  );

  const scrollToBottom = () => {
    setTimeout(() => {
      const container = listRef.current?.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);
    scrollToBottom();

    try {
      if (chatMode === 'group' && currentGroupId) {
        // 群聊模式
        await useAppStore.getState().sendGroupMessage(userMessage, 'user');
      } else if (targetAgentId) {
        // 单聊模式
        await useAppStore.getState().sendMessage(userMessage, targetAgentId);
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(`发送失败: ${error.message}`);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 监听 @ 符号显示群成员列表
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // 检查是否输入了 @
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.slice(lastAtIndex + 1);
      // 如果 @ 后面没有空格或特殊字符，显示成员列表
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionFilter(textAfterAt);
        setShowMentionList(true);
      } else {
        setShowMentionList(false);
      }
    } else {
      setShowMentionList(false);
    }
  };

  // 选择群成员
  const handleSelectMention = (agentName: string) => {
    const lastAtIndex = inputValue.lastIndexOf('@');
    const newValue = inputValue.slice(0, lastAtIndex) + '@' + agentName + ' ';
    setInputValue(newValue);
    setShowMentionList(false);
    textareaRef.current?.focus();
  };

  // 导入组件 ref
  const importChatRef = useRef<any>(null);

  // 如果是群聊模式且没有选择群聊，显示提示
  if (chatMode === 'group' && !currentGroupId) {
    return (
      <div className="bg-white border-t border-warm-200 p-4">
        <p className="text-center text-txt-muted text-sm">请先选择一个群聊</p>
      </div>
    );
  }

  // 单聊模式没有选择会话
  if (chatMode === 'single' && !currentSingleSessionId) {
    return (
      <div className="bg-white border-t border-warm-200 p-4">
        <p className="text-center text-txt-muted text-sm">请先选择一个 Agent 开始对话</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-warm-200 shrink-0 relative">
      {/* 操作工具栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-warm-100">
        <div className="flex items-center gap-1">
          <ImportChat 
            sessionId={chatMode === 'single' ? currentSingleSessionId || undefined : undefined}
            groupId={chatMode === 'group' ? currentGroupId || undefined : undefined}
          />
          <ChatActions 
            sessionId={chatMode === 'single' ? currentSingleSessionId || undefined : undefined} 
            groupId={chatMode === 'group' ? currentGroupId || undefined : undefined} 
          />
        </div>
        <span className="text-xs text-txt-muted">
          {isLoading ? '处理中...' : '@召唤群成员'}
        </span>
      </div>
      
      {/* @ 群成员列表 */}
      {showMentionList && filteredGroupAgents.length > 0 && (
        <div className="absolute bottom-full left-3 right-3 mb-1 bg-white border border-warm-200 rounded-xl shadow-card max-h-48 overflow-y-auto z-50">
          {filteredGroupAgents.map(agent => (
            <button
              key={agent.id}
              onClick={() => handleSelectMention(agent.name)}
              className="w-full px-3 py-2 text-left hover:bg-warm-50 flex items-center gap-2 border-b border-warm-100 last:border-b-0"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white text-xs font-semibold">
                {agent.name[0]}
              </div>
              <span className="text-sm text-txt-primary">{agent.name}</span>
            </button>
          ))}
        </div>
      )}
      
      {/* 输入区域 */}
      <div className="flex items-end gap-2 p-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={isLoading ? 'AI 正在思考...' : '输入消息... (@召唤群成员)'}
            disabled={isLoading}
            className="input-warm resize-none min-h-[44px] max-h-[120px] disabled:bg-warm-50"
            rows={1}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="w-11 h-11 rounded-xl bg-accent-orange text-white flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed btn-warm shrink-0 shadow-sm"
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};