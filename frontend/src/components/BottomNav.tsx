import React from 'react';
import { useAppStore } from '../store';

const tabs = [
  { id: 'chat' as const, label: '对话', icon: '💬' },
  { id: 'agents' as const, label: 'Agent', icon: '🤖' },
  { id: 'monitor' as const, label: '监控', icon: '📊' },
  { id: 'settings' as const, label: '设置', icon: '⚙️' },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-warm-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
              activeTab === tab.id
                ? 'text-accent-orange'
                : 'text-txt-muted'
            }`}
          >
            <span className="text-xl mb-1">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
