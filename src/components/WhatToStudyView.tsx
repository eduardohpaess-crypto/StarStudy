import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Play,
  RotateCcw,
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Brain,
  CheckCircle,
  SlidersHorizontal,
  Bot
} from 'lucide-react';
import { Subject, PriorityRecommendation } from '../types';
import { GeminiService } from '../services/geminiClient';

interface WhatToStudyViewProps {
  recommendations: PriorityRecommendation[];
  subjects: Subject[];
  onStartStudy: (subjectId: string, topicId: string) => void;
  onOpenAiTool: (subjectName: string, topicTitle: string, toolType: string) => void;
}

export const WhatToStudyView: React.FC<WhatToStudyViewProps> = ({
  recommendations,
  subjects,
  onStartStudy,
  onOpenAiTool,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<PriorityRecommendation | null>(
    recommendations[0] || null
  );
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);

  const filteredRecs = recommendations.filter((r) => {
    if (filterSubject === 'all') return true;
    return r.subjectId === filterSubject;
  });

  const handleAskAiForStrategy = async (rec: PriorityRecommendation) => {
    try {
      setLoadingAi(true);
      setAiInsight(null);
      const res = await GeminiService.executeTool20({
        toolType: 'recomendacao_metodo',
        subjectName: rec.subjectName,
        topicTitle: rec.topicTitle,
        customInstructions: `O estudante possui ${rec.masteryLevel}% de domínio neste assunto e faltam ${
          rec.daysUntilExam ?? 'N/A'
        } dias para a prova. Sugira um plano de ataque objetivo em 3 passos para estudar nos próximos 45 minutos.`,
      });
      setAiInsight(res.result);
    } catch (err: any) {
      setAiInsight(
        `Estratégia Recomendada: Inicie com 10 minutos de revisão ativa dos conceitos base, resolva 3 exercícios práticos guiados e finalize criando 4 flashcards sobre suas dúvidas.`
      );
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Motor Determinístico de Priorização</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            O Que Estudar Agora?
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Responde com precisão: O que estudar primeiro, por que é prioritário e como estudar com eficiência.
          </p>
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as matérias</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Left List, Right Detailed Score Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Priority List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredRecs.map((rec, index) => {
            const isSelected = selectedTopic?.topicId === rec.topicId;

            return (
              <div
                key={rec.topicId}
                onClick={() => {
                  setSelectedTopic(rec);
                  setAiInsight(null);
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 shadow-md ring-1 ring-blue-500'
                    : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                        index === 0
                          ? 'bg-amber-500 text-white shadow-xs'
                          : index === 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white inline-block"
                        style={{ backgroundColor: rec.subjectColor }}
                      >
                        {rec.subjectName}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {rec.topicTitle}
                      </h3>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-blue-600 dark:text-blue-400">
                      {rec.priorityScore}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">pontos</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span>Domínio: {rec.masteryLevel}%</span>
                  <span>~{rec.estimatedMinutes} min</span>
                  <span className="capitalize">{rec.difficulty}</span>
                </div>
              </div>
            );
          })}

          {filteredRecs.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
              <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">Nenhum tópico encontrado para esta seleção.</p>
            </div>
          )}
        </div>

        {/* Right Column (7 cols): Deep Analysis & Action Station */}
        {selectedTopic ? (
          <div className="lg:col-span-7 space-y-5">
            {/* Card with Detailed Breakdown */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
              {/* Header of selected */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2.5 py-0.5 rounded-md text-white"
                      style={{ backgroundColor: selectedTopic.subjectColor }}
                    >
                      {selectedTopic.subjectName}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-md">
                      Dificuldade: {selectedTopic.difficulty.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-2">
                    {selectedTopic.topicTitle}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartStudy(selectedTopic.subjectId, selectedTopic.topicId)}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar Estudo Agora</span>
                  </button>
                </div>
              </div>

              {/* Por que esse conteúdo é prioritário? (Explanations) */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  Por que esse conteúdo é prioritário?
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedTopic.reasons.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-200"
                    >
                      <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Factors Grid */}
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-medium block">Domínio Atual</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedTopic.masteryLevel}%
                  </span>
                </div>
                <div className="text-center border-x border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 font-medium block">Prova Mais Próxima</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedTopic.daysUntilExam !== undefined
                      ? `${selectedTopic.daysUntilExam} dias`
                      : 'Sem prova'}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-[10px] text-slate-400 font-medium block">Tempo Estimado</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {selectedTopic.estimatedMinutes} min
                  </span>
                </div>
              </div>

              {/* AI Strategy recommendation generator */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Como estudar este conteúdo com máxima eficiência?
                    </span>
                  </div>
                  <button
                    onClick={() => handleAskAiForStrategy(selectedTopic)}
                    disabled={loadingAi}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    {loadingAi ? 'Consultando Gemini...' : 'Gerar estratégia com IA'}
                  </button>
                </div>

                {aiInsight && (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {aiInsight}
                  </div>
                )}
              </div>

              {/* Quick AI Tools shortcuts */}
              <div className="pt-2">
                <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                  Atalhos de ferramentas de aprendizagem para este tópico:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      onOpenAiTool(selectedTopic.subjectName, selectedTopic.topicTitle, 'resumo_inteligente')
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    📘 Resumo Inteligente
                  </button>
                  <button
                    onClick={() =>
                      onOpenAiTool(selectedTopic.subjectName, selectedTopic.topicTitle, 'geracao_flashcards')
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    🎴 Flashcards
                  </button>
                  <button
                    onClick={() =>
                      onOpenAiTool(selectedTopic.subjectName, selectedTopic.topicTitle, 'explicacao_simples')
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    💡 Explicação Simples
                  </button>
                  <button
                    onClick={() =>
                      onOpenAiTool(selectedTopic.subjectName, selectedTopic.topicTitle, 'mapa_mental')
                    }
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 hover:text-blue-600 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors"
                  >
                    🧠 Mapa Mental
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-40 text-blue-500" />
            <p className="text-sm font-semibold">Selecione um tópico na lista ao lado.</p>
          </div>
        )}
      </div>
    </div>
  );
};
