import React, { useState, useRef } from 'react';
import { useAppStore } from '../store';
import { Message } from '../types';

interface ImportChatProps {
  sessionId?: string;
  groupId?: string;
}

export const ImportChat: React.FC<ImportChatProps> = ({ sessionId, groupId }) => {
  const { importMessages, agents } = useAppStore();
  const [showImport, setShowImport] = useState(false);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [parseError, setParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 解析 Markdown 格式的聊天记录
  const parseMarkdownChat = (content: string): Message[] => {
    const messages: Message[] = [];
    const lines = content.split('\n');
    
    let currentMessage: Partial<Message> | null = null;
    let contentBuffer: string[] = [];
    
    for (const line of lines) {
      // 检查是否是消息头（## 发送者 (时间)）
      const headerMatch = line.match(/^##\s+(.+?)\s+\((\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\)$/);
      
      if (headerMatch) {
        // 保存上一条消息
        if (currentMessage && contentBuffer.length > 0 && currentMessage.sender) {
          messages.push({
            id: `import-${Date.now()}-${messages.length}`,
            content: contentBuffer.join('\n').trim(),
            sender: currentMessage.sender,
            agentId: currentMessage.agentId,
            agentName: currentMessage.agentName,
            timestamp: currentMessage.timestamp || Date.now(),
          });
        }
        
        // 解析新消息
        const sender = headerMatch[1];
        const timeStr = headerMatch[2];
        
        currentMessage = {
          sender: sender === '你' ? 'user' : 'agent',
          timestamp: new Date(timeStr).getTime() || Date.now(),
        };
        
        // 如果是 agent，尝试匹配 agent name
        if (currentMessage.sender === 'agent') {
          const agentName = sender;
          const matchedAgent = agents.find(a => a.name === agentName);
          if (matchedAgent) {
            currentMessage.agentId = matchedAgent.id;
          }
          currentMessage.agentName = agentName;
        }
        
        contentBuffer = [];
      } else if (line === '---' || line === '***') {
        // 消息分隔符，忽略
        continue;
      } else if (currentMessage) {
        contentBuffer.push(line);
      }
    }
    
    // 保存最后一条消息
    if (currentMessage && contentBuffer.length > 0 && currentMessage.sender) {
      messages.push({
        id: `import-${Date.now()}-${messages.length}`,
        content: contentBuffer.join('\n').trim(),
        sender: currentMessage.sender,
        agentId: currentMessage.agentId,
        agentName: currentMessage.agentName,
        timestamp: currentMessage.timestamp || Date.now(),
      });
    }
    
    return messages;
  };

  // 解析纯文本格式（每行一条消息）
  const parsePlainTextChat = (content: string): Message[] => {
    const messages: Message[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 简单的格式检测：如果是 "发送者: 消息" 格式
      const parts = line.split(/[：:]\s*/);
      if (parts.length >= 2) {
        const sender = parts[0];
        const msgContent = parts.slice(1).join(': ');
        
        const isUser = sender === '你' || sender === 'User' || sender === 'user';
        
        messages.push({
          id: `import-${Date.now()}-${i}`,
          content: msgContent,
          sender: isUser ? 'user' : 'agent',
          agentName: isUser ? undefined : sender,
          timestamp: Date.now() - (lines.length - i) * 1000, // 逆序时间
        });
      } else {
        // 没有明确发送者，作为用户消息处理
        messages.push({
          id: `import-${Date.now()}-${i}`,
          content: line,
          sender: 'user',
          timestamp: Date.now() - (lines.length - i) * 1000,
        });
      }
    }
    
    return messages;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await file.text();
      let messages: Message[] = [];

      // 尝试解析为 Markdown
      if (content.includes('## ')) {
        messages = parseMarkdownChat(content);
      } else {
        // 回退到纯文本解析
        messages = parsePlainTextChat(content);
      }

      if (messages.length === 0) {
        setParseError('无法解析文件内容，请检查格式');
        return;
      }

      setParseError('');

      // 如果是替换模式，先清空现有消息
      if (importMode === 'replace') {
        useAppStore.getState().clearMessages(sessionId, groupId);
      }

      // 导入消息
      importMessages(messages, sessionId, groupId);
      
      alert(`成功导入 ${messages.length} 条消息`);
      setShowImport(false);
    } catch (err) {
      setParseError('读取文件失败，请重试');
    }

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) return;

      let messages: Message[] = [];

      // 尝试解析为 Markdown
      if (text.includes('## ')) {
        messages = parseMarkdownChat(text);
      } else {
        messages = parsePlainTextChat(text);
      }

      if (messages.length === 0) {
        setParseError('无法解析剪贴板内容');
        return;
      }

      setParseError('');

      // 如果是替换模式，先清空
      if (importMode === 'replace') {
        useAppStore.getState().clearMessages(sessionId, groupId);
      }

      importMessages(messages, sessionId, groupId);
      
      alert(`成功导入 ${messages.length} 条消息`);
      setShowImport(false);
    } catch (err) {
      setParseError('读取剪贴板失败');
    }
  };

  if (!sessionId && !groupId) return null;

  return (
    <>
      <button
        id="import-btn"
        onClick={() => setShowImport(true)}
        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="导入聊天记录"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      </button>

      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold">导入聊天记录</h3>
              <button
                onClick={() => setShowImport(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* 导入模式选择 */}
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="text-primary"
                  />
                  <span className="text-sm">追加到现有消息</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-primary"
                  />
                  <span className="text-sm">替换现有消息</span>
                </label>
              </div>

              {/* 文件上传 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  从文件导入 (.md, .txt)
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".md,.txt,.markdown"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-white
                    hover:file:bg-primary-dark
                    cursor-pointer"
                />
              </div>

              {/* 从剪贴板导入 */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">或</span>
                </div>
              </div>

              <button
                onClick={handlePaste}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                从剪贴板导入
              </button>

              {/* 错误提示 */}
              {parseError && (
                <p className="text-sm text-red-600">{parseError}</p>
              )}

              {/* 格式说明 */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <p className="font-medium mb-1">支持的格式：</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Markdown 格式（导出格式）</li>
                  <li>纯文本格式（每行：发送者: 消息）</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};