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
    const existingSession = sessions.find(s => 
      s.type === 'single' && s.participants.includes(agentId)
    );
    if (existingSession) {
      setCurrentSingleSessionId(existingSession.id);
    } else {
      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        title: `与 ${agents.find(a => a.id === agentId)?.name || 'Agent'} 的对话`,
        type: 'single',
        messages: [],
        participants: [agentId],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      useAppStore.getState().setSessions([...sessions, newSession]);
      useAppStore.getState().setCurrentSession(newSession);
      useAppStore.getState().setCurrentSingleSessionId(newSession.id);
      useAppStore.getState().saveSession(newSession);
    }
  };

  const renderContent = () => {
    if (activeTab === 'agents') {
      return <div className="min-h-screen"><AgentList /></div>;
    }
    if (activeTab === 'settings') {
      return <div className="flex-1 overflow-y-auto"><Settings /></div>;
    }
    if (activeTab === 'monitor') {
      return <div className="min-h-screen"><AgentMonitor /></div>;
    }
    if (activeTab !== 'chat') return null;
    
    const isGroupMode = chatMode === 'group' && currentGroup;
    
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <header className="bg-white border-b border-warm-200 px-4 py-3 flex items-center justify-between shrink-0">
          {isGroupMode ? (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {agents.filter(a => currentGroup.agents.includes(a.id)).slice(0, 3).map((agent, idx) => (
                  <div
                    key={agent.id}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold ring-2 ring-white"
                    style={{
                      background: idx === 0 ? 'linear-gradient(135deg, #e85d04, #dc4a00)' : idx === 1 ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #0d9488, #0f766e)',
                      zIndex: 10 - idx,
                    }}
                  >
                    {agent.name[0]}
                  </div>
                ))}
              </div>
              <div>
                <h1 className="text-base font-semibold text-txt-primary">{currentGroup.name}</h1>
                <p className="text-xs text-txt-muted">
                  {agents.filter(a => currentGroup.agents.includes(a.id)).map(a => a.name).join(' · ')}
                </p>
              </div>
            </div>
          ) : (
            <div>
              <h1 className="text-base font-semibold text-txt-primary">Agent 协作平台</h1>
              <p className="text-xs text-txt-muted">多 Agent 协作对话</p>
            </div>
          )}
          
          {/* 切换单聊/群聊 */}
          <div className="flex items-center gap-1 bg-warm-100 rounded-xl p-1">
            <button
              onClick={() => setChatMode('single')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                chatMode === 'single' ? 'bg-white text-accent-orange shadow-sm' : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              💬 单聊
            </button>
            <button
              onClick={() => setChatMode('group')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                chatMode === 'group' ? 'bg-white text-accent-orange shadow-sm' : 'text-txt-secondary hover:text-txt-primary'
              }`}
            >
              👥 群聊
            </button>
          </div>
        </header>
        
        <div className="flex-1 flex overflow-hidden min-h-0">
          {chatMode === 'group' ? (
            <>
              <div className="w-72 border-r border-warm-200 bg-white shrink-0 hidden md:block overflow-y-auto">
                <GroupChatList
                  groupChats={groupChats}
                  agents={agents}
                  currentGroupId={currentGroupId}
                  onSelectGroup={setCurrentGroupId}
                  onCreateGroup={() => setShowCreateGroup(true)}
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
                <MessageList />
                <MessageInput />
              </div>
            </>
          ) : (
            <>
              <div className="w-72 border-r border-warm-200 bg-white shrink-0 hidden md:block overflow-y-auto">
                <AgentChatList
                  agents={agents}
                  sessions={sessions}
                  currentSessionId={currentSingleSessionId}
                  onSelectSession={setCurrentSingleSessionId}
                  onNewChat={handleNewChat}
                />
              </div>
              <div className="flex-1 flex flex-col min-h-0">
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
    <div className="min-h-screen bg-warm-100">
      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex md:fixed md:left-0 md:top-0 md:bottom-0 md:w-64 sidebar-warm flex-col z-10">
        <div className="p-5 border-b border-warm-200">
          <h1 className="text-lg font-bold text-txt-primary flex items-center gap-2">
            <img src="https://web-api.textin.com/ocr_image/external/c4c76097d1ef10ab.jpg" alt="logo" className="h-8 w-auto object-contain" />
            Agent Collab
          </h1>
          <p className="text-xs text-txt-muted mt-0.5">多 Agent 协作平台</p>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {[
            { id: 'chat', label: '💬 对话', tab: 'chat' as const },
            { id: 'agents', label: '🤖 Agent 列表', tab: 'agents' as const },
            { id: 'monitor', label: '📊 监控', tab: 'monitor' as const },
            { id: 'settings', label: '⚙️ 设置', tab: 'settings' as const },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => useAppStore.getState().setActiveTab(item.tab)}
              className={`w-full nav-warm ${activeTab === item.tab ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        
        <div className="p-3 border-t border-warm-200">
          <button
            onClick={() => {
              useAppStore.getState().setActiveTab('chat');
              setChatMode('group');
            }}
            className="w-full nav-warm text-accent-orange"
          >
            👥 快速进入群聊
          </button>
        </div>
      </div>

      {/* 移动端顶部导航 */}
      <header className="md:hidden bg-white border-b border-warm-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-semibold text-txt-primary">Agent Collab</h1>
          <button
            onClick={() => useAppStore.getState().setActiveTab('agents')}
            className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center text-txt-secondary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </header>

      {/* 主内容区 - 唯一的滚动容器 */}
      <div className="md:ml-64 fixed inset-0 right-0 bottom-0 pb-16 md:pb-0 overflow-y-auto">
        {renderContent()}
      </div>

      <BottomNav />
      
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
