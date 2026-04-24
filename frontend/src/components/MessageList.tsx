import React, { useRef, useEffect } from 'react';
import { Message } from '../types';
import { useAppStore } from '../store';
import { ChatActions } from './ChatActions';

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const { agents } = useAppStore();
  const isUser = message.sender === 'user';
  const agent = message.agentId ? agents.find((a) => a.id === message.agentId) : null;

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {!isUser && agent && (
          <div className="flex items-center gap-2 mb-1.5 ml-1">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold">
              {agent.name[0]}
            </div>
            <span className="text-sm font-medium text-gray-700">{agent.name}</span>
          </div>
        )}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isUser ? 'message-bubble-user rounded-br-md' : 'message-bubble-agent rounded-bl-md'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          <div className={`text-xs mt-1.5 ${isUser ? 'text-white/70' : 'text-gray-400'}`}>
            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MessageList: React.FC = () => {
  const { chatMode, groupChats, currentGroupId, sessions, currentSingleSessionId } = useAppStore();
  
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

  return (
    <div className="flex flex-col h-full">
      {/* 聊天记录操作栏 */}
      {currentId && (
        <div className="px-4 py-2 bg-white border-b border-gray-200 flex justify-end shrink-0">
          <ChatActions sessionId={currentSingleSessionId || undefined} groupId={currentGroupId || undefined} />
        </div>
      )}
      <div ref={listRef} className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white shadow-card flex items-center justify-center">
                <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium mb-1">开始与 Agent 对话</p>
              <p className="text-sm text-gray-400">选择一个 Agent 开始协作</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>
    </div>
  );
};