import React, { useState, useEffect } from 'react';
import type { AgentConfig } from '../store';

const AVATAR_COLORS = [
  '#e85d04', '#0077b6', '#00b4d8', '#2dc653', '#7b2cbf',
  '#e63946', '#457b9d', '#f4a261', '#264653', '#b5179e',
];

const AvatarSVG = ({ size = 48 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="48" height="48" rx="12" fill="#e85d04"/>
    <circle cx="24" cy="20" r="8" fill="white" fillOpacity="0.9"/>
    <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" fillOpacity="0.9"/>
  </svg>
);

interface Props {
  agent?: AgentConfig;
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: AgentConfig) => void;
  onDelete?: (id: string) => void;
}



const CAPABILITY_OPTIONS = [
  { key: '数据分析', icon: '📊' },
  { key: '可视化', icon: '📈' },
  { key: '翻译', icon: '🌐' },
  { key: '润色', icon: '✨' },
  { key: '总结', icon: '📝' },
  { key: '问答', icon: '💡' },
];

export default function AgentConfigModal({ agent, isOpen, onClose, onSave, onDelete }: Props) {
  const [formData, setFormData] = useState<AgentConfig>(
    agent || {
      id: '',
      name: '',
      avatar: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      description: '',
      capabilities: [],
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: '',
      baseUrl: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 4096,
    }
  );

  useEffect(() => {
    setFormData(agent || {
      id: '',
      name: '',
      avatar: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      description: '',
      capabilities: [],
      provider: 'openai',
      model: 'gpt-4o',
      apiKey: '',
      baseUrl: '',
      systemPrompt: '',
      temperature: 0.7,
      maxTokens: 4096,
    });
  }, [agent]);

  const handleSave = () => {
    if (!formData.name.trim()) { alert('请输入名称'); return; }
    onSave(formData);
    onClose();
  };

  if (!isOpen) return null;



  return (
    <div
      className="modal-overlay-warm"
      onClick={onClose}
    >
      <div
        className="modal-content-warm max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-warm-200">
          <h2 className="text-lg font-bold text-txt-primary">
            {agent ? '编辑 Agent' : '添加 Agent'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-warm-100 text-txt-muted transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5l10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Scrollable form area + fixed footer buttons */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          const avatarColor = AVATAR_COLORS.includes(formData.avatar) ? formData.avatar : AVATAR_COLORS[0];

  return (
    <form id="agent-form" className="flex-1 overflow-y-auto px-6 py-4 space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
            {/* Avatar */}
            <div>
              <label className="label-warm">头像</label>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: avatarColor }}
                >
                  <AvatarSVG size={56} />
                </div>
                <div className="flex gap-1.5 p-1.5 rounded-xl bg-warm-100 overflow-x-auto">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, avatar: color }))}
                      className="w-10 h-10 rounded-lg shrink-0 overflow-hidden transition-all"
                      style={{ backgroundColor: color, outline: formData.avatar === color ? '2px solid #e85d04' : 'none', outlineOffset: '1px' }}
                    >
                      <AvatarSVG size={40} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="label-warm">名称 <span className="text-red-400">*</span></label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Agent 名称"
                className="input-warm"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="label-warm">描述</label>
              <textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="描述这个 Agent 的职责和能力..."
                className="input-warm h-[80px] overflow-hidden resize-none"
              />
            </div>

            {/* Capabilities */}
            <div>
              <label className="label-warm">能力</label>
              <div className="flex flex-wrap gap-2 max-h-[100px] overflow-hidden">
                {CAPABILITY_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      const caps = formData.capabilities.includes(opt.key)
                        ? formData.capabilities.filter(c => c !== opt.key)
                        : [...formData.capabilities, opt.key];
                      setFormData(prev => ({ ...prev, capabilities: caps }));
                    }}
                    className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                      formData.capabilities.includes(opt.key)
                        ? 'bg-accent-orange text-white'
                        : 'bg-warm-100 text-txt-secondary hover:bg-warm-200'
                    }`}
                  >
                    {opt.icon} {opt.key}
                  </button>
                ))}
              </div>
            </div>

            <div className="divider-warm" />

            {/* Provider & Model */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-warm">Provider</label>
                <select
                  value={formData.provider}
                  onChange={e => setFormData(prev => ({ ...prev, provider: e.target.value }))}
                  className="input-warm"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="azure">Azure OpenAI</option>
                  <option value="ollama">Ollama</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>
              <div>
                <label className="label-warm">Model</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={e => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="gpt-4o"
                  className="input-warm"
                />
              </div>
            </div>

            {/* Temperature & MaxTokens */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-warm">Temperature: {formData.temperature}</label>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={formData.temperature}
                  onChange={e => setFormData(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                  className="w-full accent-accent-orange"
                />
                <div className="flex justify-between text-xs text-txt-muted mt-1">
                  <span>精准</span>
                  <span>创意</span>
                </div>
              </div>
              <div>
                <label className="label-warm">Max Tokens</label>
                <input
                  type="number"
                  value={formData.maxTokens}
                  onChange={e => setFormData(prev => ({ ...prev, maxTokens: parseInt(e.target.value) || 4096 }))}
                  className="input-warm"
                  min={1}
                  max={128000}
                />
              </div>
            </div>

            <div className="divider-warm" />

            {/* API Key */}
            <div>
              <label className="label-warm">API Key</label>
              <input
                type="password"
                value={formData.apiKey}
                onChange={e => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                placeholder="sk-..."
                className="input-warm"
              />
            </div>

            {/* Base URL */}
            <div>
              <label className="label-warm">Base URL</label>
              <input
                type="text"
                value={formData.baseUrl}
                onChange={e => setFormData(prev => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com/v1"
                className="input-warm"
              />
            </div>

            {/* System Prompt */}
            <div>
              <label className="label-warm">System Prompt</label>
              <textarea
                value={formData.systemPrompt}
                onChange={e => setFormData(prev => ({ ...prev, systemPrompt: e.target.value }))}
                placeholder="设定 Agent 的角色和行为..."
                className="input-warm h-[100px] overflow-hidden resize-none"
              />
            </div>
          </form>

          {/* Footer buttons */}
          <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-t border-warm-200 bg-white">
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
              type="submit"
              form="agent-form"
              className="px-6 py-2 rounded-xl bg-accent-orange text-white font-medium hover:bg-orange-600 transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
