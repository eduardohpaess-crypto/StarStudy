import React, { useState } from 'react';
import {
  Compass,
  AlertTriangle,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Subject, Task, Topic, Exam, UserProfile } from '../types';
import { db } from '../services/storage';

interface AcademicFeedViewProps {
  subjects: Subject[];
  tasks: Task[];
  profile: UserProfile;
  todayMinutes: number;
  onRefreshData: () => void;
  onStartStudy: (subjectId: string, topicId?: string) => void;
}

export type FeedFilter = 'all' | 'urgent' | 'exams' | 'reviews' | 'tasks';

export const AcademicFeedView: React.FC<AcademicFeedViewProps> = ({
  subjects,
  tasks,
  profile,
  todayMinutes,
  onRefreshData,
  onStartStudy,
}) => {
  const [filter, setFilter] = useState<FeedFilter>('all');
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const todayStr = new Date().toISOString().split('T')[0];

  interface FeedItem {
    id: string;
    type: 'review_overdue' | 'exam_soon' | 'task_overdue' | 'task_soon' | 'daily_goal';
    title: string;
    subtitle: string;
    priority: 'urgent' | 'high' | 'medium' | 'info';
    subjectName?: string;
    subjectColor?: string;
    subjectId?: string;
    topicId?: string;
    dateStr?: string;
    actionLabel?: string;
    onAction?: () => void;
  }

  const items: FeedItem[] = [];

  // 1. Overdue & Due Today Spaced Reviews
  subjects.forEach((sub) => {
    sub.topics.forEach((t) => {
      if (t.nextReviewDate && t.nextReviewDate <= todayStr) {
        const isOverdue = t.nextReviewDate < todayStr;
        items.push({
          id: `rev-${t.id}`,
          type: 'review_overdue',
          title: `Revisão de ${t.title}`,
          subtitle: isOverdue
            ? `Revisão atrasada desde ${t.nextReviewDate}. O domínio caiu para ${t.masteryLevel}%.`
            : `Revisão espaçada programada para hoje. Faça uma sessão de recuperação ativa.`,
          priority: isOverdue ? 'urgent' : 'high',
          subjectName: sub.name,
          subjectColor: sub.color,
          subjectId: sub.id,
          topicId: t.id,
          dateStr: t.nextReviewDate,
          actionLabel: 'Revisar agora',
          onAction: () => onStartStudy(sub.id, t.id),
        });
      }
    });
  });

  // 2. Upcoming Exams (within next 14 days)
  subjects.forEach((sub) => {
    sub.exams.forEach((exam) => {
      const examDate = new Date(exam.date + 'T00:00:00');
      const today = new Date(todayStr + 'T00:00:00');
      const diffDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays >= 0 && diffDays <= 14) {
        items.push({
          id: `exam-${exam.id}`,
          type: 'exam_soon',
          title: `Prova: ${exam.title}`,
          subtitle:
            diffDays === 0
              ? 'A prova é HOJE! Revise pontos críticos e fórmulas.'
              : diffDays === 1
              ? 'A prova é AMANHÃ! Concentre-se nas revisões finais.'
              : `Faltam ${diffDays} dias para a avaliação (Peso: ${exam.weight}).`,
          priority: diffDays <= 3 ? 'urgent' : diffDays <= 7 ? 'high' : 'medium',
          subjectName: sub.name,
          subjectColor: sub.color,
          subjectId: sub.id,
          dateStr: exam.date,
          actionLabel: 'Ver preparação',
          onAction: () => onStartStudy(sub.id),
        });
      }
    });
  });

  // 3. Overdue & Upcoming Tasks
  tasks.forEach((task) => {
    if (task.status === 'done') return;

    const isOverdue = task.dueDate < todayStr;
    const isDueSoon = task.dueDate === todayStr;

    if (isOverdue || isDueSoon) {
      const sub = subjects.find((s) => s.id === task.subjectId);
      items.push({
        id: `task-${task.id}`,
        type: isOverdue ? 'task_overdue' : 'task_soon',
        title: task.title,
        subtitle: isOverdue
          ? `Prazo expirou em ${task.dueDate} e a tarefa ainda não foi concluída.`
          : `Prazo vence HOJE (${task.category.toUpperCase()}).`,
        priority: isOverdue ? 'urgent' : 'high',
        subjectName: sub?.name || 'Geral',
        subjectColor: sub?.color || '#2563eb',
        subjectId: task.subjectId,
        dateStr: task.dueDate,
        actionLabel: 'Concluir tarefa',
        onAction: () => {
          task.status = 'done';
          task.completedAt = new Date().toISOString();
          db.saveTask(task);
          db.addXP(30);
          onRefreshData();
        },
      });
    }
  });

  // 4. Daily Goal Status
  const goalDiff = profile.dailyGoalMinutes - todayMinutes;
  if (goalDiff > 0) {
    items.push({
      id: 'daily-goal-feed',
      type: 'daily_goal',
      title: 'Meta Diária de Estudos em Andamento',
      subtitle: `Faltam ${goalDiff} minutos de estudo para atingir sua meta de ${profile.dailyGoalMinutes}m hoje.`,
      priority: 'info',
      actionLabel: 'Iniciar Pomodoro',
      onAction: () => onStartStudy(subjects[0]?.id || ''),
    });
  }

  // Filter items
  const filteredItems = items
    .filter((item) => !dismissedIds.has(item.id))
    .filter((item) => {
      if (filter === 'urgent') return item.priority === 'urgent';
      if (filter === 'exams') return item.type === 'exam_soon';
      if (filter === 'reviews') return item.type === 'review_overdue';
      if (filter === 'tasks') return item.type === 'task_overdue' || item.type === 'task_soon';
      return true;
    });

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Compass className="w-3.5 h-3.5" />
            <span>Rotina & Alertas Acadêmicos</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Feed Acadêmico
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Revisões vencidas, provas agendadas e prazos calculados automaticamente a partir dos seus dados locais.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all' as FeedFilter, label: 'Tudo' },
            { id: 'urgent' as FeedFilter, label: 'Urgentes' },
            { id: 'reviews' as FeedFilter, label: 'Revisões' },
            { id: 'exams' as FeedFilter, label: 'Provas' },
            { id: 'tasks' as FeedFilter, label: 'Tarefas' },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setFilter(btn.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === btn.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feed List */}
      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isUrgent = item.priority === 'urgent';
          const isHigh = item.priority === 'high';

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isUrgent
                  ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                  : isHigh
                  ? 'border-amber-200 dark:border-amber-900/40'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    item.type === 'review_overdue'
                      ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400'
                      : item.type === 'exam_soon'
                      ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400'
                      : item.type === 'task_overdue'
                      ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400'
                      : 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {item.type === 'review_overdue' && <RotateCcw className="w-5 h-5" />}
                  {item.type === 'exam_soon' && <Calendar className="w-5 h-5" />}
                  {item.type === 'task_overdue' && <AlertTriangle className="w-5 h-5" />}
                  {item.type === 'task_soon' && <Clock className="w-5 h-5" />}
                  {item.type === 'daily_goal' && <Sparkles className="w-5 h-5" />}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.subjectName && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                        style={{ backgroundColor: item.subjectColor || '#2563eb' }}
                      >
                        {item.subjectName}
                      </span>
                    )}
                    {isUrgent && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-rose-500 text-white rounded-md uppercase">
                        Urgente
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 sm:self-center shrink-0">
                {item.actionLabel && item.onAction && (
                  <button
                    onClick={item.onAction}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => handleDismiss(item.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Marcar como lido"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tudo em ordem no momento!
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Nenhuma revisão vencida, tarefa atrasada ou prova imediata nesta categoria. Mantenha o ritmo!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
