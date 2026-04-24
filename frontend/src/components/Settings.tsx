import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';

export const Settings: React.FC = () => {
  const { sessions, currentGroupId, currentSingleSessionId, clearMessages, chatMode } = useAppStore();
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  
  const [apiConfig, setApiConfig] = useState({
    provider: 'longcat',
    model: 'LongCat-Flash-Thinking-2601',
    apiKey: 'ak_2Dx9983ow3HU9Kl3Ht3Dl1Gq2mL4D',
    appId: '',
    baseUrl: 'https://api.longcat.chat/openai',
    systemPrompt: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem('apiConfig');
    if (saved) {
      setApiConfig(JSON.parse(saved));
    }
    const savedKey = localStorage.getItem('apiKey');
    if (savedKey) {
      setApiConfig(prev => ({ ...prev, apiKey: savedKey }));
    }
  }, []);

  const saveConfig = () => {
    localStorage.setItem('apiConfig', JSON.stringify(apiConfig));
    if (apiConfig.apiKey) {
      localStorage.setItem('apiKey', apiConfig.apiKey);
    }
    localStorage.setItem('appId', apiConfig.appId || '');
    alert('✅ API 配置已保存');
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-4 pb-20 md:pb-4 max-w-2xl mx-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e85d04 #f9f7f4' }}>
      <h2 className="text-xl font-bold text-txt-primary mb-6">设置</h2>
      
      {/* API 配置 */}
      <div className="card-warm p-5 mb-4">
        <h3 className="font-semibold text-txt-primary mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent-orange text-white flex items-center justify-center text-sm">🔑</span>
          API 配置
        </h3>
        
        <div className="mb-4">
          <label className="label-warm">模型提供商</label>
          <select
            value={apiConfig.provider}
            onChange={e => setApiConfig({ ...apiConfig, provider: e.target.value })}
            className="input-warm"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="ollama">Ollama (本地)</option>
            <option value="longcat">Longcat</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        
        <div className="mb-4">
          <label className="label-warm">模型</label>
          <input
            type="text"
            value={apiConfig.model}
            onChange={e => setApiConfig({ ...apiConfig, model: e.target.value })}
            placeholder="gpt-4o / claude-sonnet-4 / llama3"
            className="input-warm"
          />
        </div>
        
        <div className="mb-4">
          <label className="label-warm">API Key</label>
          <input
            type="password"
            value={apiConfig.apiKey}
            onChange={e => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
            placeholder="输入你的 API Key"
            className="input-warm"
          />
        </div>
        
        <div className="mb-4">
          <label className="label-warm">App ID（可选，留空即可）</label>
          <input
            type="text"
            value={apiConfig.appId}
            onChange={e => setApiConfig({ ...apiConfig, appId: e.target.value })}
            placeholder="留空"
            className="input-warm"
          />
        </div>
        
        <div className="mb-4">
          <label className="label-warm">API 地址</label>
          <input
            type="text"
            value={apiConfig.baseUrl}
            onChange={e => setApiConfig({ ...apiConfig, baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="input-warm"
          />
        </div>
        
        <div className="mb-5">
          <label className="label-warm">系统提示词</label>
          <textarea
            value={apiConfig.systemPrompt}
            onChange={e => setApiConfig({ ...apiConfig, systemPrompt: e.target.value })}
            placeholder="默认的系统提示词..."
            className="input-warm min-h-[80px] resize-none"
          />
        </div>
        
        <button
          onClick={saveConfig}
          className="btn-accent w-full"
        >
          保存配置
        </button>
      </div>

      {/* 主题设置 */}
      <div className="card-warm p-5 mb-4">
        <h3 className="font-semibold text-txt-primary mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent-violet text-white flex items-center justify-center text-sm">🎨</span>
          主题
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              theme === 'light'
                ? 'bg-accent-orange text-white shadow-md'
                : 'bg-warm-100 text-txt-secondary hover:bg-warm-200'
            }`}
          >
            ☀️ 浅色
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              theme === 'dark'
                ? 'bg-accent-orange text-white shadow-md'
                : 'bg-warm-100 text-txt-secondary hover:bg-warm-200'
            }`}
          >
            🌙 深色
          </button>
          <button
            onClick={() => setTheme('auto')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              theme === 'auto'
                ? 'bg-accent-orange text-white shadow-md'
                : 'bg-warm-100 text-txt-secondary hover:bg-warm-200'
            }`}
          >
            ⚡ 跟随系统
          </button>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="card-warm p-5 mb-4">
        <h3 className="font-semibold text-txt-primary mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent-teal text-white flex items-center justify-center text-sm">🔔</span>
          通知
        </h3>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-txt-secondary">接收消息通知</span>
          <div
            className={`toggle-warm ${notifications ? 'toggle-warm-checked' : 'toggle-warm-unchecked'}`}
            onClick={() => setNotifications(!notifications)}
          />
        </label>
      </div>

      {/* 聊天记录管理 */}
      <div className="card-warm p-5 mb-4">
        <h3 className="font-semibold text-txt-primary mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-warm-500 text-white flex items-center justify-center text-sm">💬</span>
          聊天记录管理
        </h3>
        
        <div className="mb-3">
          <button
            onClick={() => {
              const currentId = chatMode === 'group' ? currentGroupId : currentSingleSessionId;
              const session = sessions.find(s => s.id === currentId);
              if (!session || session.messages.length === 0) {
                alert('当前没有聊天记录可导出');
                return;
              }
              
              let mdContent = `# 聊天记录\n\n`;
              mdContent += `导出时间: ${new Date().toLocaleString()}\n\n`;
              
              session.messages.forEach(msg => {
                const senderName = msg.sender === 'user' ? '用户' : (msg.agentName || 'Agent');
                const time = new Date(msg.timestamp).toLocaleString();
                mdContent += `## ${senderName} (${time})\n\n`;
                mdContent += `${msg.content}\n\n`;
              });
              
              const blob = new Blob([mdContent], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `chat-record-${Date.now()}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn-warm w-full mb-3"
          >
            📥 导出聊天记录
          </button>
        </div>
        
        <div className="mb-3">
          <input
            type="file"
            accept=".md,.txt,.json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                try {
                  const content = event.target?.result as string;
                  const messages = content.split(/^## /gm).filter(s => s.trim());
                  alert(`解析到 ${messages.length} 条消息`);
                } catch (err) {
                  alert('文件解析失败');
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
            className="hidden"
            id="import-file"
          />
          <label
            htmlFor="import-file"
            className="btn-warm w-full block text-center cursor-pointer"
          >
            📤 导入聊天记录
          </label>
        </div>
        
        <button
          onClick={() => {
            const currentId = chatMode === 'group' ? currentGroupId : currentSingleSessionId;
            if (!currentId) {
              alert('请先选择一个会话');
              return;
            }
            if (confirm('确定要清空当前聊天记录吗？此操作不可恢复。')) {
              clearMessages(undefined, chatMode === 'group' ? currentId : undefined);
              alert('聊天记录已清空');
            }
          }}
          className="btn-warm w-full text-red-500 hover:bg-red-50 hover:border-red-200"
        >
          🗑️ 清空聊天记录
        </button>
      </div>

      {/* 关于 */}
      <div className="card-warm p-5">
        <h3 className="font-semibold text-txt-primary mb-4 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-warm-600 text-white flex items-center justify-center text-sm">ℹ️</span>
          关于
        </h3>
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-txt-muted">版本</span>
            <span className="text-txt-primary font-medium">v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-muted">构建日期</span>
            <span className="text-txt-primary">2026-03-31</span>
          </div>
          <div className="flex justify-between">
            <span className="text-txt-muted">后端状态</span>
            <span className="text-green-600 font-medium">● 已连接</span>
          </div>
        </div>
        
        <div className="divider-warm my-4" />
        
        <p className="text-sm text-txt-muted">
          Agent 协作平台 - 支持多 Agent 群聊协作，每个 Agent 可独立配置模型和参数。
        </p>
      </div>
    </div>
  );
};
