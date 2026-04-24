import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { ImportChat } from './ImportChat';

interface ChatActionsProps {
  sessionId?: string;
  groupId?: string;
  onImportClick?: () => void;
}

export const ChatActions: React.FC<ChatActionsProps> = ({ sessionId, groupId, onImportClick }) => {
  const { clearMessages, exportMessages, sessions } = useAppStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exportContent, setExportContent] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasMessages = (() => {
    // 总是启用导出和清空功能，不需要检查是否有消息
    return true;
  })();

  const handleClear = () => {
    if (confirm('确定要清空当前聊天记录吗？此操作不可恢复。')) {
      clearMessages(sessionId || undefined, groupId || undefined);
    }
    setShowMenu(false);
  };

  const handleExport = () => {
    const content = exportMessages(sessionId || undefined, groupId || undefined);
    setExportContent(content);
    setShowExport(true);
    setShowMenu(false);
  };

  const handleDownload = () => {
    const blob = new Blob([exportContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = groupId 
      ? `群聊_${new Date().toISOString().slice(0,10)}.md`
      : `对话_${new Date().toISOString().slice(0,10)}.md`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportContent);
      alert('已复制到剪贴板');
    } catch {
      alert('复制失败，请手动复制');
    }
    setShowExport(false);
  };

  if (!sessionId && !groupId) return null;

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          disabled={!hasMessages}
          className={`p-2 rounded-lg hover:bg-warm-100 transition-colors ${
            !hasMessages ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          title="更多操作"
        >
          <svg className="w-5 h-5 text-txt-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
          </svg>
        </button>
        
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
            <button
              onClick={() => {
                setShowMenu(false);
                // 触发导入组件显示
                const importBtn = document.getElementById('import-btn');
                if (importBtn) importBtn.click();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-warm-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              导入聊天记录
            </button>
            <button
              onClick={handleExport}
              disabled={!hasMessages}
              className={`w-full px-4 py-2 text-left text-sm hover:bg-warm-50 flex items-center gap-2 ${
                !hasMessages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              导出聊天记录
            </button>
            <button
              onClick={handleClear}
              disabled={!hasMessages}
              className={`w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 ${
                !hasMessages ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              清空聊天记录
            </button>
          </div>
        )}
      </div>

      {/* 导出预览弹窗 */}
      {showExport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold">导出聊天记录</h3>
              <button
                onClick={() => setShowExport(false)}
                className="p-1 hover:bg-warm-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-txt-secondary whitespace-pre-wrap font-mono bg-warm-50 p-3 rounded-lg max-h-96 overflow-auto">
                {exportContent}
              </pre>
            </div>
            <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleCopy}
                className="px-4 py-2 text-sm text-txt-secondary hover:bg-warm-100 rounded-lg"
              >
                复制到剪贴板
              </button>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm bg-accent-orange text-white rounded-lg hover:bg-orange-600"
              >
                下载 Markdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};