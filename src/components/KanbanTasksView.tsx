import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Filter,
  Calendar,
  Clock,
  AlertTriangle,
  Trash2,
  Edit2,
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2
} from 'lucide-react';
import { Task, Subject, Priority, TaskStatus } from '../types';
import { db } from '../services/storage';

interface KanbanTasksViewProps {
  tasks: Task[];
  subjects: Subject[];
  onRefreshData: () => void;
}

export const KanbanTasksView: React.FC<KanbanTasksViewProps> = ({
  tasks,
  subjects,
  onRefreshData,
}) => {
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // Task form state
  const [form, setForm] = useState<{
    title: string;
    description: string;
    subjectId: string;
    category: 'trabalho' | 'leitura' | 'exercicio' | 'revisao' | 'projeto' | 'outro';
    priority: Priority;
    dueDate: string;
    estimatedMinutes: number;
    status: TaskStatus;
  }>({
    title: '',
    description: '',
    subjectId: subjects[0]?.id || '',
    category: 'exercicio',
    priority: 'medium',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    estimatedMinutes: 60,
    status: 'todo',
  });

  const handleOpenNewTask = () => {
    setEditingTask(null);
    setForm({
      title: '',
      description: '',
      subjectId: subjects[0]?.id || '',
      category: 'exercicio',
      priority: 'medium',
      dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      estimatedMinutes: 60,
      status: 'todo',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditTask = (task: Task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      subjectId: task.subjectId,
      category: task.category,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedMinutes: task.estimatedMinutes,
      status: task.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    if (editingTask) {
      const updated: Task = {
        ...editingTask,
        title: form.title.trim(),
        description: form.description.trim(),
        subjectId: form.subjectId,
        category: form.category,
        priority: form.priority,
        dueDate: form.dueDate,
        estimatedMinutes: Number(form.estimatedMinutes) || 30,
        status: form.status,
      };
      db.saveTask(updated);
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: form.title.trim(),
        description: form.description.trim(),
        subjectId: form.subjectId,
        category: form.category,
        priority: form.priority,
        dueDate: form.dueDate,
        estimatedMinutes: Number(form.estimatedMinutes) || 30,
        status: form.status,
        createdAt: new Date().toISOString(),
      };
      db.saveTask(newTask);
      db.addXP(20);
    }

    setIsModalOpen(false);
    onRefreshData();
  };

  const handleMoveStatus = (task: Task, newStatus: TaskStatus) => {
    task.status = newStatus;
    if (newStatus === 'done') {
      task.completedAt = new Date().toISOString();
      db.addXP(40);
    } else {
      task.completedAt = undefined;
    }
    db.saveTask(task);
    onRefreshData();
  };

  const handleDeleteTask = (id: string) => {
    db.deleteTask(id);
    onRefreshData();
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (filterSubject !== 'all' && t.subjectId !== filterSubject) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const columns: { id: TaskStatus; label: string; count: number }[] = [
    {
      id: 'todo',
      label: 'A Fazer',
      count: filteredTasks.filter((t) => t.status === 'todo').length,
    },
    {
      id: 'in_progress',
      label: 'Fazendo',
      count: filteredTasks.filter((t) => t.status === 'in_progress').length,
    },
    {
      id: 'done',
      label: 'Concluído',
      count: filteredTasks.filter((t) => t.status === 'done').length,
    },
  ];

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Gestão Ágil de Estudos</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Tarefas & Kanban
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize listas de exercícios, trabalhos práticos e leituras por matéria e prioridade.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filters */}
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200"
          >
            <option value="all">Todas as matérias</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenNewTask}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* 3 Columns Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {columns.map((col) => {
          const columnTasks = filteredTasks.filter((t) => t.status === col.id);

          return (
            <div
              key={col.id}
              className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800 space-y-3 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      col.id === 'todo'
                        ? 'bg-amber-500'
                        : col.id === 'in_progress'
                        ? 'bg-blue-600'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {col.label}
                  </h3>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  {col.count}
                </span>
              </div>

              {/* Tasks List */}
              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const subject = subjects.find((s) => s.id === task.subjectId);
                  const isOverdue = task.status !== 'done' && task.dueDate < todayStr;
                  const isDueToday = task.status !== 'done' && task.dueDate === todayStr;

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
                    >
                      {/* Top: Subject badge & Priority */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white line-clamp-1 max-w-[150px]"
                          style={{ backgroundColor: subject?.color || '#2563eb' }}
                        >
                          {subject?.name || 'Geral'}
                        </span>

                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase ${
                            task.priority === 'urgent'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                              : task.priority === 'high'
                              ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h4
                          className={`text-xs font-bold text-slate-900 dark:text-slate-100 ${
                            task.status === 'done' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Due date & Estimated duration */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span
                            className={
                              isOverdue
                                ? 'text-rose-600 font-bold'
                                : isDueToday
                                ? 'text-amber-600 font-bold'
                                : ''
                            }
                          >
                            {task.dueDate} {isOverdue && '(Atrasada)'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{task.estimatedMinutes}m</span>
                        </div>
                      </div>

                      {/* Actions: Move left, Move right, Edit, Delete */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          {col.id !== 'todo' && (
                            <button
                              onClick={() =>
                                handleMoveStatus(
                                  task,
                                  col.id === 'done' ? 'in_progress' : 'todo'
                                )
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Mover para trás"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                          )}
                          {col.id !== 'done' && (
                            <button
                              onClick={() =>
                                handleMoveStatus(
                                  task,
                                  col.id === 'todo' ? 'in_progress' : 'done'
                                )
                              }
                              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="Mover para frente"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditTask(task)}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                    Nenhuma tarefa nesta coluna.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Nova / Editar Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingTask ? 'Editar Tarefa' : 'Nova Tarefa'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Resolver lista 3 de Álgebra Linear"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disciplina
                </label>
                <select
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Geral / Sem Disciplina</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Prioridade
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e: any) => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Prazo de Entrega
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={form.category}
                    onChange={(e: any) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="exercicio">Exercício</option>
                    <option value="trabalho">Trabalho</option>
                    <option value="revisao">Revisão</option>
                    <option value="leitura">Leitura</option>
                    <option value="projeto">Projeto</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tempo Estimado (min)
                  </label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={form.estimatedMinutes}
                    onChange={(e) =>
                      setForm({ ...form, estimatedMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição (opcional)
                </label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detalhes ou critérios de avaliação..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
