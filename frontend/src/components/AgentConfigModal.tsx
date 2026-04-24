import React, { useState, useEffect } from 'react';
import { AgentConfig } from '../types';

interface AgentConfigModalProps {
  agent: AgentConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: AgentConfig) => void;
  onDelete?: (id: string) => void;
}

const defaultProviders = [
  { value: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o' },
  { value: 'anthropic', label: 'Anthropic', defaultModel: 'claude-sonnet-4-20250514' },
  { value: 'ollama', label: 'Ollama', defaultModel: 'llama3' },
  { value: 'custom', label: '自定义', defaultModel: '' },
  { value: 'longcat', label: 'LongCat', defaultModel: 'qwen2.5-72b-instruct' },
  { value: 'minimax', label: 'MiniMax', defaultModel: 'MiniMax-M2.7' },
];

const defaultCapabilities = [
  '代码编写', '代码调试', '代码优化', '单元测试',
  '文档撰写', '文档整理', '文案撰写',
  'UI 设计', 'UX 设计', '产品设计',
  '数据处理', '数据分析', '可视化',
  '翻译', '润色', '总结', '问答'
];

// 24个预设头像（使用 DiceBear 免费 API）
const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Agent001&backgroundColor=e85d04',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Agent002&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Agent003&backgroundColor=0d9488',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Agent004&backgroundColor=dc2626',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Agent005&backgroundColor=ea580c',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Agent006&backgroundColor=2563eb',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Agent007&backgroundColor=db2777',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Agent008&backgroundColor=16a34a',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot001&backgroundColor=e85d04',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot002&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot003&backgroundColor=0d9488',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot004&backgroundColor=dc2626',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot005&backgroundColor=2563eb',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot006&backgroundColor=ea580c',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot007&backgroundColor=db2777',
  'https://api.dicebear.com/7.x/bottts/svg?seed=Bot008&backgroundColor=16a34a',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumb001&backgroundColor=e85d04',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumb002&backgroundColor=7c3aed',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumb003&backgroundColor=0d9488',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumb004&backgroundColor=dc2626',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumb005&backgroundColor=2563eb',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumb006&backgroundColor=ea580c',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumb007&backgroundColor=db2777',
  'https://api.dicebear.com/7.x/thumbs/svg?seed=Thumb008&backgroundColor=16a34a',
];

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  agent,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<AgentConfig>({
    id: '',
    name: '',
    description: '',
    avatar: '',
    status: 'online',
    capabilities: [],
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
    baseUrl: '',
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 4096,
  });

  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (agent) {
      setFormData(agent);
    } else {
      setFormData({
        id: `agent-${Date.now()}`,
        name: '',
        description: '',
        avatar: '',
        status: 'online',
        capabilities: [],
        provider: 'openai',
        model: 'gpt-4o',
        apiKey: '',
        baseUrl: '',
        systemPrompt: '',
        temperature: 0.7,
        maxTokens: 4096,
      });
    }
  }, [agent, isOpen]);

  // ESC 关闭弹窗
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!formData.name.trim()) { alert('请输入名称'); return; }
    console.log('[Modal] saving, name:', formData.name, 'avatar:', formData.avatar);
    onSave(formData);
    onClose();
  };

  const toggleCapability = (cap: string) => {
    setFormData(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(cap)
        ? prev.capabilities.filter(c => c !== cap)
        : [...prev.capabilities, cap]
    }));
  };

  const handleProviderChange = (provider: string) => {
    const providerConfig = defaultProviders.find(p => p.value === provider);
    setFormData(prev => ({
      ...prev,
      provider: provider as any,
      model: providerConfig?.defaultModel || '',
    }));
  };

  return (
    <div className="modal-overlay-warm" onClick={onClose}>
      <div className="modal-content-warm max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* 头部 */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <h2 className="text-lg font-semibold text-txt-primary">
            {agent ? '编辑 Agent' : '添加 Agent'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-warm-100 flex items-center justify-center text-txt-muted"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 表单内容（可滚动） */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form id="agent-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            {/* 头像选择 */}
            <div>
              <label className="label-warm">选择头像</label>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover" />
                  ) : (
                    formData.name[0]?.toUpperCase() || '?'
                  )}
                </div>
                <input
                  type="text"
                  value={formData.avatar || ''}
                  onChange={e => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                  placeholder="或输入头像 URL..."
                  className="input-warm flex-1"
                />
              </div>
              <div className="flex gap-1.5 p-1.5 rounded-xl bg-warm-100 overflow-x-auto">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar: url }))}
                    className={`w-10 h-10 rounded-lg overflow-hidden transition-all shrink-0 ${
                      formData.avatar === url
                        ? 'ring-2 ring-accent-orange ring-offset-1 scale-110'
                        : 'hover:scale-105 opacity-75 hover:opacity-100'
                    }`}
                    title={`头像 ${idx + 1}`}
                  >
                    <img src={url} alt={`avatar-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* 名称 */}
            <div>
              <label className="label-warm">名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：代码助手"
                className="input-warm"
                required
              />
            </div>

            {/* 角色描述 */}
            <div>
              <label className="label-warm">角色描述 *</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述这个 Agent 的职责和能力..."
                className="input-warm min-h-[80px] max-h-[120px] overflow-y-auto resize-none"
                required
              />
            </div>

            {/* 能力标签 */}
            <div>
              <label className="label-warm">能力</label>
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto">
                {defaultCapabilities.map(cap => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCapability(cap)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      formData.capabilities.includes(cap)
                        ? 'bg-accent-orange text-white'
                        : 'bg-warm-100 text-txt-secondary hover:bg-warm-200'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* 模型配置 */}
            <div className="divider-warm my-4" />
            <h3 className="font-semibold text-txt-primary">模型配置</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* 提供商 */}
              <div>
                <label className="label-warm">提供商</label>
                <select
                  value={formData.provider}
                  onChange={e => handleProviderChange(e.target.value)}
                  className="input-warm"
                >
                  {defaultProviders.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* 模型 */}
              <div>
                <label className="label-warm">模型</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="模型名称"
                  className="input-warm"
                />
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="label-warm">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey || ''}
                  onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="input-warm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary"
                >
                  {showApiKey ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Base URL */}
            <div>
              <label className="label-warm">Base URL (可选)</label>
              <input
                type="text"
                value={formData.baseUrl || ''}
                onChange={e => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="input-warm"
              />
            </div>

            {/* 生成参数 */}
            <div className="divider-warm my-4" />
            <h3 className="font-semibold text-txt-primary">生成参数</h3>

            {/* System Prompt */}
            <div>
              <label className="label-warm">System Prompt</label>
              <textarea
                value={formData.systemPrompt || ''}
                onChange={e => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="给 Agent 的系统提示词..."
                className="input-warm min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Temperature */}
              <div>
                <label className="label-warm">Temperature: {formData.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={e => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-accent-orange"
                />
                <div className="flex justify-between text-xs text-txt-muted mt-1">
                  <span>精确</span>
                  <span>创意</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="label-warm">Max Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={e => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="input-warm"
                  min={1}
                  max={128000}
                />
              </div>
            </div>
          </form>

          {/* 底部按钮（固定在表单下方，随表单滚动） */}
          <div className="flex items-center gap-3 pt-2 mt-2 border-t border-warm-100">
            {agent && onDelete && (
              <button
                type="button"
                onClick={() => { onDelete(agent.id); onClose(); }}
                className="px-4 py-2 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
              >
                删除
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-warm-100 text-txt-secondary font-medium hover:bg-warm-200 transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-accent-orange text-white font-medium hover:bg-orange-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
