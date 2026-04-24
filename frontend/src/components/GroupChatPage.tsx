import React, { useRef, useEffect, useState } from 'react';
import { ChatSession, Message, GroupChat, Agent } from '../types';
import { useAppStore } from '../store';
import { ChatActions } from './ChatActions';

interface GroupChatPageProps {
  group: GroupChat;
}

// 检查是否是经理（项目经理或产品经理）
function isManager(agent: Agent): boolean {
  const name = agent.name;
  return name.includes('经理') || name.includes('产品');
}

// 解析消息中的 @ 提及
function parseMentions(content: string, agents: Agent[]): string[] {
  const mentions: string[] = [];
  const regex = /@([^@\s]+)/g;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    const mentionName = match[1];
    const agent = agents.find(a => 
      a.name.includes(mentionName) || 
      a.name.replace(/[^a-zA-Z]/g, '').toLowerCase().includes(mentionName.toLowerCase())
    );
    if (agent && !mentions.includes(agent.id)) {
      mentions.push(agent.id);
    }
  }
  
  return mentions;
}

export const GroupChatPage: React.FC<GroupChatPageProps> = ({ group }) => {
  const { agents, sessions, addMessage, createGroupSession } = useAppStore();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 获取群聊中的 Agent
  const groupAgents = agents.filter(a => group.agents.includes(a.id));
  
  // 获取或创建群聊会话
  const groupSession = sessions.find(s => s.id === group.id) || (() => {
    const newSession: ChatSession = {
      id: group.id,
      title: group.name,
      type: 'group',
      messages: [],
      participants: group.agents,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    createGroupSession(newSession);
    return newSession;
  })();
  
  const messages = groupSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // 解析消息中的 @ 提及
    const mentions = parseMentions(inputValue, groupAgents);
    
    // 判断用户是否是经理（这里简化为：发送的消息中包含@所有人，或者用户选择"通知所有人"）
    // 实际应该从用户角色判断，这里先检查是否 @ 了所有人
    const userIsManager = inputValue.includes('@所有人') || inputValue.includes('@all');
    
    // 确定应该回复的 Agent
    let targetAgents: Agent[] = [];
    if (userIsManager) {
      // 经理 @ 所有 Agent
      targetAgents = groupAgents;
    } else if (mentions.length > 0) {
      // @ 指定的 Agent
      targetAgents = groupAgents.filter(a => mentions.includes(a.id));
    }
    
    // 添加用户消息
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      sender: 'user',
      timestamp: Date.now(),
      mentions: mentions,
      isManager: userIsManager,
    };
    addMessage(userMessage, group.id);
    setInputValue('');

    // 只让目标 Agent 依次回复
    if (targetAgents.length > 0) {
      let delay = 500;
      targetAgents.forEach((agent, index) => {
        setTimeout(() => {
          const responses = [
            `我是 ${agent.name}，收到你的消息了。`,
            `${agent.name} 在这里，让我分析一下这个问题...`,
            `关于这个问题，${agent.name} 有一些想法...`,
          ];
          const agentMessage: Message = {
            id: `msg-${Date.now()}-${agent.id}`,
            content: responses[index % responses.length],
            sender: 'agent',
            agentId: agent.id,
            agentName: agent.name,
            timestamp: Date.now(),
          };
          addMessage(agentMessage, group.id);
        }, delay);
        delay += 2000;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* 群聊头部 */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="avatar-stack w-10 h-10">
                {groupAgents.slice(0, 3).map((agent, idx) => (
                  <div
                    key={agent.id}
                    className="absolute w-6 h-6 rounded-lg bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      left: idx * 3,
                      zIndex: 3 - idx,
                    }}
                  >
                    {agent.name[0]}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">{group.name}</h1>
            <p className="text-sm text-gray-500">
              {groupAgents.map(a => a.name).join('、')}
            </p>
          </div>
          {/* 导出和清空按钮 */}
          <ChatActions groupId={group.id} />
        </div>
      </header>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 pb-20 md:pb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white shadow-card flex items-center justify-center">
                <svg className="w-8 h-8 text-accent-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500 mb-1">开始群聊</p>
              <p className="text-sm text-gray-400">发送消息，邀请群聊中的 Agent 协作</p>
              <p className="text-sm text-gray-400 mt-2">Tip: 使用 @名称 来 @特定 Agent，或用 @所有人 通知全部</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const agent = msg.agentId ? agents.find(a => a.id === msg.agentId) : null;
              
              return (
                <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
                    {!isUser && agent && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white text-xs font-bold">
                          {agent.name[0]}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{agent.name}</span>
                      </div>
                    )}
                    
                    <div
                      className={`px-4 py-2.5 rounded-2xl ${
                        isUser
                          ? 'message-bubble-user rounded-br-md'
                          : 'message-bubble-agent rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <div
                        className={`text-xs mt-1 ${
                          isUser ? 'text-white/70' : 'text-gray-400'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div className="bg-white border-t border-gray-200 p-3 shrink-0">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <textarea
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`发送消息给 ${group.name}... (用 @名称 @特定Agent, @所有人 通知全部)`}
              className="input-warm resize-none min-h-[44px] max-h-[120px]"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="w-11 h-11 rounded-xl bg-accent-orange text-white flex items-center justify-center hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-warm shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
