import React, { useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Award,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Clock
} from 'lucide-react';
import { Subject, Topic, ActiveRecallRating } from '../types';
import { db } from '../services/storage';

interface SpacedReviewViewProps {
  subjects: Subject[];
  onRefreshData: () => void;
  onOpenAiSummary?: (subjectName: string, topicTitle: string) => void;
}

export const SpacedReviewView: React.FC<SpacedReviewViewProps> = ({
  subjects,
  onRefreshData,
  onOpenAiSummary,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Flatten topics with subject context
  const allTopics = subjects.flatMap((sub) =>
    sub.topics.map((t) => ({
      ...t,
      subjectName: sub.name,
      subjectColor: sub.color,
      subjectId: sub.id,
    }))
  );

  // Overdue and Due Today Topics
  const dueTopics = allTopics.filter((t) => {
    if (!t.nextReviewDate) return false;
    return t.nextReviewDate <= todayStr;
  });

  // Upcoming in next 7 days
  const upcomingTopics = allTopics
    .filter((t) => t.nextReviewDate && t.nextReviewDate > todayStr)
    .sort((a, b) => (a.nextReviewDate || '').localeCompare(b.nextReviewDate || ''));

  // Active review session state
  const [activeReviewIndex, setActiveReviewIndex] = useState<number>(0);
  const [showSubtopics, setShowSubtopics] = useState<boolean>(false);
  const [justEvaluated, setJustEvaluated] = useState<string | null>(null);

  const currentTopic = dueTopics[activeReviewIndex];

  const handleRating = (rating: ActiveRecallRating) => {
    if (!currentTopic) return;

    db.recordTopicReview(currentTopic.id, rating);
    setJustEvaluated(
      `Avaliado com sucesso! Novo domínio: atualizado. Próxima revisão agendada.`
    );
    setShowSubtopics(false);
    onRefreshData();

    setTimeout(() => {
      setJustEvaluated(null);
      if (activeReviewIndex < dueTopics.length - 1) {
        setActiveReviewIndex((prev) => prev + 1);
      }
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Curva de Esquecimento de Ebbinghaus</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Revisão Espaçada (Active Recall)
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Recuperação ativa determinística: avalie sua memória de 1 a 5 para recalcular automaticamente os intervalos.
        </p>
      </div>

      {/* Active Review Station */}
      {currentTopic ? (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                style={{ backgroundColor: currentTopic.subjectColor }}
              >
                {currentTopic.subjectName}
              </span>
              <span className="text-xs text-slate-400">
                Item {activeReviewIndex + 1} de {dueTopics.length} para hoje
              </span>
            </div>

            <span className="text-xs font-bold text-rose-500">
              {currentTopic.nextReviewDate && currentTopic.nextReviewDate < todayStr
                ? '⚠️ Atrasado'
                : 'Previsto para Hoje'}
            </span>
          </div>

          {/* Topic Card Question */}
          <div className="text-center py-4 space-y-3">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
              Desafio de Recuperação Ativa:
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 max-w-2xl mx-auto">
              {currentTopic.title}
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Antes de olhar as anotações, force seu cérebro a lembrar dos conceitos, fórmulas e aplicações principais deste assunto.
            </p>

            {/* Subtopics toggle */}
            <div className="pt-2">
              <button
                onClick={() => setShowSubtopics(!showSubtopics)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {showSubtopics ? 'Ocultar subtópicos' : 'Revelar subtópicos e detalhes'}
              </button>

              {showSubtopics && currentTopic.subtopics && (
                <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 max-w-lg mx-auto text-left text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="font-bold block text-slate-900 dark:text-slate-100 mb-1">
                    Subtópicos Cadastrados:
                  </span>
                  {currentTopic.subtopics.map((st, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span>{st}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 5 Rating Buttons */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-slate-500 text-center block">
              Como foi sua lembrança ativa deste conteúdo?
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {[
                { rating: 1 as ActiveRecallRating, label: 'Esqueci completamente', color: 'hover:border-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600', sub: 'Reset (1d)' },
                { rating: 2 as ActiveRecallRating, label: 'Muita dificuldade', color: 'hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-600', sub: 'Curto (1d)' },
                { rating: 3 as ActiveRecallRating, label: 'Lembrei parcialmente', color: 'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-blue-600', sub: 'Médio (3d)' },
                { rating: 4 as ActiveRecallRating, label: 'Lembrei bem', color: 'hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600', sub: 'Bom (6d)' },
                { rating: 5 as ActiveRecallRating, label: 'Sei perfeitamente', color: 'hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-600', sub: 'Perfeito (12d+)' },
              ].map((btn) => (
                <button
                  key={btn.rating}
                  onClick={() => handleRating(btn.rating)}
                  className={`p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all text-center flex flex-col items-center justify-center gap-1 ${btn.color} active:scale-95 shadow-xs`}
                >
                  <span className="text-base font-black">{btn.rating}</span>
                  <span className="text-xs font-bold leading-tight">{btn.label}</span>
                  <span className="text-[10px] text-slate-400">{btn.sub}</span>
                </button>
              ))}
            </div>

            {justEvaluated && (
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold text-center animate-fadeIn">
                ✓ {justEvaluated}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Nenhuma revisão pendente para hoje!
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Sua retenção de memória está em dia. Você pode consultar as próximas revisões agendadas abaixo ou estudar conteúdos novos.
          </p>
        </div>
      )}

      {/* Upcoming Reviews Schedule Table */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Próximas Revisões Agendadas ({upcomingTopics.length})
            </h3>
            <p className="text-xs text-slate-400">
              Intervalos calculados automaticamente pelo algoritmo de repetição espaçada
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {upcomingTopics.slice(0, 6).map((topic) => (
            <div
              key={topic.id}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: topic.subjectColor }}
                />
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {topic.title}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {topic.subjectName} • Domínio: {topic.masteryLevel}% • Repetições: {topic.repetitionCount}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block">
                  {topic.nextReviewDate}
                </span>
                <span className="text-[10px] text-slate-400">
                  intervalo: {topic.reviewIntervalDays}d
                </span>
              </div>
            </div>
          ))}

          {upcomingTopics.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400">
              Nenhuma revisão futura agendada.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
