import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AgentConfig } from '../types';
import { AgentCard } from './AgentCard';
import { AgentConfigModal } from './AgentConfigModal';
import { useAppStore } from '../store';

const SortableAgentCard: React.FC<{ agent: AgentConfig; onEdit: (a: AgentConfig) => void }> = ({ agent, onEdit }) => {
  const { attributes, setNodeRef, transform, transition, isDragging } = useSortable({ id: agent.id });
  const style = { 
    transform: CSS.Transform.toString(transform), 
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <AgentCard agent={agent} onDragStart={() => {}} onEdit={onEdit} />
    </div>
  );
};

export const AgentList: React.FC = () => {
  const { agents, setAgents, addAgent, updateAgent, deleteAgent } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentConfig | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = agents.findIndex((a) => a.id === active.id);
      const newIndex = agents.findIndex((a) => a.id === over.id);
      setAgents(arrayMove(agents, oldIndex, newIndex));
    }
  };

  const handleAddAgent = () => { setEditingAgent(null); setShowModal(true); };
  const handleEditAgent = (agent: AgentConfig) => { setEditingAgent(agent); setShowModal(true); };

  const handleSaveAgent = async (agent: AgentConfig) => {
    try {
      if (editingAgent) { await updateAgent(agent); }
      else { await addAgent(agent); }
      setShowModal(false); setEditingAgent(null);
    } catch (error: any) { alert(`保存失败: ${error.message}`); }
  };

  const handleDeleteAgent = async (id: string) => {
    if (confirm('确定要删除这个 Agent 吗？')) {
      try { await deleteAgent(id); setShowModal(false); setEditingAgent(null); }
      catch (error: any) { alert(`删除失败: ${error.message}`); }
    }
  };

  return (
    <div className="p-4 pb-20 md:pb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Agent 列表</h2>
          <p className="text-sm text-gray-500">管理你的 Agent 团队</p>
        </div>
        <button onClick={handleAddAgent} className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-dark">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={agents.map(a => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <SortableAgentCard key={agent.id} agent={agent} onEdit={handleEditAgent} />
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditAgent(agent)}
                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 transition-colors"
                    title="编辑"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent.id)}
                    className="w-8 h-8 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="删除"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {agents.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
          </div>
          <p className="text-gray-500 mb-2">还没有 Agent</p>
          <p className="text-sm text-gray-400 mb-4">点击 + 添加你的第一个 Agent</p>
          <button onClick={handleAddAgent} className="px-4 py-2 rounded-xl bg-primary text-white font-medium">添加 Agent</button>
        </div>
      )}

      <AgentConfigModal agent={editingAgent} isOpen={showModal} onClose={() => { setShowModal(false); setEditingAgent(null); }} onSave={handleSaveAgent} onDelete={handleDeleteAgent} />
    </div>
  );
};