import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  Coffee,
  CheckCircle2,
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Subject, PomodoroCycle, StudySession } from '../types';
import { db } from '../services/storage';

interface TimerPomodoroViewProps {
  subjects: Subject[];
  initialSubjectId?: string;
  initialTopicId?: string;
  onRefreshData: () => void;
}

export const TimerPomodoroView: React.FC<TimerPomodoroViewProps> = ({
  subjects,
  initialSubjectId,
  initialTopicId,
  onRefreshData,
}) => {
  const [cycle, setCycle] = useState<PomodoroCycle>('pomodoro');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    initialSubjectId || subjects[0]?.id || ''
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId || '');
  const [isBreak, setIsBreak] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Focus and Break durations in minutes
  const cycleDurations: Record<PomodoroCycle, { focus: number; break: number; label: string }> = {
    pomodoro: { focus: 25, break: 5, label: 'Pomodoro Clássico (25m / 5m)' },
    long: { focus: 50, break: 10, label: 'Ciclo Longo (50m / 10m)' },
    extended: { focus: 90, break: 20, label: 'Ciclo Estendido (90m / 20m)' },
  };

  const currentDurationMinutes = isBreak
    ? cycleDurations[cycle].break
    : cycleDurations[cycle].focus;

  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    currentDurationMinutes * 60
  );

  // Timestamp references to avoid drift and prevent double session counting
  const targetEndTimeRef = useRef<number | null>(null);
  const sessionSavedRef = useRef<boolean>(false);

  const selectedSubject = subjects.find((s) => s.id === selectedSubjectId);

  // Play synthetic chime bell with Web Audio API
  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  // Change cycle or break
  const resetTimerForCycle = (newCycle: PomodoroCycle, breakMode = false) => {
    setIsRunning(false);
    setIsBreak(breakMode);
    targetEndTimeRef.current = null;
    sessionSavedRef.current = false;
    const mins = breakMode ? cycleDurations[newCycle].break : cycleDurations[newCycle].focus;
    setSecondsRemaining(mins * 60);
  };

  const handleSelectCycle = (newCycle: PomodoroCycle) => {
    setCycle(newCycle);
    resetTimerForCycle(newCycle, isBreak);
  };

  const handleStart = () => {
    if (!isRunning) {
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      sessionSavedRef.current = false;
      setIsRunning(true);
    }
  };

  const handlePause = () => {
    if (isRunning) {
      setIsRunning(false);
      targetEndTimeRef.current = null;
    }
  };

  const handleReset = () => {
    resetTimerForCycle(cycle, isBreak);
  };

  // Timer Tick based on timestamp
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (!targetEndTimeRef.current) return;

      const remainingMs = targetEndTimeRef.current - Date.now();
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000));

      setSecondsRemaining(remainingSecs);

      if (remainingSecs <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        playChime();

        if (!isBreak && !sessionSavedRef.current) {
          sessionSavedRef.current = true;
          // Record study session
          const duration = cycleDurations[cycle].focus;
          const xp = Math.round(duration * 2); // 2 XP per focus minute

          const newSession: StudySession = {
            id: `sess-${Date.now()}`,
            subjectId: selectedSubjectId,
            topicId: selectedTopicId || undefined,
            date: new Date().toISOString(),
            durationMinutes: duration,
            cycleType: cycle,
            notes: `Sessão de foco ${cycleDurations[cycle].label}`,
            xpEarned: xp,
          };

          db.saveSession(newSession);
          onRefreshData();

          // Switch to break automatically
          resetTimerForCycle(cycle, true);
        } else if (isBreak) {
          // Switch back to focus
          resetTimerForCycle(cycle, false);
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, isBreak, cycle, selectedSubjectId, selectedTopicId]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalCycleSeconds = currentDurationMinutes * 60;
  const progressPercent = Math.min(
    100,
    Math.round(((totalCycleSeconds - secondsRemaining) / totalCycleSeconds) * 100)
  );

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Timer className="w-3.5 h-3.5" />
          <span>Sessão de Aprendizagem & Alta Concentração</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Cronômetro & Pomodoro
        </h1>
        <p className="text-xs text-slate-500">
          Ciclos baseados em neurociência para retenção profunda com registro automático de horas e XP.
        </p>
      </div>

      {/* Cycle Selector Pills */}
      <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 max-w-md mx-auto">
        {(['pomodoro', 'long', 'extended'] as PomodoroCycle[]).map((c) => (
          <button
            key={c}
            onClick={() => handleSelectCycle(c)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              cycle === c
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            {c === 'pomodoro' ? '25 / 5 min' : c === 'long' ? '50 / 10 min' : '90 / 20 min'}
          </button>
        ))}
      </div>

      {/* Main Focus Card */}
      <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-lg text-center space-y-8 relative overflow-hidden">
        {/* State Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
          {isBreak ? (
            <>
              <Coffee className="w-4 h-4 text-emerald-500" />
              <span>Momento de Descanso ({cycleDurations[cycle].break} min)</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Foco Total ({cycleDurations[cycle].focus} min)</span>
            </>
          )}
        </div>

        {/* Huge Digital Clock Display */}
        <div className="space-y-3">
          <div className="text-6xl sm:text-8xl font-black tracking-tight text-slate-900 dark:text-slate-100 font-mono">
            {formattedTime}
          </div>

          <div className="w-full max-w-sm mx-auto bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isBreak ? 'bg-emerald-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 block font-medium">
            {progressPercent}% completado
          </span>
        </div>

        {/* Subject & Topic Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto text-left">
          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Disciplina em Estudo:
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedTopicId('');
              }}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-500 block mb-1">
              Tópico (opcional):
            </label>
            <select
              value={selectedTopicId}
              onChange={(e) => setSelectedTopicId(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
            >
              <option value="">Geral da disciplina</option>
              {selectedSubject?.topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={handleReset}
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            title="Reiniciar Ciclo"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {isRunning ? (
            <button
              onClick={handlePause}
              className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Pause className="w-5 h-5" />
              <span>Pausar Foco</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Iniciar Sessão</span>
            </button>
          )}

          <button
            onClick={() => resetTimerForCycle(cycle, !isBreak)}
            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
            title={isBreak ? 'Voltar para Foco' : 'Pular para Descanso'}
          >
            <Coffee className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Rewards Notice */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-900 dark:text-blue-200">
        <div className="flex items-center gap-2.5">
          <Award className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>
            Cada sessão concluída gera <strong>{cycleDurations[cycle].focus * 2} XP</strong> e registra o tempo diretamente no seu dashboard.
          </span>
        </div>
        <span className="font-bold text-[11px] text-blue-600 dark:text-blue-400">
          Anti-Drift Ativo
        </span>
      </div>
    </div>
  );
};
