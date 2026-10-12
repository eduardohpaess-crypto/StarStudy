import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  Wand2,
  Info,
  CheckCircle,
  Clock,
  Award,
  ChevronRight,
  X,
  AlertTriangle,
  Play,
  Sparkles,
  GraduationCap,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { Subject, Topic, Exam, Priority } from '../types';
import { db } from '../services/storage';
import { TranscriptImportModal } from './TranscriptImportModal';
import { SubjectExclusiveDetail } from './SubjectExclusiveDetail';
import { SlidePdfImportModal } from './SlidePdfImportModal';

interface SubjectsViewProps {
  subjects: Subject[];
  initialSubjectId?: string;
  onRefreshData: () => void;
  onStartStudy: (subjectId: string, topicId?: string) => void;
  onOpenAiToolsForSubject: (subjectName: string, topicTitle?: string, toolType?: string) => void;
}

export const SubjectsView: React.FC<SubjectsViewProps> = ({
  subjects,
  initialSubjectId,
  onRefreshData,
  onStartStudy,
  onOpenAiToolsForSubject,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || subjects[0]?.id || '');
  const [exclusiveSubjectId, setExclusiveSubjectId] = useState<string | null>(initialSubjectId || null);
  const [activeTab, setActiveTab] = useState<'topics' | 'exams' | 'ai' | 'info'>('topics');

  useEffect(() => {
    if (initialSubjectId) {
      setSelectedSubjectId(initialSubjectId);
      setExclusiveSubjectId(initialSubjectId);
    }
  }, [initialSubjectId]);

  // Modal states
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [transcriptToast, setTranscriptToast] = useState<{ message: string; semester: number } | null>(null);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [isSlideModalOpen, setIsSlideModalOpen] = useState(false);

  // Delete confirmation modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    subject: Subject;
  } | null>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId) || subjects[0];

  // Subject Form State
  const [subForm, setSubForm] = useState<{
    name: string;
    code: string;
    professor: string;
    schedule: string;
    semester: number;
    credits: number;
    color: string;
    difficulty: 'facil' | 'medio' | 'dificil';
    priority: Priority;
    targetGrade: number;
    minPassingGrade: number;
    currentGrade: string;
  }>({
    name: '',
    code: '',
    professor: '',
    schedule: '',
    semester: 3,
    credits: 4,
    color: '#2563eb',
    difficulty: 'medio',
    priority: 'medium',
    targetGrade: 8.0,
    minPassingGrade: 6.0,
    currentGrade: '',
  });

  // Topic Form State
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

  // Exam Form State
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

  const handleOpenNewSubject = () => {
    setEditingSubject(null);
    setSubForm({
      name: '',
      code: '',
      professor: '',
      schedule: '',
      semester: 3,
      credits: 4,
      color: '#2563eb',
      difficulty: 'medio',
      priority: 'medium',
      targetGrade: 8.0,
      minPassingGrade: 6.0,
      currentGrade: '',
    });
    setIsSubjectModalOpen(true);
  };

  const handleOpenEditSubject = (sub: Subject) => {
    setEditingSubject(sub);
    setSubForm({
      name: sub.name,
      code: sub.code || '',
      professor: sub.professor || '',
      schedule: sub.schedule || '',
      semester: sub.semester || 1,
      credits: sub.credits || 4,
      color: sub.color || '#2563eb',
      difficulty: sub.difficulty,
      priority: sub.priority,
      targetGrade: sub.targetGrade || 8.0,
      minPassingGrade: sub.minPassingGrade || 6.0,
      currentGrade: sub.currentGrade !== undefined ? String(sub.currentGrade) : '',
    });
    setIsSubjectModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subForm.name.trim()) return;

    if (editingSubject) {
      const updated: Subject = {
        ...editingSubject,
        name: subForm.name.trim(),
        code: subForm.code.trim(),
        professor: subForm.professor.trim(),
        schedule: subForm.schedule.trim(),
        semester: Number(subForm.semester) || 1,
        credits: Number(subForm.credits) || 4,
        color: subForm.color,
        difficulty: subForm.difficulty,
        priority: subForm.priority,
        targetGrade: Number(subForm.targetGrade) || 8.0,
        minPassingGrade: Number(subForm.minPassingGrade) || 6.0,
        currentGrade: subForm.currentGrade ? Number(subForm.currentGrade) : undefined,
      };
      db.saveSubject(updated);
    } else {
      const newSubject: Subject = {
        id: `sub-${Date.now()}`,
        name: subForm.name.trim(),
        code: subForm.code.trim(),
        professor: subForm.professor.trim(),
        schedule: subForm.schedule.trim(),
        semester: Number(subForm.semester) || 1,
        credits: Number(subForm.credits) || 4,
        color: subForm.color,
        difficulty: subForm.difficulty,
        priority: subForm.priority,
        targetGrade: Number(subForm.targetGrade) || 8.0,
        minPassingGrade: Number(subForm.minPassingGrade) || 6.0,
        currentGrade: subForm.currentGrade ? Number(subForm.currentGrade) : undefined,
        status: 'cursando',
        topics: [],
        exams: [],
        studyTimeMinutes: 0,
        createdAt: new Date().toISOString(),
      };
      db.saveSubject(newSubject);
      setSelectedSubjectId(newSubject.id);
    }

    setIsSubjectModalOpen(false);
    onRefreshData();
  };

  const handleDeleteSubject = () => {
    if (!deleteConfirmation) return;
    db.deleteSubject(deleteConfirmation.subject.id);
    setDeleteConfirmation(null);
    onRefreshData();
  };

  // Topic handlers
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

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicForm.title.trim() || !selectedSubject) return;

    const subtopicsArr = topicForm.subtopics
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingTopic) {
      selectedSubject.topics = selectedSubject.topics.map((t) =>
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
        subjectId: selectedSubject.id,
        title: topicForm.title.trim(),
        subtopics: subtopicsArr,
        difficulty: topicForm.difficulty,
        estimatedMinutes: Number(topicForm.estimatedMinutes) || 60,
        masteryLevel: 10,
        progressPercent: 0,
        reviewIntervalDays: 1,
        repetitionCount: 0,
      };
      selectedSubject.topics.push(newTopic);
    }

    db.saveSubject(selectedSubject);
    setIsTopicModalOpen(false);
    onRefreshData();
  };

  const handleDeleteTopic = (topicId: string) => {
    if (!selectedSubject) return;
    selectedSubject.topics = selectedSubject.topics.filter((t) => t.id !== topicId);
    db.saveSubject(selectedSubject);
    onRefreshData();
  };

  // Exam handlers
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

  const handleSaveExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!examForm.title.trim() || !selectedSubject) return;

    if (editingExam) {
      selectedSubject.exams = selectedSubject.exams.map((ex) =>
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
        subjectId: selectedSubject.id,
        title: examForm.title.trim(),
        date: examForm.date,
        weight: Number(examForm.weight) || 1,
        grade: examForm.grade ? Number(examForm.grade) : undefined,
        coveredTopics: [],
        notes: examForm.notes.trim(),
      };
      selectedSubject.exams.push(newExam);
    }

    db.saveSubject(selectedSubject);
    setIsExamModalOpen(false);
    onRefreshData();
  };

  const handleDeleteExam = (examId: string) => {
    if (!selectedSubject) return;
    selectedSubject.exams = selectedSubject.exams.filter((ex) => ex.id !== examId);
    db.saveSubject(selectedSubject);
    onRefreshData();
  };

  // If a specific subject is opened exclusively, show its dedicated full-page exclusive workspace
  const exclusiveSubject = exclusiveSubjectId
    ? subjects.find((s) => s.id === exclusiveSubjectId)
    : null;

  if (exclusiveSubject) {
    return (
      <SubjectExclusiveDetail
        subject={exclusiveSubject}
        onBack={() => setExclusiveSubjectId(null)}
        onRefreshData={onRefreshData}
        onStartStudy={onStartStudy}
        onOpenAiToolsForSubject={onOpenAiToolsForSubject}
        onEditSubject={(sub) => handleOpenEditSubject(sub)}
        onDeleteSubject={(sub) => setDeleteConfirmation({ subject: sub })}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Grade Curricular e Conteúdos</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Matérias & Conteúdos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre disciplinas, controle provas, monitore o domínio dos tópicos e acelere os estudos com IA.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsTranscriptModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800/60 flex items-center gap-2 transition-all active:scale-95 shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Importar Histórico (IA)</span>
          </button>

          <button
            onClick={handleOpenNewSubject}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Disciplina</span>
          </button>
        </div>
      </div>

      {/* Transcript import celebration banner */}
      {transcriptToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold">{transcriptToast.message}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                Semestre ativo ajustado para o <strong>{transcriptToast.semester}º Semestre</strong>. Seus dados estão salvos e sincronizados com a nuvem.
              </p>
            </div>
          </div>
          <button
            onClick={() => setTranscriptToast(null)}
            className="p-1 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-600 dark:text-emerald-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Subjects Pill List / Tabs, Right Subject Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Subjects selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400">
            <span>DISCIPLINAS DO SEMESTRE ({subjects.length})</span>
          </div>

          <div className="space-y-2">
            {subjects.map((sub) => {
              const isSelected = selectedSubject?.id === sub.id;
              const topicsCount = sub.topics?.length || 0;
              const examsCount = sub.exams?.length || 0;

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-blue-500 bg-white dark:bg-slate-900 shadow-md ring-1 ring-blue-500'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                          {sub.name}
                        </h3>
                        <p className="text-[11px] text-slate-400">
                          {sub.code || `Semestre ${sub.semester}`} • {sub.credits} créditos
                        </p>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                      {sub.currentGrade !== undefined ? `${sub.currentGrade.toFixed(1)}` : '—'}
                    </span>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>{topicsCount} conteúdos</span>
                    <span>{examsCount} provas</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExclusiveSubjectId(sub.id);
                      }}
                      className="inline-flex items-center gap-1 font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer"
                    >
                      <span>Abrir</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {subjects.length === 0 && (
              <div className="p-6 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-400 space-y-3">
                <BookOpen className="w-6 h-6 mx-auto opacity-40 text-blue-500" />
                <p className="text-xs font-semibold">Nenhuma disciplina cadastrada.</p>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsTranscriptModalOpen(true)}
                    className="w-full py-2 px-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/50 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Importar Histórico (IA)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenNewSubject}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    + Adicionar manualmente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Selected Subject Details (8 cols) */}
        {selectedSubject ? (
          <div className="lg:col-span-8 space-y-5">
            {/* Subject Hero Header */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedSubject.color }}
                    />
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {selectedSubject.code || 'GERAL'}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300 capitalize">
                      {selectedSubject.status}
                    </span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                    {selectedSubject.name}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {selectedSubject.professor ? `Prof. ${selectedSubject.professor}` : 'Professor não informado'}
                    {selectedSubject.schedule ? ` • ${selectedSubject.schedule}` : ''}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExclusiveSubjectId(selectedSubject.id)}
                    className="px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs"
                    title="Abrir Parte Exclusiva desta Disciplina"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Visão Exclusiva</span>
                  </button>
                  <button
                    onClick={() => handleOpenEditSubject(selectedSubject)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Editar Matéria"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmation({ subject: selectedSubject })}
                    className="p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Excluir Matéria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onStartStudy(selectedSubject.id)}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Estudar</span>
                  </button>
                </div>
              </div>

              {/* 4 Inner Tabs: Conteúdos, Provas, Ferramentas de IA, Informações */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
                {[
                  { id: 'topics' as const, label: `Conteúdos (${selectedSubject.topics.length})`, icon: Layers },
                  { id: 'exams' as const, label: `Provas (${selectedSubject.exams.length})`, icon: Calendar },
                  { id: 'ai' as const, label: 'Ferramentas de IA', icon: Wand2 },
                  { id: 'info' as const, label: 'Informações', icon: Info },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                        isActive
                          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: Conteúdos */}
              {activeTab === 'topics' && (
                <div className="space-y-4 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      Tópicos com domínio e agendamento de revisão espaçada
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsSlideModalOpen(true)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-1 border border-purple-200 dark:border-purple-800"
                        title="Subir PDF da aula e separar tópicos com IA"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Subir Slide (PDF)</span>
                      </button>
                      <button
                        onClick={handleOpenNewTopic}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar Conteúdo</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {selectedSubject.topics.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {t.title}
                            </h4>
                            {t.subtopics && t.subtopics.length > 0 && (
                              <p className="text-xs text-slate-500 mt-0.5">
                                {t.subtopics.join(' • ')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onStartStudy(selectedSubject.id, t.id)}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                            >
                              Estudar
                            </button>
                            <button
                              onClick={() => handleDeleteTopic(t.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500"
                              title="Excluir tópico"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Mastery Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-400">
                            <span>Domínio estimado</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">
                              {t.masteryLevel}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${t.masteryLevel}%` }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>~{t.estimatedMinutes} min estimado</span>
                          <span>
                            Próxima revisão:{' '}
                            <strong className="text-slate-700 dark:text-slate-300">
                              {t.nextReviewDate || 'Não agendada'}
                            </strong>
                          </span>
                        </div>
                      </div>
                    ))}

                    {selectedSubject.topics.length === 0 && (
                      <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs space-y-2.5">
                        <p>Nenhum conteúdo cadastrado nesta matéria ainda.</p>
                        <button
                          onClick={() => setIsSlideModalOpen(true)}
                          className="px-3.5 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                          <span>Subir PDF e Separar Tópicos (IA)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Provas */}
              {activeTab === 'exams' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Avaliações, datas, pesos e notas obtidas
                    </span>
                    <button
                      onClick={handleOpenNewExam}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Nova Prova / Avaliação</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {selectedSubject.exams.map((ex) => (
                      <div
                        key={ex.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-600" />
                            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                              {ex.title}
                            </h4>
                          </div>
                          <p className="text-xs text-slate-500">
                            Data: <strong>{ex.date}</strong> • Peso: {ex.weight}
                            {ex.notes ? ` • ${ex.notes}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block">Nota</span>
                            <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                              {ex.grade !== undefined ? `${ex.grade.toFixed(1)}` : 'Pendente'}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDeleteExam(ex.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {selectedSubject.exams.length === 0 && (
                      <div className="p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400 text-xs">
                        Nenhuma prova cadastrada para esta matéria.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Ferramentas de IA */}
              {activeTab === 'ai' && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-slate-500">
                    Gere materiais sob medida para <strong>{selectedSubject.name}</strong> com um clique:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { type: 'resumo_inteligente', title: '📘 Resumo Inteligente', desc: 'Conceitos fundamentais estruturados' },
                      { type: 'mapa_mental', title: '🧠 Mapa Mental', desc: 'Estrutura hierárquica completa' },
                      { type: 'questoes_dissertativas', title: '✍️ Questões Dissertativas', desc: 'Com gabarito e resposta modelo' },
                      { type: 'geracao_flashcards', title: '🎴 Flashcards Automáticos', desc: 'Baralhos para repetição espaçada' },
                      { type: 'cronograma_14dias', title: '📅 Cronograma de 14 Dias', desc: 'Reta final para preparação' },
                      { type: 'simulado_completo', title: '🎯 Simulado com 5 Questões', desc: 'Múltipla escolha com explicação' },
                    ].map((tool) => (
                      <div
                        key={tool.type}
                        onClick={() => onOpenAiToolsForSubject(selectedSubject.name)}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 bg-white dark:bg-slate-900 cursor-pointer transition-all shadow-xs group"
                      >
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                          {tool.title}
                        </h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">{tool.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Informações */}
              {activeTab === 'info' && (
                <div className="space-y-4 pt-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Semestre</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedSubject.semester}º Semestre
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Créditos</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedSubject.credits} Créditos
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Tempo Estudado</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedSubject.studyTimeMinutes || 0} min
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Meta de Nota</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedSubject.targetGrade} / 10
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Mínimo para Aprovação</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedSubject.minPassingGrade} / 10
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                      <span className="text-slate-400 block text-[10px]">Prioridade</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {selectedSubject.priority}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center space-y-4 min-h-[400px]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500/10 to-blue-500/10 text-purple-600 flex items-center justify-center mb-1">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                Comece importando seu histórico ou adicionando matérias
              </h3>
              <p className="text-xs text-slate-400">
                A IA pode analisar seu histórico escolar em segundos, reconhecer seu semestre atual, matérias aprovadas com nota e salvar tudo na nuvem.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setIsTranscriptModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/25 flex items-center gap-2 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Importar Histórico com IA</span>
              </button>
              <button
                onClick={handleOpenNewSubject}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-2 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Manualmente</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nova / Editar Disciplina */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}
              </h3>
              <button
                onClick={() => setIsSubjectModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome da Matéria *
                </label>
                <input
                  type="text"
                  required
                  value={subForm.name}
                  onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                  placeholder="Ex: Estruturas de Dados e Algoritmos"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Código da Matéria
                  </label>
                  <input
                    type="text"
                    value={subForm.code}
                    onChange={(e) => setSubForm({ ...subForm, code: e.target.value })}
                    placeholder="Ex: EDA201"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Professor(a)
                  </label>
                  <input
                    type="text"
                    value={subForm.professor}
                    onChange={(e) => setSubForm({ ...subForm, professor: e.target.value })}
                    placeholder="Ex: Prof. Carlos Menezes"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Semestre
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={subForm.semester}
                    onChange={(e) => setSubForm({ ...subForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Créditos
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={subForm.credits}
                    onChange={(e) => setSubForm({ ...subForm, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={subForm.color}
                    onChange={(e) => setSubForm({ ...subForm, color: e.target.value })}
                    className="w-full h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Nota Atual (se houver)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={subForm.currentGrade}
                    onChange={(e) => setSubForm({ ...subForm, currentGrade: e.target.value })}
                    placeholder="Ex: 7.5"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Média Mínima para Aprovação
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={subForm.minPassingGrade}
                    onChange={(e) =>
                      setSubForm({ ...subForm, minPassingGrade: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Disciplina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Conteúdo */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Novo Conteúdo de Estudo
              </h3>
              <button
                onClick={() => setIsTopicModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título do Conteúdo *
                </label>
                <input
                  type="text"
                  required
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  placeholder="Ex: Árvores Binárias de Busca e Rotações AVL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Subtópicos (um por linha)
                </label>
                <textarea
                  rows={3}
                  value={topicForm.subtopics}
                  onChange={(e) => setTopicForm({ ...topicForm, subtopics: e.target.value })}
                  placeholder="Rotação simples à direita&#10;Fator de balanceamento&#10;Inserção recursiva"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Dificuldade
                  </label>
                  <select
                    value={topicForm.difficulty}
                    onChange={(e: any) => setTopicForm({ ...topicForm, difficulty: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="facil">Fácil</option>
                    <option value="medio">Médio</option>
                    <option value="dificil">Difícil</option>
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
                    value={topicForm.estimatedMinutes}
                    onChange={(e) =>
                      setTopicForm({ ...topicForm, estimatedMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTopicModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
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

      {/* Modal: Nova Prova */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Cadastrar Prova / Avaliação
              </h3>
              <button
                onClick={() => setIsExamModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título da Avaliação *
                </label>
                <input
                  type="text"
                  required
                  value={examForm.title}
                  onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                  placeholder="Ex: Prova 1 (P1): Grafos e Algoritmos"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
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
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Peso na Média
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={examForm.weight}
                    onChange={(e) => setExamForm({ ...examForm, weight: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nota Obtida (opcional se ainda for ocorrer)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={examForm.grade}
                  onChange={(e) => setExamForm({ ...examForm, grade: e.target.value })}
                  placeholder="Deixar em branco se futura"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
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

      {/* Confirmation Modal: Excluir Disciplina com relatório de impactos */}
      {deleteConfirmation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Excluir disciplina {deleteConfirmation.subject.name}?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Esta ação removerá permanentemente a matéria e seus vínculos:
            </p>

            <ul className="text-xs text-slate-500 space-y-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl">
              <li>• {deleteConfirmation.subject.topics.length} conteúdos cadastrados</li>
              <li>• {deleteConfirmation.subject.exams.length} provas cadastradas</li>
              <li>• Tarefas e flashcards vinculados a esta matéria</li>
            </ul>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSubject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Importar Histórico Escolar com IA */}
      <TranscriptImportModal
        isOpen={isTranscriptModalOpen}
        onClose={() => setIsTranscriptModalOpen(false)}
        onSuccess={(savedCount, detectedSemester) => {
          onRefreshData();
          const allSubs = db.getSubjects();
          const activeSub = allSubs.find((s) => s.status === 'cursando' && s.semester === detectedSemester) || allSubs[0];
          if (activeSub) {
            setSelectedSubjectId(activeSub.id);
          }
          setTranscriptToast({
            message: `Histórico importado com sucesso! ${savedCount} matérias salvas e sincronizadas na nuvem.`,
            semester: detectedSemester,
          });
          setTimeout(() => setTranscriptToast(null), 8000);
        }}
      />

      {/* Modal: Subir PDF da Aula e Separar Tópicos com IA */}
      {selectedSubject && (
        <SlidePdfImportModal
          isOpen={isSlideModalOpen}
          onClose={() => setIsSlideModalOpen(false)}
          subject={selectedSubject}
          onSuccess={(addedCount) => {
            onRefreshData();
            setTranscriptToast({
              message: `${addedCount} novos tópicos extraídos do slide e cadastrados em ${selectedSubject.name}!`,
              semester: selectedSubject.semester,
            });
            setTimeout(() => setTranscriptToast(null), 6000);
          }}
        />
      )}
    </div>
  );
};
