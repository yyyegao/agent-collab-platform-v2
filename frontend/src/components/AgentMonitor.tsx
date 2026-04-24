import React from 'react';
import { useAppStore } from '../store';
import { AgentTask, TaskStatus } from '../types';

const statusConfig: Record<TaskStatus, { label: string; color: string; bgColor: string }> = {
  idle: { label: '空闲', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  working: { label: '工作中', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  completed: { label: '已完成', color: 'text-green-600', bgColor: 'bg-green-100' },
  error: { label: '出错', color: 'text-red-600', bgColor: 'bg-red-100' },
};

const AgentTaskCard: React.FC<{ task: AgentTask }> = ({ task }) => {
  const status = statusConfig[task.status];
  const elapsed = Math.floor((Date.now() - task.startedAt) / 1000);
  const elapsedMin = Math.floor(elapsed / 60);
  const elapsedSec = elapsed % 60;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
      {/* Agent 名称和状态 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white text-sm font-bold">
            {task.agentName[0]}
          </div>
          <span className="font-medium text-gray-900">{task.agentName}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
          {status.label}
        </span>
      </div>

      {/* 任务描述 */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 line-clamp-2">{task.task}</p>
      </div>

      {/* 进度条 */}
      {task.status === 'working' && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>进度</span>
            <span>{task.progress}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent-orange rounded-full transition-all duration-300"
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Token 统计 */}
      {task.totalTokens !== undefined && (
        <div className="mb-3 p-2 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Token 消耗</span>
            <span className="font-medium text-gray-700">
              {task.totalTokens.toLocaleString()} tokens
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-gray-400">输入: {task.inputTokens?.toLocaleString()}</span>
            <span className="text-gray-400">输出: {task.outputTokens?.toLocaleString()}</span>
          </div>
          {/* 上下文长度 */}
          {task.contextTokens && (
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-gray-400">上下文: {task.contextTokens.toLocaleString()}</span>
              <span className="text-gray-400">
                已用 {((task.totalTokens / task.contextTokens) * 100).toFixed(1)}%
              </span>
            </div>
          )}
          {/* Token 消耗进度条 */}
          {task.inputTokens && (
            <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full"
                style={{ width: `${Math.min(100, (task.totalTokens / (task.inputTokens * 3)) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* 时间 */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>已运行 {elapsedMin > 0 ? `${elapsedMin}分` : ''}{elapsedSec}秒</span>
        {task.status === 'completed' && task.result && (
          <span className="text-accent-orange">✓ 已完成</span>
        )}
      </div>

      {/* 错误信息 */}
      {task.status === 'error' && task.error && (
        <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
          {task.error}
        </div>
      )}
    </div>
  );
};

export const AgentMonitor: React.FC = () => {
  const { agents, tasks, chatMode, currentGroupId, groupChats, sessions, currentSingleSessionId } = useAppStore();
  
  // 获取当前群聊
  const currentGroup = chatMode === 'group' ? groupChats.find(g => g.id === currentGroupId) : undefined;

  // 获取活跃任务（进行中 + 最近完成的）
  const activeTasks = tasks.filter(t => t.status !== 'idle').slice(0, 5);

  return (
    <div className="p-4 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Agent 监控</h1>
        <p className="text-gray-500">实时监控 Agent 工作状态和任务进度</p>
      </div>

      {/* 当前聊天上下文 */}
      {(chatMode === 'group' && currentGroup) || (chatMode === 'single' && currentSingleSessionId) ? (
        <div className="bg-gradient-to-r from-accent-orange/5 to-accent-violet/5 rounded-xl border border-accent-orange/20 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">💬</span>
            <span className="font-medium text-gray-900">
              {chatMode === 'group' ? `群聊: ${currentGroup?.name}` : '单聊模式'}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {chatMode === 'group' 
              ? `正在监控 ${currentGroup?.agents.length} 个 Agent 的工作状态`
              : '正在监控当前对话 Agent 的工作状态'
            }
          </p>
        </div>
      ) : null}

      {/* 群聊任务监控 */}
      {chatMode === 'group' && currentGroup && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">当前群聊 Agent 状态</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {agents.filter(a => currentGroup.agents.includes(a.id)).map(agent => {
              const agentTask = tasks.find(t => t.agentId === agent.id && t.status === 'working');
              const status = agentTask ? 'working' : 'idle';
              const statusInfo = status === 'working'
                ? { label: '工作中', color: 'text-blue-600', dot: 'bg-blue-500', progress: agentTask?.progress || 0 }
                : { label: '空闲', color: 'text-green-600', dot: 'bg-green-500', progress: 0 };
              
              return (
                <div key={agent.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white text-sm font-bold">
                    {agent.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{agent.name}</p>
                    {agentTask ? (
                      <div className="mt-1">
                        <p className="text-xs text-gray-500 line-clamp-1">{agentTask.task}</p>
                        <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${agentTask.progress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</p>
                    )}
                  </div>
                  <div className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 单聊任务监控 */}
      {chatMode === 'single' && currentSingleSessionId && (() => {
        const session = sessions.find(s => s.id === currentSingleSessionId);
        const agentId = session?.participants?.[0];
        const agent = agents.find(a => a.id === agentId);
        const agentTask = agentId ? tasks.find(t => t.agentId === agentId && t.status === 'working') : null;
        
        if (!agent) return null;
        
        const status = agentTask ? 'working' : agent.status === 'offline' ? 'offline' : 'idle';
        const statusInfo = status === 'working'
          ? { label: '工作中', color: 'text-blue-600', dot: 'bg-blue-500', border: 'border-blue-200' }
          : status === 'offline'
          ? { label: '离线', color: 'text-gray-500', dot: 'bg-gray-400', border: 'border-gray-200'}
          : { label: '空闲', color: 'text-green-600', dot: 'bg-green-500', border: 'border-green-200'};
        
        return (
          <div className={`bg-white rounded-xl border p-4 ${statusInfo.border}`}>
            <h2 className="font-semibold text-gray-900 mb-3">当前对话 Agent 状态</h2>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-orange to-orange-600 flex items-center justify-center text-white font-bold">
                {agent.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{agent.name}</p>
                {agentTask ? (
                  <div className="mt-1">
                    <p className="text-sm text-gray-500 line-clamp-1">{agentTask.task}</p>
                    <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${agentTask.progress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className={`text-sm ${statusInfo.color}`}>{statusInfo.label}</p>
                )}
              </div>
              <div className={`w-3 h-3 rounded-full ${statusInfo.dot}`} />
            </div>
          </div>
        );
      })()}

      {/* 活跃任务列表 */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">活跃任务 ({activeTasks.length})</h2>
        {activeTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500">暂无进行中的任务</p>
            <p className="text-sm text-gray-400">发送消息后自动创建任务</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeTasks.map(task => (
              <AgentTaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Agent 状态概览 */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">全部 Agent 状态</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {agents.map(agent => {
            const agentTask = tasks.find(t => t.agentId === agent.id && t.status === 'working');
            const status = agentTask ? 'working' : agent.status === 'offline' ? 'offline' : 'idle';
            const statusInfo = status === 'working' 
              ? { label: '工作中', color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' }
              : status === 'offline'
              ? { label: '离线', color: 'text-gray-500', bgColor: 'bg-gray-50', borderColor: 'border-gray-200'}
              : { label: '空闲', color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200'};
            
            return (
              <div 
                key={agent.id} 
                className={`bg-white rounded-xl border p-4 ${statusInfo.borderColor}`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                    agent.status === 'online' ? 'bg-gradient-to-br from-accent-orange to-orange-600' :
                    agent.status === 'busy' ? 'bg-gradient-to-br from-blue-400 to-blue-500' :
                    'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {agent.name[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{agent.name}</p>
                    <p className={`text-xs ${statusInfo.color}`}>{statusInfo.label}</p>
                  </div>
                </div>
                {agentTask && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 line-clamp-1">{agentTask.task}</p>
                    <div className="mt-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent-orange rounded-full"
                        style={{ width: `${agentTask.progress}%` }}
                      />
                    </div>
                    {agentTask.totalTokens !== undefined && (
                      <p className="text-xs text-gray-400 mt-1">
                        Token: {agentTask.totalTokens.toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-2">{agent.capabilities.join('、')}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};