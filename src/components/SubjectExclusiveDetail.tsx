import React, { useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Layers,
  Wand2,
  Info,
  Play,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sparkles,
  Award,
  Clock,
  User,
  GraduationCap,
  FileText,
  AlertCircle,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
  HelpCircle,
  Copy,
  Check,
  UploadCloud,
  FileUp,
  X
} from 'lucide-react';
import { Subject, Topic, Exam, Priority } from '../types';
import { db } from '../services/storage';
import { SlidePdfImportModal } from './SlidePdfImportModal';

interface SubjectExclusiveDetailProps {
  subject: Subject;
  onBack: () => void;
  onRefreshData: () => void;
  onStartStudy: (subjectId: string, topicId?: string) => void;
  onOpenAiToolsForSubject: (subjectName: string, topicTitle?: string, toolType?: string) => void;
  onEditSubject: (subject: Subject) => void;
  onDeleteSubject: (subject: Subject) => void;
}

export const SubjectExclusiveDetail: React.FC<SubjectExclusiveDetailProps> = ({
  subject,
  onBack,
  onRefreshData,
  onStartStudy,
  onOpenAiToolsForSubject,
  onEditSubject,
  onDeleteSubject,
}) => {
  const [activeTab, setActiveTab] = useState<'topics' | 'exams' | 'ai' | 'flashcards_tasks' | 'info'>('topics');

  // Slide PDF Import Modal State
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);
  const [slideSuccessToast, setSlideSuccessToast] = useState<string | null>(null);

  // Topic Modal State
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicForm, setTopicForm] = useState<{
    title: string;
    subtopics: string;
    difficulty: 'facil' | 'medio' | 'dificil';
    estimatedMinutes: number;
  }>({
    title: '',
    subtopics: '',
    difficulty: 'medio',
    estimatedMinutes: 60,
  });

  // Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [examForm, setExamForm] = useState<{
    title: string;
    date: string;
    weight: number;
    grade: string;
    notes: string;
  }>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    weight: 4,
    grade: '',
    notes: '',
  });

  // Stats
  const topics = subject.topics || [];
  const exams = subject.exams || [];
  const avgMastery =
    topics.length > 0
      ? Math.round(topics.reduce((acc, t) => acc + (t.masteryLevel || 0), 0) / topics.length)
      : 0;
  const passedExams = exams.filter((e) => e.grade !== undefined);
  const totalWeight = exams.reduce((acc, e) => acc + e.weight, 0);
  const weightedSum = exams.reduce((acc, e) => acc + (e.grade !== undefined ? e.grade * e.weight : 0), 0);
  const calculatedGrade = totalWeight > 0 && passedExams.length > 0 ? (weightedSum / totalWeight).toFixed(1) : null;

  // Topic Handlers
  const handleOpenNewTopic = () => {
    setEditingTopic(null);
    setTopicForm({
      title: '',
      subtopics: '',
      difficulty: 'medio',
      estimatedMinutes: 60,
    });
    setIsTopicModalOpen(true);
  };

  const handleOpenEditTopic = (t: Topic) => {
    setEditingTopic(t);
    setTopicForm({
      title: t.title,
      subtopics: t.subtopics?.join(', ') || '',
      difficulty: t.difficulty || 'medio',
      estimatedMinutes: t.estimatedMinutes || 60,
    });
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.title.trim()) return;

    const subtopicsArr = topicForm.subtopics
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingTopic) {
      subject.topics = subject.topics.map((t) =>
        t.id === editingTopic.id
          ? {
              ...t,
              title: topicForm.title.trim(),
              subtopics: subtopicsArr,
              difficulty: topicForm.difficulty,
              estimatedMinutes: Number(topicForm.estimatedMinutes) || 60,
            }
          : t
      );
    } else {
      const newTopic: Topic = {
        id: `top-${Date.now()}`,
        subjectId: subject.id,
        title: topicForm.title.trim(),
        subtopics: subtopicsArr,
        difficulty: topicForm.difficulty,
        masteryLevel: 0,
        progressPercent: 0,
        reviewIntervalDays: 1,
        repetitionCount: 0,
        estimatedMinutes: Number(topicForm.estimatedMinutes) || 60,
      };
      subject.topics.push(newTopic);
    }

    db.saveSubject(subject);
    setIsTopicModalOpen(false);
    onRefreshData();
  };

  const handleDeleteTopic = (topicId: string) => {
    subject.topics = subject.topics.filter((t) => t.id !== topicId);
    db.saveSubject(subject);
    onRefreshData();
  };

  // Exam Handlers
  const handleOpenNewExam = () => {
    setEditingExam(null);
    setExamForm({
      title: '',
      date: new Date().toISOString().split('T')[0],
      weight: 4,
      grade: '',
      notes: '',
    });
    setIsExamModalOpen(true);
  };

  const handleOpenEditExam = (ex: Exam) => {
    setEditingExam(ex);
    setExamForm({
      title: ex.title,
      date: ex.date,
      weight: ex.weight,
      grade: ex.grade !== undefined ? String(ex.grade) : '',
      notes: ex.notes || '',
    });
    setIsExamModalOpen(true);
  };

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title.trim()) return;

    if (editingExam) {
      subject.exams = subject.exams.map((ex) =>
        ex.id === editingExam.id
          ? {
              ...ex,
              title: examForm.title.trim(),
              date: examForm.date,
              weight: Number(examForm.weight) || 1,
              grade: examForm.grade ? Number(examForm.grade) : undefined,
              notes: examForm.notes.trim(),
            }
          : ex
      );
    } else {
      const newExam: Exam = {
        id: `exam-${Date.now()}`,
        subjectId: subject.id,
        title: examForm.title.trim(),
        date: examForm.date,
        weight: Number(examForm.weight) || 1,
        grade: examForm.grade ? Number(examForm.grade) : undefined,
        coveredTopics: [],
        notes: examForm.notes.trim(),
      };
      subject.exams.push(newExam);
    }

    db.saveSubject(subject);
    setIsExamModalOpen(false);
    onRefreshData();
  };

  const handleDeleteExam = (examId: string) => {
    subject.exams = subject.exams.filter((ex) => ex.id !== examId);
    db.saveSubject(subject);
    onRefreshData();
  };

  // Status badge styling
  const getStatusBadge = () => {
    switch (subject.status) {
      case 'aprovado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Aprovada</span>
          </span>
        );
      case 'reprovado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Reprovada</span>
          </span>
        );
      case 'trancado':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Trancada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock className="w-3.5 h-3.5" />
            <span>Cursando</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Toast de sucesso ao importar tópicos do slide */}
      {slideSuccessToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center justify-between animate-fadeIn shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold">{slideSuccessToast}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Os tópicos foram adicionados à ementa da matéria e sincronizados com a nuvem.
              </p>
            </div>
          </div>
          <button
            onClick={() => setSlideSuccessToast(null)}
            className="p-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top navigation bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors shadow-xs group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
          <span>Voltar para Todas as Matérias</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditSubject(subject)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Editar Matéria"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDeleteSubject(subject)}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Excluir Matéria"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStartStudy(subject.id)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Iniciar Sessão de Estudo</span>
          </button>
        </div>
      </div>

      {/* Hero Banner exclusivo da Matéria */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
        <div
          className="absolute top-0 left-0 right-0 h-3"
          style={{ backgroundColor: subject.color }}
        />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pt-2">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0"
                style={{ backgroundColor: subject.color }}
              />
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {subject.code || 'SEM CÓDIGO'}
              </span>
              {getStatusBadge()}
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {subject.semester}º Semestre
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {subject.credits} Créditos
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                Dificuldade: {subject.difficulty}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {subject.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              {subject.professor && (
                <span className="flex items-center gap-1.5 font-medium">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prof. {subject.professor}</span>
                </span>
              )}
              {subject.schedule && (
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{subject.schedule}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>{topics.length} conteúdos cadastrados</span>
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{exams.length} avaliações</span>
              </span>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-3 shrink-0">
            {/* Nota Atual / Média */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Nota Registrada
              </span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-0.5 block">
                {subject.currentGrade !== undefined
                  ? Number(subject.currentGrade).toFixed(1)
                  : calculatedGrade
                  ? calculatedGrade
                  : '—'}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Meta: {subject.targetGrade || 7.0}
              </span>
            </div>

            {/* Domínio Médio */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Domínio Médio
              </span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                {avgMastery}%
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {topics.length} tópicos
              </span>
            </div>

            {/* Tempo de Estudo */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-center col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Tempo Dedicado
              </span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {subject.studyTimeMinutes || 0}m
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Sessões de foco
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs in Exclusive View */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pt-2 overflow-x-auto">
          {[
            { id: 'topics' as const, label: `Conteúdos & Tópicos (${topics.length})`, icon: Layers },
            { id: 'exams' as const, label: `Provas & Notas (${exams.length})`, icon: Calendar },
            { id: 'ai' as const, label: 'Central de IA da Disciplina', icon: Wand2 },
            { id: 'info' as const, label: 'Visão Geral & Ementa', icon: Info },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20 rounded-t-xl'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: Conteúdos & Tópicos */}
      {activeTab === 'topics' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Plano de Conteúdos da Disciplina
              </h2>
              <p className="text-xs text-slate-500">
                Acompanhe o domínio de cada conceito e inicie revisões espaçadas ou sessões de foco direto nele.
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsSlideModalOpen(true)}
                className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800/60 flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Separar Tópicos do Slide (PDF)</span>
              </button>

              <button
                onClick={handleOpenNewTopic}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Conteúdo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topics.map((t) => (
              <div
                key={t.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3.5 hover:border-blue-400 transition-colors shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {t.title}
                    </h3>
                    {t.subtopics && t.subtopics.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {t.subtopics.join(' • ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleOpenEditTopic(t)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Editar conteúdo"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Excluir conteúdo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Mastery Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Domínio estimado</span>
                    <strong className="text-slate-800 dark:text-slate-200 font-bold">
                      {t.masteryLevel || 0}%
                    </strong>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${t.masteryLevel || 0}%`,
                        backgroundColor:
                          (t.masteryLevel || 0) >= 70
                            ? '#10b981'
                            : (t.masteryLevel || 0) >= 40
                            ? '#3b82f6'
                            : '#f59e0b',
                      }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    ~{t.estimatedMinutes || 60}m estimadas
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenAiToolsForSubject(subject.name, t.title, 'explain')}
                      className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-semibold text-[11px] hover:bg-purple-100 transition-colors flex items-center gap-1"
                      title="Explicar conteúdo com IA"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Explicar IA</span>
                    </button>
                    <button
                      onClick={() => onStartStudy(subject.id, t.id)}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1 active:scale-95 transition-all"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Estudar</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {topics.length === 0 && (
              <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 space-y-3">
                <Layers className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhum conteúdo cadastrado para {subject.name}.
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Suba o PDF da aula para a IA separar os tópicos automaticamente ou adicione manualmente.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSlideModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Subir PDF e Separar Tópicos (IA)</span>
                  </button>
                  <button
                    onClick={handleOpenNewTopic}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Manualmente</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Provas & Avaliações */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Avaliações, Trabalhos e Provas
              </h2>
              <p className="text-xs text-slate-500">
                Controle datas, pesos, notas obtidas e calcule a média ponderada do semestre.
              </p>
            </div>
            <button
              onClick={handleOpenNewExam}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Prova/Avaliação</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((ex) => (
              <div
                key={ex.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {ex.title}
                      </h3>
                      <p className="text-xs text-slate-400">Data: {ex.date}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Peso {ex.weight}
                    </span>
                    <p className="text-xs font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                      {ex.grade !== undefined ? `Nota: ${ex.grade.toFixed(1)}` : 'Sem nota'}
                    </p>
                  </div>
                </div>

                {ex.notes && (
                  <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                    {ex.notes}
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => handleOpenEditExam(ex)}
                    className="px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDeleteExam(ex.id)}
                    className="px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-semibold text-[11px]"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}

            {exams.length === 0 && (
              <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 space-y-3">
                <Calendar className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhuma avaliação agendada para esta matéria.
                </p>
                <button
                  onClick={handleOpenNewExam}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Prova</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Central de IA da Disciplina */}
      {activeTab === 'ai' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Ferramentas de Inteligência Artificial para {subject.name}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Acelere a compreensão da matéria gerando resumos, quizzes e cronogramas customizados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                tool: 'explain',
                title: 'Explicador de Conceitos',
                desc: 'Explica tópicos difíceis desta disciplina com analogias simples e diretas.',
                icon: BrainCircuit,
                color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40',
              },
              {
                tool: 'quiz',
                title: 'Gerador de Quiz & Provas',
                desc: 'Gere simulados com perguntas de múltipla escolha sobre o conteúdo desta matéria.',
                icon: HelpCircle,
                color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40',
              },
              {
                tool: 'feynman',
                title: 'Método Feynman',
                desc: 'Teste seu domínio explicando o assunto com suas próprias palavras para a IA avaliar.',
                icon: MessageSquare,
                color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40',
              },
              {
                tool: 'flashcards',
                title: 'Gerador de Flashcards',
                desc: 'Crie baralhos de repetição espaçada focados nas fórmulas e conceitos da matéria.',
                icon: Layers,
                color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40',
              },
              {
                tool: 'summary',
                title: 'Resumo Sintético',
                desc: 'Transforme o conteúdo completo desta disciplina em um resumo executivo para véspera de prova.',
                icon: FileText,
                color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40',
              },
              {
                tool: 'socratic',
                title: 'Tutor Socrático',
                desc: 'Converse com um tutor virtual que faz perguntas para guiar seu raciocínio lógico.',
                icon: Sparkles,
                color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.tool}
                  onClick={() => onOpenAiToolsForSubject(subject.name, undefined, item.tool)}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500 cursor-pointer transition-all space-y-3 group shadow-xs"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <div className="pt-2 text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Abrir ferramenta com {subject.name}</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: Informações & Ementa */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Ficha Técnica da Disciplina
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Nome Oficial</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{subject.name}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Código da Ementa</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{subject.code || 'Não especificado'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Professor(a)</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{subject.professor || 'Não informado'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Horários de Aula</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{subject.schedule || 'Flexível / A definir'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Semestre Acadêmico</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{subject.semester}º Semestre</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Carga Horária / Créditos</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{subject.credits} créditos ({subject.credits * 15}h)</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Média Mínima para Aprovação</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{subject.minPassingGrade || 6.0}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Meta Pessoal de Nota</span>
                <p className="font-bold text-slate-900 dark:text-slate-100">{subject.targetGrade || 8.0}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Prioridade do Algoritmo</span>
                <p className="font-bold text-slate-900 dark:text-slate-100 capitalize">{subject.priority || 'medium'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR TÓPICO */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingTopic ? 'Editar Conteúdo' : 'Novo Conteúdo / Tópico'}
            </h3>

            <form onSubmit={handleSaveTopic} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Título do Conteúdo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cinemática Vetorial, Derivadas Parciais"
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Subtópicos (separados por vírgula)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vetor posição, Vetor velocidade, Aceleração tangencial"
                  value={topicForm.subtopics}
                  onChange={(e) => setTopicForm({ ...topicForm, subtopics: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Dificuldade
                  </label>
                  <select
                    value={topicForm.difficulty}
                    onChange={(e) =>
                      setTopicForm({
                        ...topicForm,
                        difficulty: e.target.value as 'facil' | 'medio' | 'dificil',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Tempo Estimado (min)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="480"
                    value={topicForm.estimatedMinutes}
                    onChange={(e) =>
                      setTopicForm({ ...topicForm, estimatedMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Conteúdo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADICIONAR / EDITAR PROVA */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingExam ? 'Editar Avaliação' : 'Nova Avaliação / Prova'}
            </h3>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Título da Avaliação *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prova P1, Trabalho Semestral"
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Data da Prova *
                  </label>
                  <input
                    type="date"
                    required
                    value={examForm.date}
                    onChange={(e) => setExamForm({ ...examForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Peso
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={examForm.weight}
                    onChange={(e) => setExamForm({ ...examForm, weight: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Nota Obtida (opcional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="Ex: 8.5"
                  value={examForm.grade}
                  onChange={(e) => setExamForm({ ...examForm, grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Observações / Conteúdos Cobrados
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Capítulos 1 ao 4 do livro-texto"
                  value={examForm.notes}
                  onChange={(e) => setExamForm({ ...examForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide PDF Import Modal */}
      <SlidePdfImportModal
        isOpen={isSlideModalOpen}
        onClose={() => setIsSlideModalOpen(false)}
        subject={subject}
        onSuccess={(addedCount) => {
          onRefreshData();
          setSlideSuccessToast(`IA extraiu e adicionou ${addedCount} novos tópicos do slide com sucesso!`);
          setTimeout(() => setSlideSuccessToast(null), 8000);
        }}
      />
    </div>
  );
};
