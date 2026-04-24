import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';

export const Settings: React.FC = () => {
  const { sessions, currentGroupId, currentSingleSessionId, clearMessages, groupChats, chatMode } = useAppStore();
  const [theme, setTheme] = useState('light');
  const [notifications, setNotifications] = useState(true);
  
  // API 配置
  const [apiConfig, setApiConfig] = useState({
    provider: 'longcat',
    model: 'LongCat-Flash-Thinking-2601',
    apiKey: 'ak_2Dx9983ow3HU9Kl3Ht3Dl1Gq2mL4D',
    appId: '',  // AppId可以为空
    baseUrl: 'https://api.longcat.chat/openai',
    systemPrompt: '',
  });

  // 从 localStorage 加载配置
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

  // 保存配置
  const saveConfig = () => {
    localStorage.setItem('apiConfig', JSON.stringify(apiConfig));
    if (apiConfig.apiKey) {
      localStorage.setItem('apiKey', apiConfig.apiKey);
    }
    // 保存AppId（可以为空）
    localStorage.setItem('appId', apiConfig.appId || '');
    alert('API 配置已保存');
  };

  return (
    <div className="p-4 pb-20 md:pb-4">
      <h2 className="text-xl font-bold text-gray-900 mb-4">设置</h2>
      
      {/* API 配置 */}
      <div className="card-feishu p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          API 配置
        </h3>
        
        {/* Provider 选择 */}
        <div className="mb-3">
          <label className="label-feishu">模型提供商</label>
          <select
            value={apiConfig.provider}
            onChange={e => setApiConfig({ ...apiConfig, provider: e.target.value })}
            className="input-feishu"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="ollama">Ollama (本地)</option>
            <option value="custom">自定义</option>
          </select>
        </div>
        
        {/* Model */}
        <div className="mb-3">
          <label className="label-feishu">模型</label>
          <input
            type="text"
            value={apiConfig.model}
            onChange={e => setApiConfig({ ...apiConfig, model: e.target.value })}
            placeholder={apiConfig.provider === 'openai' ? 'gpt-4o' : apiConfig.provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'llama3'}
            className="input-feishu"
          />
        </div>
        
        {/* API Key */}
        <div className="mb-3">
          <label className="label-feishu">API Key</label>
          <input
            type="password"
            value={apiConfig.apiKey}
            onChange={e => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
            placeholder="输入你的 API Key"
            className="input-feishu"
          />
        </div>
        
        {/* App ID (可选) */}
        <div className="mb-3">
          <label className="label-feishu">App ID (可选，留空即可)</label>
          <input
            type="text"
            value={apiConfig.appId}
            onChange={e => setApiConfig({ ...apiConfig, appId: e.target.value })}
            placeholder="留空"
            className="input-feishu"
          />
        </div>
        
        {/* Base URL */}
        <div className="mb-3">
          <label className="label-feishu">API 地址</label>
          <input
            type="text"
            value={apiConfig.baseUrl}
            onChange={e => setApiConfig({ ...apiConfig, baseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            className="input-feishu"
          />
        </div>
        
        {/* System Prompt */}
        <div className="mb-3">
          <label className="label-feishu">系统提示词</label>
          <textarea
            value={apiConfig.systemPrompt}
            onChange={e => setApiConfig({ ...apiConfig, systemPrompt: e.target.value })}
            placeholder="默认的系统提示词..."
            className="input-feishu min-h-[80px]"
          />
        </div>
        
        <button
          onClick={saveConfig}
          className="btn-feishu bg-primary text-white w-full"
        >
          保存配置
        </button>
      </div>

      {/* 主题设置 */}
      <div className="card-feishu p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          主题
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              theme === 'light'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ☀️ 浅色
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              theme === 'dark'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🌙 深色
          </button>
          <button
            onClick={() => setTheme('auto')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              theme === 'auto'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ⚡ 跟随系统
          </button>
        </div>
      </div>

      {/* 通知设置 */}
      <div className="card-feishu p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          通知
        </h3>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-gray-600">接收消息通知</span>
          <div
            className={`toggle-feishu ${notifications ? 'toggle-feishu-checked' : 'toggle-feishu-unchecked'}`}
            onClick={() => setNotifications(!notifications)}
          />
        </label>
      </div>

      {/* 聊天记录管理 */}
      <div className="card-feishu p-4 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          聊天记录管理
        </h3>
        
        {/* 导出聊天记录 */}
        <div className="mb-3">
          <button
            onClick={() => {
              // 获取当前会话的消息
              const currentId = chatMode === 'group' ? currentGroupId : currentSingleSessionId;
              const session = sessions.find(s => s.id === currentId);
              if (!session || session.messages.length === 0) {
                alert('当前没有聊天记录可导出');
                return;
              }
              
              // 导出为 Markdown
              let mdContent = `# 聊天记录\n\n`;
              mdContent += `导出时间: ${new Date().toLocaleString()}\n\n`;
              
              session.messages.forEach(msg => {
                const senderName = msg.sender === 'user' ? '用户' : (msg.agentName || 'Agent');
                const time = new Date(msg.timestamp).toLocaleString();
                mdContent += `## ${senderName} (${time})\n\n`;
                mdContent += `${msg.content}\n\n`;
              });
              
              // 下载文件
              const blob = new Blob([mdContent], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `chat-record-${Date.now()}.md`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn-feishu w-full mb-2"
            style={{ backgroundColor: '#10b981' }}
          >
            📥 导出聊天记录
          </button>
        </div>
        
        {/* 导入聊天记录 */}
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
                  // 简单解析：按 ## 分割，每段是一个消息
                  const messages = content.split(/^## /gm).filter(s => s.trim());
                  alert(`解析到 ${messages.length} 条消息。导入功能需要进一步配置。`);
                } catch (err) {
                  alert('文件解析失败: ' + String(err));
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
            className="btn-feishu w-full block text-center"
            style={{ backgroundColor: '#3b82f6', cursor: 'pointer' }}
          >
            📤 导入聊天记录
          </label>
        </div>
        
        {/* 清空聊天记录 */}
        <div>
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
            className="btn-feishu w-full"
            style={{ backgroundColor: '#ef4444' }}
          >
            🗑️ 清空聊天记录
          </button>
        </div>
      </div>

      {/* 关于 */}
      <div className="card-feishu p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          关于
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">版本</span>
            <span className="text-gray-900 font-medium">v1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">构建日期</span>
            <span className="text-gray-900">2026-03-31</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">后端状态</span>
            <span className="text-success font-medium">● 已连接</span>
          </div>
        </div>
        
        <div className="divider-feishu my-4" />
        
        <p className="text-sm text-gray-500">
          Agent 协作平台 - 支持多 Agent 群聊协作，每个 Agent 可独立配置模型和参数。
        </p>
      </div>
    </div>
  );
};