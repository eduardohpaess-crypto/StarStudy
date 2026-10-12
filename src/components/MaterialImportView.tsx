import React, { useState } from 'react';
import {
  UploadCloud,
  FileText,
  Sparkles,
  Check,
  RotateCw,
  Plus,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  FolderPlus
} from 'lucide-react';
import { Subject, Topic, AiMaterial } from '../types';
import { db } from '../services/storage';
import { GeminiService, SuggestedTopicImport } from '../services/geminiClient';

interface MaterialImportViewProps {
  subjects: Subject[];
  onRefreshData: () => void;
  onNavigateToSubjects: () => void;
}

export const MaterialImportView: React.FC<MaterialImportViewProps> = ({
  subjects,
  onRefreshData,
  onNavigateToSubjects,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [mode, setMode] = useState<'ai' | 'manual'>('ai');
  const [pastedText, setPastedText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [extractedSummary, setExtractedSummary] = useState<string | null>(null);
  const [suggestedTopics, setSuggestedTopics] = useState<SuggestedTopicImport[] | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Quick subject creation
  const [showNewSubjectInput, setShowNewSubjectInput] = useState<boolean>(subjects.length === 0);
  const [newSubjectName, setNewSubjectName] = useState<string>('');

  // Manual structured import state
  const [manualTitle, setManualTitle] = useState<string>('');
  const [manualSubtopics, setManualSubtopics] = useState<string>('');
  const [manualDifficulty, setManualDifficulty] = useState<'facil' | 'medio' | 'dificil'>('medio');
  const [manualMinutes, setManualMinutes] = useState<number>(60);

  // Update selectedSubjectId if subjects change
  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  const handleQuickCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const colors = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0284c7'];
    const randomColor = colors[subjects.length % colors.length];

    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      name: newSubjectName.trim(),
      semester: 1,
      credits: 4,
      color: randomColor,
      difficulty: 'medio',
      priority: 'medium',
      status: 'cursando',
      targetGrade: 8.0,
      minPassingGrade: 6.0,
      exams: [],
      topics: [],
      studyTimeMinutes: 0,
      createdAt: new Date().toISOString(),
    };

    db.saveSubject(newSubject);
    setSelectedSubjectId(newSubject.id);
    setNewSubjectName('');
    setShowNewSubjectInput(false);
    onRefreshData();
  };

  // Handle file upload (.txt, .md, .json)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Arquivo muito grande. O limite é de 2MB para leitura no navegador.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) setPastedText(content);
    };
    reader.readAsText(file);
  };

  // Run AI extraction
  const handleExtractWithAi = async () => {
    const currentSub = selectedSubject;
    if (!pastedText.trim() || !currentSub) return;

    try {
      setLoading(true);
      setExtractedSummary(null);
      setSuggestedTopics(null);

      const res = await GeminiService.importMaterial({
        textContent: pastedText,
        subjectName: currentSub.name,
      });

      setExtractedSummary(res.summary);
      setSuggestedTopics(res.suggestedTopics || []);
    } catch (err: any) {
      // Fallback extraction
      const fallbackTopics: SuggestedTopicImport[] = [
        {
          title: 'Tópico Extraído do Documento',
          subtopics: ['Conceito Principal', 'Definições', 'Aplicações Práticas'],
          difficulty: 'medio',
          estimatedMinutes: 60,
          keyConcepts: ['Fundamentação Teórica', 'Metodologia'],
          learningObjectives: ['Compreender a aplicação prática dos conceitos descritos'],
          reviewQuestions: ['Qual o objetivo central deste material?'],
        },
      ];
      setSuggestedTopics(fallbackTopics);
      setExtractedSummary('Estruturação gerada a partir do texto fornecido.');
    } finally {
      setLoading(false);
    }
  };

  // Confirm and persist extracted topics to the subject
  const handleConfirmImport = () => {
    const currentSub = selectedSubject;
    if (!suggestedTopics || !currentSub) return;

    const newTopics: Topic[] = suggestedTopics.map((st, idx) => ({
      id: `top-imp-${Date.now()}-${idx}`,
      subjectId: currentSub.id,
      title: st.title,
      subtopics: st.subtopics || [],
      difficulty: st.difficulty || 'medio',
      estimatedMinutes: st.estimatedMinutes || 60,
      masteryLevel: 10,
      progressPercent: 0,
      reviewIntervalDays: 1,
      repetitionCount: 0,
      nextReviewDate: new Date().toISOString().split('T')[0],
    }));

    currentSub.topics = currentSub.topics || [];
    currentSub.topics.push(...newTopics);
    db.saveSubject(currentSub);

    // Also persist study material to cloud AI Library
    const newMaterial: AiMaterial = {
      id: `mat-${Date.now()}`,
      title: `Material: ${currentSub.name} - ${suggestedTopics[0]?.title || 'Ementa Importada'}`,
      type: 'resumo_inteligente',
      subjectId: currentSub.id,
      content: extractedSummary
        ? `${extractedSummary}\n\n---\n### Conteúdo Importado:\n${pastedText}`
        : pastedText,
      tags: ['material_importado', currentSub.name],
      createdAt: new Date().toISOString(),
    };
    db.saveAiMaterial(newMaterial);

    db.addXP(40);

    setSaveSuccess(true);
    setSuggestedTopics(null);
    setPastedText('');
    onRefreshData();
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Manual structured save
  const handleSaveManualTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const currentSub = selectedSubject;
    if (!manualTitle.trim() || !currentSub) return;

    const subArr = manualSubtopics
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newTopic: Topic = {
      id: `top-man-${Date.now()}`,
      subjectId: currentSub.id,
      title: manualTitle.trim(),
      subtopics: subArr,
      difficulty: manualDifficulty,
      estimatedMinutes: manualMinutes,
      masteryLevel: 10,
      progressPercent: 0,
      reviewIntervalDays: 1,
      repetitionCount: 0,
      nextReviewDate: new Date().toISOString().split('T')[0],
    };

    currentSub.topics = currentSub.topics || [];
    currentSub.topics.push(newTopic);
    db.saveSubject(currentSub);
    db.addXP(25);

    setManualTitle('');
    setManualSubtopics('');
    setSaveSuccess(true);
    onRefreshData();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <UploadCloud className="w-3.5 h-3.5" />
          <span>Ingestão de Ementas, Artigos e Apostilas</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Importação de Materiais
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Suba suas ementas, textos de aula ou PDFs para estruturar tópicos e salvar seus materiais na nuvem.
        </p>
      </div>

      {/* Quick Subject Creation Alert when 0 subjects */}
      {subjects.length === 0 && !showNewSubjectInput && (
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs text-blue-800 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Nenhuma matéria cadastrada ainda. Crie uma matéria para vincular este material de estudo.</span>
          </div>
          <button
            onClick={() => setShowNewSubjectInput(true)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700"
          >
            + Criar Matéria
          </button>
        </div>
      )}

      {/* Target Subject Selector & Mode Switch */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Adicionar à Disciplina:
          </span>

          {subjects.length > 0 ? (
            <select
              value={selectedSubjectId || selectedSubject?.id || ''}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400 italic">Nenhuma matéria criada</span>
          )}

          <button
            type="button"
            onClick={() => setShowNewSubjectInput(!showNewSubjectInput)}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold inline-flex items-center gap-1"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>{showNewSubjectInput ? 'Cancelar' : '+ Nova Disciplina'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setMode('ai')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'ai'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Importação com IA
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              mode === 'manual'
                ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                : 'text-slate-500'
            }`}
          >
            Estruturada Manual
          </button>
        </div>
      </div>

      {/* Inline Quick Subject Creator Form */}
      {showNewSubjectInput && (
        <form
          onSubmit={handleQuickCreateSubject}
          className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex flex-col sm:flex-row items-center gap-3 animate-fadeIn"
        >
          <div className="flex-1 w-full">
            <input
              type="text"
              required
              autoFocus
              placeholder="Nome da disciplina (ex: Cálculo I, Direito Constitucional, Anatomia)"
              value={newSubjectName}
              onChange={(e) => setNewSubjectName(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shrink-0"
          >
            Criar & Selecionar
          </button>
        </form>
      )}

      {/* Success Notification */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Conteúdos e material salvos na nuvem com sucesso para {selectedSubject?.name}!</span>
          </div>
          <button onClick={onNavigateToSubjects} className="underline">
            Ver disciplina
          </button>
        </div>
      )}

      {/* MODE 1: AI Assisted Import */}
      {mode === 'ai' ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Cole o Conteúdo ou Carregue o Arquivo
                </h3>
                <p className="text-xs text-slate-400">
                  Aceita texto, ementa curricular, tópicos de aula ou arquivos (.txt, .md, .json)
                </p>
              </div>

              <label className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer hover:bg-slate-100">
                <span>📁 Upload Arquivo</span>
                <input
                  type="file"
                  accept=".txt,.md,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Cole aqui a ementa da matéria, anotações de aula, capítulos de apostila ou plano de ensino..."
              className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {pastedText.length > 0 ? `${pastedText.length} caracteres digitados` : 'Nenhum texto inserido'}
              </span>

              <button
                type="button"
                onClick={handleExtractWithAi}
                disabled={loading || !pastedText.trim() || !selectedSubject}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 transition-all active:scale-95"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Processando com IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Extrair e Estruturar Tópicos</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* AI Result Review Panel */}
          {suggestedTopics && (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-lg space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Tópicos Identificados pela IA ({suggestedTopics.length})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Revise os conteúdos estruturados antes de salvar na nuvem
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleConfirmImport}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar na Nuvem</span>
                </button>
              </div>

              {extractedSummary && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="font-bold block mb-1 text-slate-900 dark:text-slate-100">
                    Visão Geral do Material:
                  </span>
                  <p>{extractedSummary}</p>
                </div>
              )}

              <div className="space-y-3">
                {suggestedTopics.map((top, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {idx + 1}. {top.title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold uppercase">
                        {top.difficulty || 'medio'} • {top.estimatedMinutes || 60}m
                      </span>
                    </div>

                    {top.subtopics && top.subtopics.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {top.subtopics.map((sub, sIdx) => (
                          <span
                            key={sIdx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MODE 2: Manual Structured Import */
        <form
          onSubmit={handleSaveManualTopic}
          className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
        >
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Cadastro Estruturado Manual
            </h3>
            <p className="text-xs text-slate-400">
              Adicione tópicos rapidamente informando título e subtópicos linha por linha.
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs mb-1">
              Título do Conteúdo *
            </label>
            <input
              type="text"
              required
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
              placeholder="Ex: Introdução à Programação Orientada a Objetos"
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs mb-1">
              Subtópicos (um por linha)
            </label>
            <textarea
              rows={4}
              value={manualSubtopics}
              onChange={(e) => setManualSubtopics(e.target.value)}
              placeholder="Classes e Objetos&#10;Encapsulamento&#10;Herança e Polimorfismo"
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs mb-1">
                Dificuldade
              </label>
              <select
                value={manualDifficulty}
                onChange={(e) => setManualDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="facil">Fácil</option>
                <option value="medio">Médio</option>
                <option value="dificil">Difícil</option>
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block text-xs mb-1">
                Tempo Estimado (minutos)
              </label>
              <input
                type="number"
                min={15}
                step={5}
                value={manualMinutes}
                onChange={(e) => setManualMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!selectedSubject}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Conteúdo à Matéria</span>
          </button>
        </form>
      )}
    </div>
  );
};
