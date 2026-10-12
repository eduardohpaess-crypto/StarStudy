import React, { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  BookOpen,
  Award,
  Layers,
  ArrowRight,
  RotateCw,
  Info,
  Check
} from 'lucide-react';
import { Subject, Topic, AcademicStatus, Priority } from '../types';
import { db } from '../services/storage';

interface TranscriptSubjectResult {
  name: string;
  code?: string;
  semester: number;
  credits?: number;
  professor?: string;
  finalGrade?: number | null;
  minPassingGrade?: number;
  status: 'aprovado' | 'cursando' | 'reprovado' | 'trancado';
  difficulty?: 'facil' | 'medio' | 'dificil';
  priority?: Priority;
  targetGrade?: number;
  topics?: {
    title: string;
    subtopics: string[];
    difficulty: 'facil' | 'medio' | 'dificil';
    estimatedMinutes: number;
    masteryLevel: number;
  }[];
}

interface TranscriptAnalysisResponse {
  studentName?: string | null;
  course?: string | null;
  university?: string | null;
  detectedCurrentSemester: number;
  analysisSummary: string;
  subjects: TranscriptSubjectResult[];
}

interface TranscriptImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedCount: number, detectedSemester: number) => void;
}

const PALETTE = [
  '#2563eb', // blue
  '#7c3aed', // purple
  '#059669', // emerald
  '#d97706', // amber
  '#dc2626', // rose
  '#0891b2', // cyan
  '#4f46e5', // indigo
  '#ca8a04', // yellow
  '#e11d48', // pink
  '#16a34a', // green
];

// Sample transcript for 1-click test
const SAMPLE_TRANSCRIPTS = {
  software: `UNIVERSIDADE FEDERAL DE TECNOLOGIA
HISTÓRICO ESCOLAR DE GRADUAÇÃO
Aluno: Lucas Silva Ferreira | Matrícula: 2023104928
Curso: Bacharelado em Engenharia de Software | Turno: Integral

--- 1º SEMESTRE (2023.1) ---
MAT01 - Cálculo Diferencial e Integral I | 60h | Nota: 8.5 | APROVADO
INF01 - Algoritmos e Programação Estruturada | 80h | Nota: 9.0 | APROVADO
INF02 - Introdução à Engenharia de Software | 40h | Nota: 8.0 | APROVADO
MAT02 - Geometria Analítica e Álgebra Linear | 60h | Nota: 7.2 | APROVADO
HUM01 - Metodologia Científica e Ética | 40h | Nota: 9.5 | APROVADO

--- 2º SEMESTRE (2023.2) ---
MAT03 - Cálculo II | 60h | Nota: 7.5 | APROVADO
INF03 - Estruturas de Dados Avançadas | 80h | Nota: 8.8 | APROVADO
INF04 - Arquitetura e Organização de Computadores | 60h | Nota: 8.2 | APROVADO
MAT04 - Matemática Discreta para Computação | 60h | Nota: 8.0 | APROVADO
INF05 - Programação Orientada a Objetos | 80h | Nota: 9.2 | APROVADO

--- 3º SEMESTRE (2024.1) ---
INF06 - Banco de Dados I | 80h | Nota: 9.0 | APROVADO
INF07 - Engenharia de Requisitos | 60h | Nota: 8.4 | APROVADO
INF08 - Sistemas Operacionais | 60h | Nota: 7.8 | APROVADO
EST01 - Probabilidade e Estatística Aplicada | 60h | Nota: 8.1 | APROVADO
INF09 - Redes de Computadores | 60h | Nota: 8.6 | APROVADO

--- 4º SEMESTRE (2024.2 - PERÍODO ATUAL) ---
INF10 - Análise e Projeto de Sistemas | 60h | CURSANDO
INF11 - Desenvolvimento Web Fullstack | 80h | CURSANDO
INF12 - Teste e Qualidade de Software | 60h | CURSANDO
INF13 - Gerência de Projetos de Software | 60h | CURSANDO
INF14 - Inteligência Artificial e Dados | 60h | CURSANDO`,

  law: `FACULDADE DE DIREITO
HISTÓRICO ACADÊMICO
Estudante: Mariana Souza Rocha
Curso: Direito | Período Atual: 3º Semestre

1º PERÍODO:
DIR101 - Teoria Geral do Direito | 60h | Nota: 9.0 | Aprovado
DIR102 - Direito Constitucional I | 60h | Nota: 8.5 | Aprovado
DIR103 - Filosofia do Direito | 40h | Nota: 9.2 | Aprovado
SOC101 - Sociologia Jurídica | 40h | Nota: 8.8 | Aprovado

2º PERÍODO:
DIR201 - Direito Civil: Parte Geral | 80h | Nota: 8.0 | Aprovado
DIR202 - Direito Constitucional II | 60h | Nota: 7.8 | Aprovado
DIR203 - Teoria Geral do Processo | 60h | Nota: 8.4 | Aprovado
DIR204 - Direito Penal I | 80h | Nota: 8.2 | Aprovado

3º PERÍODO (CURSANDO):
DIR301 - Direito Civil: Obrigações | 80h | Cursando
DIR302 - Direito Penal II (Teoria das Penas) | 80h | Cursando
DIR303 - Direito Processual Civil I | 60h | Cursando
DIR304 - Direito Administrativo I | 60h | Cursando`,

  medicine: `FACULDADE DE CIÊNCIAS MÉDICAS
HISTÓRICO ESCOLAR
Aluno: Gabriel Ramos Costa | Curso: Medicina

1º SEMESTRE:
MED101 - Anatomia Humana Sistêmica I | 120h | Nota: 8.8 | Aprovado
MED102 - Biologia Celular e Molecular | 80h | Nota: 8.4 | Aprovado
MED103 - Bioquímica Médica | 80h | Nota: 7.9 | Aprovado
MED104 - Histologia e Embriologia | 80h | Nota: 8.2 | Aprovado

2º SEMESTRE (ATUAL):
MED201 - Anatomia Humana II (Topográfica) | 120h | Cursando
MED202 - Fisiologia Humana Integrada I | 100h | Cursando
MED203 - Imunologia Médica | 60h | Cursando
MED204 - Genética Médica | 60h | Cursando`
};

export const TranscriptImportModal: React.FC<TranscriptImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [rawText, setRawText] = useState('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    mimeType: string;
    base64: string;
  } | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis result state
  const [result, setResult] = useState<TranscriptAnalysisResponse | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [updateProfileSemester, setUpdateProfileSemester] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isText = file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv');

    if (isText) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setRawText(text);
        setInputMode('text');
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const resultStr = event.target?.result as string;
        const base64 = resultStr.split(',')[1] || resultStr;
        setSelectedFile({
          name: file.name,
          size: (file.size / 1024).toFixed(1) + ' KB',
          mimeType: file.type || 'application/pdf',
          base64,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLoadSample = (key: keyof typeof SAMPLE_TRANSCRIPTS) => {
    setRawText(SAMPLE_TRANSCRIPTS[key]);
    setSelectedFile(null);
    setInputMode('text');
    setErrorMsg(null);
  };

  const handleAnalyze = async () => {
    setErrorMsg(null);
    if (!rawText.trim() && !selectedFile) {
      setErrorMsg('Por favor, cole o texto do seu histórico ou anexe um arquivo (PDF/Imagem/Texto).');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress('Enviando documento para a IA...');

    try {
      setTimeout(() => setAnalysisProgress('Extraindo matérias, códigos e notas...'), 900);
      setTimeout(() => setAnalysisProgress('Analisando aprovações e identificando semestre atual...'), 2200);

      const payload = {
        rawText: rawText.trim(),
        fileData: selectedFile ? { base64: selectedFile.base64, mimeType: selectedFile.mimeType } : undefined,
      };

      const res = await fetch('/api/gemini/import-transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Erro na resposta do servidor.');
      }

      const data: TranscriptAnalysisResponse = await res.json();

      if (!data.subjects || data.subjects.length === 0) {
        throw new Error('A IA não conseguiu identificar nenhuma matéria no texto fornecido. Verifique o conteúdo e tente novamente.');
      }

      setResult(data);
      // Select all subjects by default
      setSelectedIndices(new Set(data.subjects.map((_, i) => i)));
    } catch (err: any) {
      console.error('Falha ao analisar histórico:', err);
      setErrorMsg(err.message || 'Falha ao processar histórico escolar. Tente novamente ou use o exemplo.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress('');
    }
  };

  const toggleSelectSubject = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const toggleSelectAll = () => {
    if (!result) return;
    if (selectedIndices.size === result.subjects.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(result.subjects.map((_, i) => i)));
    }
  };

  const handleSaveAllSubjects = async () => {
    if (!result || selectedIndices.size === 0) return;

    setIsSaving(true);
    try {
      const selectedSubs = result.subjects.filter((_, idx) => selectedIndices.has(idx));

      // Build valid Subject entities
      const subjectsToSave: Subject[] = selectedSubs.map((item, idx) => {
        const subId = `sub-${Date.now()}-${idx}`;
        const color = PALETTE[(item.semester - 1) % PALETTE.length] || '#2563eb';

        const finalGrade = item.finalGrade !== undefined && item.finalGrade !== null ? Number(item.finalGrade) : undefined;
        const minPassingGrade = item.minPassingGrade || 6.0;

        // Formulate topics
        const normalizeDifficulty = (d?: string): 'facil' | 'medio' | 'dificil' => {
          if (d === 'facil' || d === 'dificil') return d;
          return 'medio';
        };

        const topics: Topic[] = (item.topics && item.topics.length > 0
          ? item.topics
          : [
              {
                title: `Fundamentos de ${item.name}`,
                subtopics: ['Introdução e conceitos-chave', 'Aplicações práticas'],
                difficulty: 'medio' as const,
                estimatedMinutes: 60,
                masteryLevel: item.status === 'aprovado' ? 100 : 0,
              },
            ]
        ).map((t, tIdx) => ({
          id: `top-${subId}-${tIdx}`,
          subjectId: subId,
          title: t.title,
          subtopics: t.subtopics || [],
          difficulty: normalizeDifficulty(t.difficulty),
          estimatedMinutes: t.estimatedMinutes || 60,
          masteryLevel: item.status === 'aprovado' ? 100 : (t.masteryLevel || 0),
          progressPercent: item.status === 'aprovado' ? 100 : 0,
          reviewIntervalDays: item.status === 'aprovado' ? 30 : 3,
          repetitionCount: item.status === 'aprovado' ? 4 : 0,
        }));

        return {
          id: subId,
          name: item.name,
          code: item.code || '',
          professor: item.professor || '',
          schedule: '',
          semester: Number(item.semester) || 1,
          credits: Number(item.credits) || 4,
          color,
          difficulty: normalizeDifficulty(item.difficulty),
          priority: item.priority || (item.status === 'cursando' ? 'high' : 'low'),
          currentGrade: finalGrade,
          targetGrade: item.targetGrade || 8.0,
          minPassingGrade,
          status: item.status as AcademicStatus,
          topics,
          exams: [],
          studyTimeMinutes: 0,
          createdAt: new Date().toISOString(),
        };
      });

      // Save to database & Firebase Cloud Firestore
      db.saveMultipleSubjects(subjectsToSave);

      // Optionally update user profile current semester & course
      if (updateProfileSemester && result.detectedCurrentSemester) {
        const profile = db.getProfile();
        db.saveProfile({
          ...profile,
          currentSemester: result.detectedCurrentSemester,
          course: result.course || profile.course,
          university: result.university || profile.university,
        });
      }

      onSuccess(subjectsToSave.length, result.detectedCurrentSemester);
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar matérias:', err);
      setErrorMsg('Erro ao salvar matérias: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Group extracted subjects by semester for display
  const subjectsBySemester: Record<number, { item: TranscriptSubjectResult; originalIndex: number }[]> = {};
  if (result) {
    result.subjects.forEach((item, originalIndex) => {
      const sem = item.semester || 1;
      if (!subjectsBySemester[sem]) {
        subjectsBySemester[sem] = [];
      }
      subjectsBySemester[sem].push({ item, originalIndex });
    });
  }

  const sortedSemesters = Object.keys(subjectsBySemester)
    .map(Number)
    .sort((a, b) => a - b);

  const approvedCount = result?.subjects.filter((s) => s.status === 'aprovado').length || 0;
  const enrolledCount = result?.subjects.filter((s) => s.status === 'cursando').length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-50 via-blue-50 to-white dark:from-purple-950/20 dark:via-blue-950/20 dark:to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  Importar Histórico Escolar com IA
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  Gemini Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                A IA analisa suas matérias, identifica seu semestre atual, marca notas e aprovações automaticamente.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!result ? (
            /* Input Step */
            <div className="space-y-5">
              {/* Preset Quick Tests */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                    Testar com Histórico de Exemplo (1 clique)
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">
                    Carrega histórico formatado com notas e semestres
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleLoadSample('software')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
                  >
                    💻 Engenharia de Software (4º Semestre)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('law')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
                  >
                    ⚖️ Direito (3º Semestre)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadSample('medicine')}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 text-slate-700 dark:text-slate-200 transition-colors shadow-sm"
                  >
                    🩺 Medicina (2º Semestre)
                  </button>
                </div>
              </div>

              {/* Input mode selector */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    inputMode === 'text'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Colar Texto do Portal / Histórico
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    inputMode === 'file'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Anexar Arquivo (PDF, Imagem, TXT)
                </button>
              </div>

              {inputMode === 'text' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Cole abaixo o conteúdo do seu Histórico Escolar:
                  </label>
                  <textarea
                    rows={10}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Cole aqui o texto copiado do seu SIGA, SUAP, Jacad, Sigaa ou PDF do histórico. Exemplo:&#10;&#10;1º Semestre:&#10;Cálculo I - 60h - Nota: 8.5 - Aprovado&#10;Algoritmos - 80h - Nota: 9.0 - Aprovado&#10;&#10;2º Semestre:&#10;Cálculo II - 60h - Cursando&#10;Estruturas de Dados - 80h - Cursando"
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono leading-relaxed resize-y"
                  />
                  <p className="text-[11px] text-slate-400">
                    💡 Dica: Não se preocupe com formatação perfeita. O modelo de IA identifica semestres, nomes de disciplinas, códigos e notas mesmo em textos brutos.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 rounded-3xl text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/40 group"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.csv,image/png,image/jpeg"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <UploadCloud className="w-10 h-10 mx-auto text-slate-400 group-hover:text-purple-500 transition-colors mb-3" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                      Clique para selecionar seu arquivo de histórico
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Suporta PDF, TXT ou imagem do histórico escolar (PNG, JPG)
                    </p>
                  </div>

                  {selectedFile && (
                    <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {selectedFile.name}
                          </p>
                          <p className="text-[11px] text-slate-400">{selectedFile.size}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="p-1 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Results Step */
            <div className="space-y-6">
              {/* Hero Summary Badge */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-transparent border border-purple-200 dark:border-purple-900/60 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Análise Curricular Concluída pela IA
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                      {result.course || 'Curso Universitário'}
                    </h3>
                    {result.university && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{result.university}</p>
                    )}
                  </div>

                  {/* Detected Semester Badge */}
                  <div className="px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-purple-800 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black text-sm">
                      {result.detectedCurrentSemester}º
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400">Semestre Identificado</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200">
                        {result.detectedCurrentSemester}º Semestre (Atual)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Counters row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-purple-100 dark:border-purple-900/40 text-xs">
                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-bold">TOTAL DETECTADO</span>
                    <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
                      {result.subjects.length} Matérias
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                      JÁ APROVADAS
                    </span>
                    <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                      {approvedCount} Matérias
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40">
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 block font-bold">
                      CURSANDO (ATUAL)
                    </span>
                    <span className="text-base font-extrabold text-blue-700 dark:text-blue-300">
                      {enrolledCount} Matérias
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40">
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 block font-bold">
                      SELECIONADAS
                    </span>
                    <span className="text-base font-extrabold text-purple-700 dark:text-purple-300">
                      {selectedIndices.size} para Salvar
                    </span>
                  </div>
                </div>

                {result.analysisSummary && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white/60 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
                    "{result.analysisSummary}"
                  </p>
                )}
              </div>

              {/* Subject Selection Header */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 px-1">
                <span>REVISE AS DISCIPLINAS EXTRAÍDAS:</span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-purple-600 dark:text-purple-400 hover:underline font-bold"
                >
                  {selectedIndices.size === result.subjects.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                </button>
              </div>

              {/* Subjects Grouped by Semester */}
              <div className="space-y-4">
                {sortedSemesters.map((sem) => {
                  const items = subjectsBySemester[sem] || [];
                  const isCurrent = sem === result.detectedCurrentSemester;

                  return (
                    <div
                      key={sem}
                      className={`p-4 rounded-2xl border transition-all ${
                        isCurrent
                          ? 'border-blue-400/80 bg-blue-50/20 dark:bg-blue-950/20 dark:border-blue-800'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-xl text-xs font-black bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                            {sem}º Semestre
                          </span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300">
                              Semestre Atual em Curso 🎯
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400 font-semibold">
                          {items.length} {items.length === 1 ? 'matéria' : 'matérias'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {items.map(({ item, originalIndex }) => {
                          const isSelected = selectedIndices.has(originalIndex);
                          const isAprovado = item.status === 'aprovado';

                          return (
                            <div
                              key={originalIndex}
                              onClick={() => toggleSelectSubject(originalIndex)}
                              className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-sm'
                                  : 'border-slate-100 dark:border-slate-800/50 bg-slate-50/40 dark:bg-slate-950/40 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300 dark:border-slate-700"
                                />

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                      {item.name}
                                    </span>
                                    {item.code && (
                                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                                        {item.code}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                    <span>{item.credits || 4} créditos</span>
                                    <span>•</span>
                                    <span>{item.topics?.length || 3} tópicos pedagógicos</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                {/* Grade pill */}
                                {item.finalGrade !== undefined && item.finalGrade !== null && (
                                  <span className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Nota: {Number(item.finalGrade).toFixed(1)}
                                  </span>
                                )}

                                {/* Status pill */}
                                {isAprovado ? (
                                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    <span>Aprovada</span>
                                  </span>
                                ) : item.status === 'cursando' ? (
                                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                                    <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span>Cursando</span>
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                    {item.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Profile semester update checkbox */}
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-900/50 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="chk-update-sem"
                  checked={updateProfileSemester}
                  onChange={(e) => setUpdateProfileSemester(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                />
                <label
                  htmlFor="chk-update-sem"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  Atualizar o <strong>meu semestre atual</strong> no perfil para o{' '}
                  <strong>{result.detectedCurrentSemester}º Semestre</strong> ({result.course || 'Graduação'})
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          {result ? (
            <>
              <button
                type="button"
                onClick={() => setResult(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Voltar / Editar Texto
              </button>

              <button
                type="button"
                disabled={selectedIndices.size === 0 || isSaving}
                onClick={handleSaveAllSubjects}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md shadow-purple-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Salvando e Sincronizando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      Salvar {selectedIndices.size} Matérias no StarStudy
                    </span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={isAnalyzing}
                onClick={handleAnalyze}
                className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold shadow-md shadow-purple-500/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>{analysisProgress || 'Processando com IA...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analisar Histórico com IA</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
