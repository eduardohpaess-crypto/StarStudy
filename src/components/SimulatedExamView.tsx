import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Play,
  RotateCw,
  Clock,
  CheckCircle2,
  XCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  RefreshCw,
  Sparkles,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { Subject, QuizQuestion, QuizAttempt } from '../types';
import { db } from '../services/storage';
import { GeminiService } from '../services/geminiClient';

interface SimulatedExamViewProps {
  subjects: Subject[];
  quizzes: QuizAttempt[];
  onRefreshData: () => void;
}

export const SimulatedExamView: React.FC<SimulatedExamViewProps> = ({
  subjects,
  quizzes,
  onRefreshData,
}) => {
  // Config state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizQuestion[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(null);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Timer for active quiz
  useEffect(() => {
    if (!activeQuiz || completedAttempt) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeQuiz, completedAttempt]);

  // Handle generating new quiz
  const handleStartSimulatedExam = async () => {
    if (!selectedSubject) return;

    try {
      setIsGenerating(true);
      const res = await GeminiService.generateQuiz({
        subjectName: selectedSubject.name,
        topics: selectedTopics.length > 0 ? selectedTopics : selectedSubject.topics.map((t) => t.title),
        questionCount,
      });

      if (res.questions && res.questions.length > 0) {
        setActiveQuiz(res.questions);
        setCurrentIndex(0);
        setUserAnswers({});
        setElapsedSeconds(0);
        setCompletedAttempt(null);
      }
    } catch (err) {
      // Fallback questions if offline or error
      const mockQuestions: QuizQuestion[] = [
        {
          id: 'q1',
          question: `Em relação aos fundamentos de ${selectedSubject.name}, qual a principal finalidade da disciplina?`,
          options: [
            'Otimizar o processamento e garantir estrutura conceitual correta',
            'Substituir a necessidade de testes formais de software',
            'Reduzir a complexidade a zero sem restrições de memória',
            'Ignorar restrições de tempo de execução assintótico',
          ],
          correctOptionIndex: 0,
          explanation: 'A correta estruturação garante eficiência computacional e rigor conceitual.',
          topicName: 'Fundamentos Gerais',
        },
        {
          id: 'q2',
          question: `Qual das alternativas representa uma boa prática de resolução para problemas desta área?`,
          options: [
            'Implementação sem análise prévia de complexidade',
            'Modelagem formal e decomposição em subproblemas',
            'Força bruta irrestrita em todos os cenários',
            'Omissão de casos limites e condições de contorno',
          ],
          correctOptionIndex: 1,
          explanation: 'Dividir em subproblemas facilita a resolução e viabiliza algoritmos mais eficientes.',
          topicName: 'Metodologia e Análise',
        },
      ];
      setActiveQuiz(mockQuestions);
      setCurrentIndex(0);
      setUserAnswers({});
      setElapsedSeconds(0);
      setCompletedAttempt(null);
    } finally {
      setIsGenerating(false);
    }
  };

  // Submit and grade quiz deterministically
  const handleFinishQuiz = () => {
    if (!activeQuiz || !selectedSubject) return;

    let correct = 0;
    activeQuiz.forEach((q) => {
      const selected = userAnswers[q.id];
      if (selected !== undefined && selected === q.correctOptionIndex) {
        correct++;
      }
    });

    const wrong = activeQuiz.length - correct;
    const score = Math.round((correct / activeQuiz.length) * 100);

    const attempt: QuizAttempt = {
      id: `quiz-att-${Date.now()}`,
      title: `Simulado de ${selectedSubject.name}`,
      subjectId: selectedSubject.id,
      topicIds: selectedTopics,
      questions: activeQuiz,
      userAnswers,
      totalQuestions: activeQuiz.length,
      correctCount: correct,
      wrongCount: wrong,
      scorePercent: score,
      timeSpentSeconds: elapsedSeconds,
      createdAt: new Date().toISOString(),
    };

    db.saveQuizAttempt(attempt);
    setCompletedAttempt(attempt);
    onRefreshData();
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <FileQuestion className="w-3.5 h-3.5" />
          <span>Avaliação Realista & Medição de Domínio</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Simulados & Quizzes
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gere avaliações de múltipla escolha com cronômetro, resolução comentada e diagnóstico de pontos fracos.
        </p>
      </div>

      {/* Screen 1: Active Exam in Progress */}
      {activeQuiz && !completedAttempt && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          {/* Header Bar: Question index & Timer */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-600">
                Questão {currentIndex + 1} de {activeQuiz.length}
              </span>
              <span className="text-xs text-slate-400">• {activeQuiz[currentIndex].topicName}</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>{formatTimer(elapsedSeconds)}</span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
              {activeQuiz[currentIndex].question}
            </h2>

            {/* Alternatives */}
            <div className="space-y-2.5">
              {activeQuiz[currentIndex].options.map((opt, optIdx) => {
                const isSelected =
                  userAnswers[activeQuiz[currentIndex].id] === optIdx;

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectOption(activeQuiz[currentIndex].id, optIdx)}
                    className={`w-full p-4 rounded-xl text-left text-xs font-medium border transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500 font-semibold'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="leading-relaxed pt-0.5">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
            >
              Anterior
            </button>

            {currentIndex < activeQuiz.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <span>Próxima</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinishQuiz}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/20 active:scale-95"
              >
                Finalizar e Corrigir Simulado
              </button>
            )}
          </div>
        </div>
      )}

      {/* Screen 2: Exam Results & Review */}
      {completedAttempt && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Diagnóstico do Simulado
            </span>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {completedAttempt.scorePercent >= 70
                ? '🎉 Excelente Desempenho!'
                : '📚 Oportunidade de Revisão Identificada'}
            </h2>
            <p className="text-xs text-slate-500">
              {completedAttempt.title} • Tempo total: {formatTimer(completedAttempt.timeSpentSeconds)}
            </p>
          </div>

          {/* Results Score Pill */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto text-center p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">Aproveitamento</span>
              <span className="text-2xl font-black text-blue-600">
                {completedAttempt.scorePercent}%
              </span>
            </div>
            <div className="border-x border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-emerald-600 block font-semibold">Acertos</span>
              <span className="text-2xl font-black text-emerald-600">
                {completedAttempt.correctCount}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-500 block font-semibold">Erros</span>
              <span className="text-2xl font-black text-rose-500">
                {completedAttempt.wrongCount}
              </span>
            </div>
          </div>

          {/* Detailed Question Review */}
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Revisão de Questões & Gabarito Comentado
            </h3>

            {completedAttempt.questions.map((q, qIdx) => {
              const userSelected = completedAttempt.userAnswers[q.id];
              const isCorrect = userSelected === q.correctOptionIndex;

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-black text-slate-400 mt-0.5">
                        {qIdx + 1}.
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {q.question}
                      </h4>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950'
                          : 'bg-rose-100 text-rose-700 dark:bg-rose-950'
                      }`}
                    >
                      {isCorrect ? '✓ Correta' : '✗ Incorreta'}
                    </span>
                  </div>

                  {/* Options status */}
                  <div className="text-xs space-y-1 pl-4">
                    <p className="text-slate-600 dark:text-slate-300">
                      Sua resposta:{' '}
                      <strong>
                        {userSelected !== undefined
                          ? `${String.fromCharCode(65 + userSelected)}) ${q.options[userSelected]}`
                          : 'Não respondida'}
                      </strong>
                    </p>
                    {!isCorrect && (
                      <p className="text-emerald-700 dark:text-emerald-400">
                        Resposta correta:{' '}
                        <strong>
                          {String.fromCharCode(65 + q.correctOptionIndex)}){' '}
                          {q.options[q.correctOptionIndex]}
                        </strong>
                      </p>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-800/80 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    <strong className="text-blue-600 block mb-0.5">Explicação Detalhada:</strong>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => {
                setActiveQuiz(null);
                setCompletedAttempt(null);
              }}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
            >
              Novo Simulado
            </button>
          </div>
        </div>
      )}

      {/* Screen 3: Generator Configuration */}
      {!activeQuiz && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Setup new exam (7 cols) */}
          <div className="md:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Configurar Novo Simulado
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Selecione a Disciplina:
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedTopics([]);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
                >
                  {subjects.length === 0 && (
                    <option value="">Nenhuma disciplina cadastrada</option>
                  )}
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantidade de Questões:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setQuestionCount(num)}
                      className={`py-2 rounded-xl font-bold border transition-all ${
                        questionCount === num
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSubject && selectedSubject.topics.length > 0 && (
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Tópicos para o Simulado (opcional):
                  </label>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                    {selectedSubject.topics.map((t) => {
                      const isChecked = selectedTopics.includes(t.title);
                      return (
                        <label
                          key={t.id}
                          className="flex items-center gap-2 text-[11px] cursor-pointer text-slate-700 dark:text-slate-300 hover:text-blue-600"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTopics([...selectedTopics, t.title]);
                              } else {
                                setSelectedTopics(selectedTopics.filter((x) => x !== t.title));
                              }
                            }}
                            className="rounded-xs text-blue-600"
                          />
                          <span>{t.title}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                disabled={isGenerating || !selectedSubject}
                onClick={handleStartSimulatedExam}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Gerando Simulado no Gemini...</span>
                  </>
                ) : !selectedSubject ? (
                  <span>Cadastre uma disciplina para simular</span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar Simulado Agora ({questionCount} questões)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: History of Previous Attempts (5 cols) */}
          <div className="md:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Histórico de Tentativas ({quizzes.length})
            </h3>

            <div className="space-y-2.5 max-h-96 overflow-y-auto">
              {quizzes.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[170px]">
                      {att.title}
                    </h4>
                    <span
                      className={`text-xs font-black ${
                        att.scorePercent >= 70 ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {att.scorePercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {att.correctCount}/{att.totalQuestions} acertos
                    </span>
                    <span>{new Date(att.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}

              {quizzes.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  Nenhum simulado realizado ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
