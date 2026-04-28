import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Message } from '../types';
import { useAppStore } from '../store';
import { ChatActions } from './ChatActions';

interface MessageBubbleProps {
  message: Message;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, selectionMode, selected, onToggleSelect }) => {
  const { agents } = useAppStore();
  const isUser = message.sender === 'user';
  const agent = message.agentId ? agents.find((a) => a.id === message.agentId) : null;

  return (
    <div className={`flex mb-3 ${isUser ? 'justify-end' : 'justify-start'} ${selectionMode ? 'cursor-pointer' : ''}`} onClick={() => selectionMode && onToggleSelect(message.id)}>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {selectionMode && (
          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-2 mb-1 shrink-0 ${selected ? 'bg-accent-orange border-accent-orange' : 'border-gray-300'}`}>
            {selected && (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        {!isUser && agent && (
          <div className="flex items-center gap-2 mb-1.5 ml-1">
            <div
              className="w-7 h-7 rounded-xl overflow-hidden flex items-center justify-center text-white text-xs font-semibold"
              style={{ background: agent.avatar ? 'transparent' : 'linear-gradient(135deg, #e85d04, #dc4a00)' }}
            >
              {agent.avatar ? (
                <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" />
              ) : (
                agent.name[0]
              )}
            </div>
            <span className="text-sm font-medium text-txt-secondary">{agent.name}</span>
          </div>
        )}
        <div
          className={`px-4 py-3 rounded-2xl ${isUser ? 'message-bubble-user rounded-br-md' : 'message-bubble-agent rounded-bl-md'} ${selected && selectionMode ? 'ring-2 ring-accent-orange' : ''}`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: isUser ? 'white' : '#1c1917' }}>{message.content}</p>
          <div className={`text-xs mt-1.5 ${isUser ? 'text-white/60' : 'text-txt-muted'}`}>
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageList: React.FC = () => {
  const { chatMode, groupChats, currentGroupId, sessions, currentSingleSessionId, clearMessages } = useAppStore();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());

  const currentId = chatMode === 'group' ? currentGroupId : currentSingleSessionId;

  let messages: Message[] = [];
  if (chatMode === 'group') {
    const currentGroup = groupChats.find(g => g.id === currentGroupId);
    messages = currentGroup ? sessions.find(s => s.id === currentGroupId)?.messages || [] : [];
  } else {
    const currentSingleSession = sessions.find(s => s.id === currentSingleSessionId);
    messages = currentSingleSession?.messages || [];
  }

  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // 进入选择模式
  const handleEnterSelectionMode = useCallback(() => {
    setSelectionMode(true);
    setSelectedMessages(new Set());
  }, []);

  // 退出选择模式
  const handleExitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedMessages(new Set());
  }, []);

  // 切换选择
  const handleToggleSelect = useCallback((id: string) => {
    setSelectedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // 删除选中的消息
  const handleDeleteSelected = useCallback(() => {
    const targetId = currentId;
    if (!targetId || selectedMessages.size === 0) return;
    
    if (confirm(`确定要删除选中的 ${selectedMessages.size} 条消息吗？此操作不可恢复。`)) {
      useAppStore.setState(state => ({
        sessions: state.sessions.map((s: any) =>
          s.id === targetId
            ? { ...s, messages: s.messages.filter((m: Message) => !selectedMessages.has(m.id)), updatedAt: Date.now() }
            : s
        ),
      }));
      handleExitSelectionMode();
    }
  }, [currentId, selectedMessages, handleExitSelectionMode]);

  // 全选
  const handleSelectAll = useCallback(() => {
    setSelectedMessages(new Set(messages.map(m => m.id)));
  }, [messages]);

  // 取消全选
  const handleDeselectAll = useCallback(() => {
    setSelectedMessages(new Set());
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* 选择模式顶部栏 */}
      {selectionMode ? (
        <div className="px-4 py-2 bg-white border-b border-warm-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={handleExitSelectionMode}
              className="px-3 py-1.5 text-sm text-txt-secondary hover:bg-warm-100 rounded-lg"
            >
              取消
            </button>
            <span className="text-sm text-txt-muted">
              已选择 {selectedMessages.size} 条
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={selectedMessages.size === messages.length ? handleDeselectAll : handleSelectAll}
              className="px-3 py-1.5 text-sm text-accent-orange hover:bg-orange-50 rounded-lg"
            >
              {selectedMessages.size === messages.length ? '取消全选' : '全选'}
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={selectedMessages.size === 0}
              className={`px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 ${selectedMessages.size === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              删除选中
            </button>
          </div>
        </div>
      ) : currentId ? (
        <div className="px-4 py-2 bg-white border-b border-warm-200 flex justify-start shrink-0">
          <ChatActions
            sessionId={currentSingleSessionId || undefined}
            groupId={currentGroupId || undefined}
            onSelectiveClear={handleEnterSelectionMode}
          />
        </div>
      ) : null}
      
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 bg-warm-100">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white shadow-card flex items-center justify-center">
                <svg className="w-10 h-10 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-txt-secondary font-medium mb-1">开始与 Agent 对话</p>
              <p className="text-sm text-txt-muted">选择一个 Agent 开始协作</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              selectionMode={selectionMode}
              selected={selectedMessages.has(msg.id)}
              onToggleSelect={handleToggleSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};
