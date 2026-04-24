import React, { useState } from 'react';
import { useAppStore } from './store';
import { BottomNav, MessageList, MessageInput, AgentList, Settings } from './components';
import { GroupChatList } from './components/GroupChatList';
import { AgentChatList } from './components/AgentChatList';
import { CreateGroupModal } from './components/CreateGroupModal';
import { AgentMonitor } from './components/AgentMonitor';
import { ChatSession } from './types';

const App: React.FC = () => {
  const { 
    activeTab, 
    agents, 
    setAgents, 
    groupChats,
    currentGroupId,
    setCurrentGroupId,
    chatMode,
    setChatMode,
    addGroupChat,
    sessions,
    currentSingleSessionId,
    setCurrentSingleSessionId,
  } = useAppStore();

  const [showCreateGroup, setShowCreateGroup] = useState(false);

  const currentGroup = groupChats.find(g => g.id === currentGroupId);

  const handleNewChat = (agentId: string) => {
    // 检查是否已有该 agent 的会话
    const existingSession = sessions.find(s => 
      s.type === 'single' && s.participants.includes(agentId)
    );
    if (existingSession) {
      setCurrentSingleSessionId(existingSession.id);
    } else {
      // 创建新会话
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: `与 ${agents.find(a => a.id === agentId)?.name || 'Agent'} 的对话`,
        type: 'single',
        messages: [],
        participants: [agentId],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      // 保存到本地store
      useAppStore.getState().setSessions([...sessions, newSession]);
      useAppStore.getState().setCurrentSession(newSession);
      useAppStore.getState().setCurrentSingleSessionId(newSession.id);
      
      // 立即保存到后端
      useAppStore.getState().saveSession(newSession);
    }
  };

  const renderContent = () => {
    if (activeTab === 'agents') {
      return (
        <div className="flex flex-col h-full">
          <AgentList />
        </div>
      );
    }
    
    if (activeTab === 'settings') {
      return (
        <div className="flex flex-col h-full">
          <Settings />
        </div>
      );
    }
    
    if (activeTab === 'monitor') {
      return <AgentMonitor />;
    }
    
    if (activeTab !== 'chat') return null;
    
    // 群聊模式 - 使用群聊头部，但不替换整个页面
    const isGroupMode = chatMode === 'group' && currentGroup;
    
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
          {isGroupMode ? (
            /* 群聊头部 */
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="avatar-stack w-10 h-10">
                  {agents.filter(a => currentGroup.agents.includes(a.id)).slice(0, 3).map((agent, idx) => (
                    <div
                      key={agent.id}
                      className="absolute w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xs font-bold"
                      style={{ left: idx * 3, zIndex: 3 - idx }}
                    >
                      {agent.name[0]}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{currentGroup.name}</h1>
                <p className="text-sm text-gray-500">
                  {agents.filter(a => currentGroup.agents.includes(a.id)).map(a => a.name).join('、')}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-lg font-bold text-gray-900">Agent 协作平台</h1>
              <p className="text-sm text-gray-500">多 Agent 协作对话</p>
            </div>
          )}
          
          {/* 切换单聊/群聊 - 始终显示 */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setChatMode('single')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                chatMode === 'single'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              💬 单聊
            </button>
            <button
              onClick={() => setChatMode('group')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                chatMode === 'group'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              👥 群聊
            </button>
          </div>
        </header>
        
        <div className="flex-1 flex overflow-hidden">
          {chatMode === 'group' ? (
            <>
              {/* 群聊列表侧边栏 */}
              <div className="w-72 border-r border-gray-200 bg-white shrink-0 hidden md:block">
                <GroupChatList
                  groupChats={groupChats}
                  agents={agents}
                  currentGroupId={currentGroupId}
                  onSelectGroup={setCurrentGroupId}
                  onCreateGroup={() => setShowCreateGroup(true)}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <MessageList />
                <MessageInput />
              </div>
            </>
          ) : (
            /* 单聊模式 - 左侧显示 Agent/会话列表 */
            <>
              <div className="w-72 border-r border-gray-200 bg-white shrink-0 hidden md:block">
                <AgentChatList
                  agents={agents}
                  sessions={sessions}
                  currentSessionId={currentSingleSessionId}
                  onSelectSession={setCurrentSingleSessionId}
                  onNewChat={handleNewChat}
                />
              </div>
              <div className="flex-1 flex flex-col">
                <MessageList />
                <MessageInput />
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 md:w-64 bg-white border-r border-gray-200 flex-col z-10">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Agent 协作
          </h1>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { id: 'chat', label: '💬 对话', tab: 'chat' as const, icon: 'chat' },
            { id: 'agents', label: '🤖 Agent 列表', tab: 'agents' as const, icon: 'agent' },
            { id: 'monitor', label: '📊 监控', tab: 'monitor' as const, icon: 'monitor' },
            { id: 'settings', label: '⚙️ 设置', tab: 'settings' as const, icon: 'settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => useAppStore.getState().setActiveTab(item.tab)}
              className={`w-full nav-item-feishu ${
                activeTab === item.tab ? 'active' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        {/* 群聊快捷入口 */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => {
              useAppStore.getState().setActiveTab('chat');
              setChatMode('group');
            }}
            className="w-full nav-item-feishu"
          >
            👥 快速进入群聊
          </button>
        </div>
      </div>

      {/* 移动端顶部导航 */}
      <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Agent 协作平台</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => useAppStore.getState().setActiveTab('agents')}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <div className="md:ml-64 min-h-screen pb-16 md:pb-0">
        {renderContent()}
      </div>

      {/* 移动端底部导航 */}
      <BottomNav />
      
      {/* 创建群聊弹窗 */}
      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreate={addGroupChat}
        agents={agents}
      />
    </div>
  );
};

export default App;
