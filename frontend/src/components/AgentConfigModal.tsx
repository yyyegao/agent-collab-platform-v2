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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          {/* 头部 */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {agent ? '编辑 Agent' : '添加 Agent'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 头像和名称 */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-2xl font-bold">
                {formData.avatar ? (
                  <img src={formData.avatar} alt={formData.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  formData.name[0]?.toUpperCase() || 'A'
                )}
              </div>
              <div className="flex-1">
                <label className="label-feishu">头像 URL</label>
                <input
                  type="text"
                  value={formData.avatar || ''}
                  onChange={e => setFormData(prev => ({ ...prev, avatar: e.target.value }))}
                  placeholder="https://..."
                  className="input-feishu"
                />
              </div>
            </div>

            {/* 名称 */}
            <div>
              <label className="label-feishu">名称 *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：代码助手"
                className="input-feishu"
                required
              />
            </div>

            {/* 角色描述 */}
            <div>
              <label className="label-feishu">角色描述 *</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述这个 Agent 的职责和能力..."
                className="input-feishu min-h-[80px] resize-none"
                required
              />
            </div>

            {/* 能力标签 */}
            <div>
              <label className="label-feishu">能力</label>
              <div className="flex flex-wrap gap-2">
                {defaultCapabilities.map(cap => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCapability(cap)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      formData.capabilities.includes(cap)
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* 模型配置 */}
            <div className="divider-feishu my-4" />
            <h3 className="font-semibold text-gray-900">模型配置</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* 提供商 */}
              <div>
                <label className="label-feishu">提供商</label>
                <select
                  value={formData.provider}
                  onChange={e => handleProviderChange(e.target.value)}
                  className="input-feishu"
                >
                  {defaultProviders.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* 模型 */}
              <div>
                <label className="label-feishu">模型</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="模型名称"
                  className="input-feishu"
                />
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="label-feishu">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.apiKey || ''}
                  onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="sk-..."
                  className="input-feishu pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <label className="label-feishu">Base URL (可选)</label>
              <input
                type="text"
                value={formData.baseUrl || ''}
                onChange={e => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="input-feishu"
              />
            </div>

            {/* 生成参数 */}
            <div className="divider-feishu my-4" />
            <h3 className="font-semibold text-gray-900">生成参数</h3>

            {/* System Prompt */}
            <div>
              <label className="label-feishu">System Prompt</label>
              <textarea
                value={formData.systemPrompt || ''}
                onChange={e => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="给 Agent 的系统提示词..."
                className="input-feishu min-h-[100px] resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Temperature */}
              <div>
                <label className="label-feishu">Temperature: {formData.temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.temperature}
                  onChange={e => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>精确</span>
                  <span>创意</span>
                </div>
              </div>

              {/* Max Tokens */}
              <div>
                <label className="label-feishu">Max Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={e => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                  className="input-feishu"
                  min={1}
                  max={128000}
                />
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex gap-3 pt-4">
              {agent && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(agent.id);
                    onClose();
                  }}
                  className="px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 font-medium transition-colors"
                >
                  删除
                </button>
              )}
              <div className="flex-1" />
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors btn-feishu"
              >
                保存
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
