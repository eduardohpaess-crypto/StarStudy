import React, { useState, useRef } from 'react';
import {
  Sparkles,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Layers,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Clock,
  ChevronRight,
  FileUp,
  SlidersHorizontal,
  Check
} from 'lucide-react';
import { Subject, Topic } from '../types';
import { db } from '../services/storage';

interface SlideTopicItem {
  id: string;
  selected: boolean;
  title: string;
  subtopics: string[];
  difficulty: 'facil' | 'medio' | 'dificil';
  estimatedMinutes: number;
  slideRange?: string;
  keyTakeaways?: string;
}

interface SlidePdfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subject: Subject;
  onSuccess: (addedCount: number) => void;
}

export const SlidePdfImportModal: React.FC<SlidePdfImportModalProps> = ({
  isOpen,
  onClose,
  subject,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState<{
    documentTitle: string;
    summary: string;
    totalEstimatedMinutes: number;
  } | null>(null);

  const [extractedTopics, setExtractedTopics] = useState<SlideTopicItem[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Por favor, selecione um arquivo em formato PDF.');
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      setErrorMsg('O arquivo deve ter no máximo 20MB.');
      return;
    }

    setErrorMsg(null);
    setFile(selected);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.split(',')[1] || result;
      setFileBase64(base64Clean);
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler arquivo PDF.');
    };
    reader.readAsDataURL(selected);
  };

  const handleProcessPdfWithAi = async () => {
    if (!fileBase64 && (!rawText || rawText.trim().length === 0)) {
      setErrorMsg('Selecione um arquivo PDF ou cole o texto dos slides.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        subjectName: subject.name,
      };

      if (fileBase64) {
        payload.fileData = {
          base64: fileBase64,
          mimeType: 'application/pdf',
        };
      }

      if (rawText.trim()) {
        payload.rawText = rawText.trim();
      }

      const res = await fetch('/api/gemini/extract-pdf-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao processar arquivo com a IA.');
      }

      const data = await res.json();

      setAnalysisResult({
        documentTitle: data.documentTitle || file?.name || 'Apresentação de Aula',
        summary: data.summary || 'Tópicos extraídos dos slides.',
        totalEstimatedMinutes: data.totalEstimatedMinutes || 120,
      });

      const mapped: SlideTopicItem[] = (data.topics || []).map((t: any, idx: number) => ({
        id: `extracted-${Date.now()}-${idx}`,
        selected: true,
        title: t.title || `Tópico ${idx + 1}`,
        subtopics: Array.isArray(t.subtopics) ? t.subtopics : [],
        difficulty: t.difficulty === 'facil' || t.difficulty === 'dificil' ? t.difficulty : 'medio',
        estimatedMinutes: Number(t.estimatedMinutes) || 45,
        slideRange: t.slideRange || '',
        keyTakeaways: t.keyTakeaways || '',
      }));

      setExtractedTopics(mapped);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro inesperado ao processar os slides com a IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSelectTopic = (id: string) => {
    setExtractedTopics((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = extractedTopics.every((t) => t.selected);
    setExtractedTopics((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const handleSaveToSubject = () => {
    const selectedItems = extractedTopics.filter((t) => t.selected);
    if (selectedItems.length === 0) {
      setErrorMsg('Selecione pelo menos um tópico para salvar.');
      return;
    }

    const currentTopics = subject.topics || [];

    const newTopics: Topic[] = selectedItems.map((item) => ({
      id: `top-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      subjectId: subject.id,
      title: item.title,
      subtopics: item.subtopics,
      difficulty: item.difficulty,
      masteryLevel: 0,
      progressPercent: 0,
      reviewIntervalDays: 1,
      repetitionCount: 0,
      estimatedMinutes: item.estimatedMinutes || 45,
    }));

    subject.topics = [...currentTopics, ...newTopics];
    db.saveSubject(subject);

    onSuccess(newTopics.length);
    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setFile(null);
    setFileBase64(null);
    setRawText('');
    setAnalysisResult(null);
    setExtractedTopics([]);
    setErrorMsg(null);
  };

  const selectedCount = extractedTopics.filter((t) => t.selected).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
              style={{ backgroundColor: subject.color }}
            >
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Separar Tópicos de Slides com IA
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Suba o PDF da aula de <strong>{subject.name}</strong> para a IA extrair e estruturar os conteúdos.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Upload or Input */}
          {!analysisResult ? (
            <div className="space-y-4">
              {/* Tab Selector: Upload PDF vs Colar Texto */}
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                    inputMode === 'upload'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileUp className="w-4 h-4" />
                  <span>Subir PDF da Aula / Slide</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                    inputMode === 'text'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Colar Anotações / Roteiro</span>
                </button>
              </div>

              {inputMode === 'upload' ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    file
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,application/pdf"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  {file ? (
                    <div>
                      <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {file.name}
                      </p>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • Clique para alterar arquivo
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                        Clique para escolher o PDF da aula
                      </p>
                      <p className="text-slate-400 text-[11px] mt-1 max-w-sm">
                        Suporta slides do PowerPoint exportados em PDF, apostilas do professor e apresentações de aula (até 20MB).
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300">
                    Cole o texto dos slides, sumário ou anotações da aula:
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Cole aqui o texto dos slides ou tópicos apresentados pelo professor na aula..."
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              )}

              {/* Informative tips */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>O que a Inteligência Artificial fará:</span>
                </span>
                <ul className="text-slate-500 dark:text-slate-400 space-y-1 text-[11px] list-disc list-inside">
                  <li>Detecta automaticamente as seções e transições entre os slides.</li>
                  <li>Agrupa conceitos relacionados em tópicos claros com subtópicos explicativos.</li>
                  <li>Estima tempo de estudo sugerido e classifica a dificuldade de cada parte.</li>
                  <li>Você poderá revisar e escolher quais tópicos adicionar à sua grade!</li>
                </ul>
              </div>
            </div>
          ) : (
            /* STEP 2: Review Extracted Topics */
            <div className="space-y-4">
              {/* Summary Header */}
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-blue-900 dark:text-blue-100">
                      {analysisResult.documentTitle}
                    </h4>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    ~{analysisResult.totalEstimatedMinutes} min de estudo total
                  </span>
                </div>
                <p className="text-[11px] text-blue-800 dark:text-blue-200 leading-relaxed">
                  {analysisResult.summary}
                </p>
              </div>

              {/* Select All & Controls */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
                >
                  <span>{extractedTopics.every((t) => t.selected) ? 'Desmarcar todos' : 'Selecionar todos'}</span>
                  <span>({selectedCount}/{extractedTopics.length} selecionados)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAnalysisResult(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Subir outro arquivo</span>
                </button>
              </div>

              {/* Extracted Topics List */}
              <div className="space-y-3">
                {extractedTopics.map((topic, index) => (
                  <div
                    key={topic.id}
                    onClick={() => toggleSelectTopic(topic.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      topic.selected
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            topic.selected
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                        >
                          {topic.selected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                              {topic.title}
                            </h5>
                            {topic.slideRange && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {topic.slideRange}
                              </span>
                            )}
                          </div>
                          {topic.subtopics && topic.subtopics.length > 0 && (
                            <p className="text-slate-500 text-[11px] mt-1">
                              {topic.subtopics.join(' • ')}
                            </p>
                          )}
                          {topic.keyTakeaways && (
                            <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-1.5 italic bg-white/60 dark:bg-slate-800/40 p-2 rounded-xl">
                              "{topic.keyTakeaways}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            topic.difficulty === 'facil'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : topic.difficulty === 'dificil'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {topic.difficulty}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">
                          ~{topic.estimatedMinutes} min
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => {
              handleResetModal();
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Cancelar
          </button>

          {!analysisResult ? (
            <button
              type="button"
              disabled={isLoading || (!file && !rawText.trim())}
              onClick={handleProcessPdfWithAi}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>A IA está analisando os slides...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Extrair Tópicos com IA</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleSaveToSubject}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar {selectedCount} Tópicos na Matéria</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
