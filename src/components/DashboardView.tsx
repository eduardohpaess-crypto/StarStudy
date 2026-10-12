import React from 'react';
import {
  Clock,
  Target,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Calendar,
  Sparkles,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Play
} from 'lucide-react';
import { Subject, Task, StudySession, UserProfile, PriorityRecommendation } from '../types';
import { NavTab } from './Sidebar';
import { getLocalDateString } from '../utils/dateUtils';

interface DashboardViewProps {
  profile: UserProfile;
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  recommendations: PriorityRecommendation[];
  todayMinutes?: number;
  onNavigate: (tab: NavTab, extra?: any) => void;
  onStartStudy: (subjectId: string, topicId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  profile,
  subjects,
  tasks,
  sessions,
  recommendations,
  todayMinutes: propTodayMinutes,
  onNavigate,
  onStartStudy,
}) => {
  const todayStr = getLocalDateString();

  // Calculate study times with local timezone consistency
  const todayMinutes =
    propTodayMinutes !== undefined
      ? propTodayMinutes
      : sessions
          .filter((s) => getLocalDateString(s.date) === todayStr)
          .reduce((acc, curr) => acc + curr.durationMinutes, 0);

  // Last 7 days activity chart data (consistent calculation)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dStr = getLocalDateString(d);
    const minutes = sessions
      .filter((s) => getLocalDateString(s.date) === dStr)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

    const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(d);
    return {
      dateStr: dStr,
      label: dayName.replace('.', '').toUpperCase(),
      minutes,
    };
  });

  const chartTotalMinutes = last7Days.reduce((acc, d) => acc + d.minutes, 0);
  const max7DayMinutes = Math.max(60, ...last7Days.map((d) => d.minutes));

  const weekMinutes = chartTotalMinutes;

  // Tasks statistics
  const pendingTasks = tasks.filter((t) => t.status !== 'done');
  const overdueTasks = pendingTasks.filter((t) => {
    return t.dueDate < todayStr;
  });

  // Due reviews today or overdue
  const dueReviewsCount = subjects.flatMap((s) => s.topics).filter((t) => {
    if (!t.nextReviewDate) return false;
    return t.nextReviewDate <= todayStr;
  }).length;

  // Next upcoming exams
  const upcomingExams = subjects
    .flatMap((s) =>
      s.exams.map((e) => ({
        ...e,
        subjectName: s.name,
        subjectColor: s.color,
      }))
    )
    .filter((e) => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Weighted average grade and total credits
  const enrolledSubjects = subjects.filter((s) => s.status === 'cursando');
  const totalCredits = enrolledSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);
  const weightedSum = enrolledSubjects.reduce((acc, s) => {
    const grade = s.currentGrade !== undefined ? s.currentGrade : 7.0;
    return acc + grade * (s.credits || 4);
  }, 0);
  const weightedAverage = totalCredits > 0 ? (weightedSum / totalCredits).toFixed(1) : '0.0';

  // 12 weeks consistency heatmap data (84 days)
  const heatmapDays = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const dStr = getLocalDateString(d);
    const minutes = sessions
      .filter((s) => getLocalDateString(s.date) === dStr)
      .reduce((acc, s) => acc + s.durationMinutes, 0);
    return { dateStr: dStr, minutes };
  });

  const getHeatmapColor = (minutes: number) => {
    if (minutes === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (minutes < 30) return 'bg-blue-200 dark:bg-blue-900/60';
    if (minutes < 60) return 'bg-blue-400 dark:bg-blue-700';
    if (minutes < 120) return 'bg-blue-600 dark:bg-blue-500';
    return 'bg-indigo-600 dark:bg-indigo-500';
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Semestre {profile.currentSemester} • {profile.course}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Olá, {profile.name}!
            </h1>
            <p className="text-blue-100 text-sm leading-relaxed">
              Você acumulou <strong className="text-white">{todayMinutes} min</strong> de foco hoje.
              {recommendations.length > 0 && (
                <span> Recomendação imediata: revise <strong>{recommendations[0].topicTitle}</strong>.</span>
              )}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('priorizacao')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-blue-700 font-semibold text-sm hover:bg-blue-50 transition-all shadow-sm hover:shadow active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>O que Estudar Agora</span>
            </button>
            <button
              onClick={() => onNavigate('pomodoro')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/40 hover:bg-blue-500/60 backdrop-blur-md text-white font-semibold text-sm border border-white/20 transition-all active:scale-95"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Iniciar Cronômetro</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Primary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tempo Hoje & Meta */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tempo Hoje</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {todayMinutes}m
            </span>
            <span className="text-xs text-slate-400">
              / {profile.dailyGoalMinutes}m
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (todayMinutes / (profile.dailyGoalMinutes || 120)) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>Meta diária</span>
              <span>{Math.round((todayMinutes / (profile.dailyGoalMinutes || 120)) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Card 2: Tempo na Semana */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Tempo na Semana</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {Math.round(weekMinutes / 60)}h {weekMinutes % 60}m
            </span>
            <span className="text-xs text-slate-400">
              / {Math.round((profile.weeklyGoalMinutes || 720) / 60)}h
            </span>
          </div>
          <div className="mt-3">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (weekMinutes / (profile.weeklyGoalMinutes || 720)) * 100)}%`,
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-slate-400">
              <span>Meta semanal</span>
              <span>{Math.round((weekMinutes / (profile.weeklyGoalMinutes || 720)) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Card 3: Sequência & Constância */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sequência Ativa</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                profile.streakDays > 0
                  ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
              }`}
            >
              <Flame
                className={`w-4 h-4 ${
                  profile.streakDays > 0 ? 'fill-amber-500 text-amber-500' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {profile.streakDays} dias
            </span>
            <span
              className={`text-xs font-semibold ${
                profile.streakDays > 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              {profile.streakDays > 0 ? 'Fogo aceso!' : 'Ofensiva inativa'}
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
            {profile.streakDays > 0
              ? 'Continue estudando diariamente para multiplicar seu bônus de XP.'
              : 'Estude hoje para acender o fogo e iniciar sua sequência de estudos!'}
          </p>
        </div>

        {/* Card 4: Desempenho & Créditos */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Média Geral (CR)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {weightedAverage}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({totalCredits} créditos)
            </span>
          </div>
          <p className="mt-3 text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-tight">
            Ponderada pelas {enrolledSubjects.length} matérias ativas no semestre.
          </p>
        </div>
      </div>

      {/* Secondary Status Row: Revisões, Tarefas e Próximas Provas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revisões previstas */}
        <div
          onClick={() => onNavigate('revisao')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Revisões Espaçadas
                </p>
                <p className="text-[11px] text-slate-400">Recuperação ativa</p>
              </div>
            </div>
            <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
              {dueReviewsCount}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-blue-600">
            <span>{dueReviewsCount > 0 ? 'Exige sua atenção hoje' : 'Em dia! Parabéns'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Tarefas pendentes & atrasadas */}
        <div
          onClick={() => onNavigate('kanban')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Tarefas & Entregas
                </p>
                <p className="text-[11px] text-slate-400">Quadro Kanban</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {pendingTasks.length}
              </span>
              {overdueTasks.length > 0 && (
                <span className="block text-[10px] font-bold text-rose-500">
                  {overdueTasks.length} atrasada(s)
                </span>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-blue-600">
            <span>Gerenciar fluxo de atividades</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Próximas Provas */}
        <div
          onClick={() => onNavigate('materias')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Próximas Provas
                </p>
                <p className="text-[11px] text-slate-400">Calendário acadêmico</p>
              </div>
            </div>
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {upcomingExams.length}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 group-hover:text-blue-600">
            <span className="truncate max-w-[200px]">
              {upcomingExams.length > 0
                ? `${upcomingExams[0].title}`
                : 'Nenhuma prova agendada'}
            </span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </div>
        </div>
      </div>

      {/* Charts & Consistency Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7 Days Activity Bar Chart + 12 Weeks Heatmap */}
        <div className="lg:col-span-2 space-y-6">
          {/* 7 Days Bar Chart */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Atividade dos Últimos 7 Dias
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Minutos estudados por dia</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700">
                Total: {chartTotalMinutes} min
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-2">
              {last7Days.map((item) => {
                const heightPercent = Math.max(10, Math.round((item.minutes / max7DayMinutes) * 100));
                const isToday = item.dateStr === todayStr;

                return (
                  <div key={item.dateStr} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100">
                      {item.minutes}m
                    </span>
                    <div className="w-full max-w-[38px] bg-slate-100/60 dark:bg-slate-800/30 rounded-xl h-32 flex items-end p-1 border border-slate-200/50 dark:border-slate-800/50">
                      {item.minutes > 0 ? (
                        <div
                          className={`w-full rounded-lg transition-all duration-500 ${
                            isToday
                              ? 'bg-blue-600 shadow-sm shadow-blue-500/30'
                              : 'bg-blue-500/80 dark:bg-blue-600/80'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      ) : (
                        <div className="w-full h-1 bg-slate-200/60 dark:bg-slate-700/30 rounded-full my-0.5" />
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-bold ${
                        isToday
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 12-Week Consistency Heatmap */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Mapa de Constância (12 Semanas)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Regularidade acadêmica dia a dia</p>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                <span>Menos</span>
                <div className="w-2.5 h-2.5 rounded-xs bg-slate-100 dark:bg-slate-800" />
                <div className="w-2.5 h-2.5 rounded-xs bg-blue-200 dark:bg-blue-900/60" />
                <div className="w-2.5 h-2.5 rounded-xs bg-blue-400 dark:bg-blue-700" />
                <div className="w-2.5 h-2.5 rounded-xs bg-blue-600 dark:bg-blue-500" />
                <span>Mais</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {heatmapDays.map((d) => (
                <div
                  key={d.dateStr}
                  className={`w-3 h-3 rounded-xs ${getHeatmapColor(d.minutes)} transition-transform hover:scale-125 cursor-pointer`}
                  title={`${d.dateStr}: ${d.minutes} min estudados`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Top Study Priorities ("O que estudar primeiro") */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Conteúdos Prioritários
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Cálculo algorítmico do StarStudy</p>
            </div>
            <button
              onClick={() => onNavigate('priorizacao')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {recommendations.slice(0, 4).map((rec) => (
              <div
                key={rec.topicId}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-2.5 hover:border-blue-400 transition-colors"
              >
                {/* Aligned top row: Subject tag + Score pts */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white truncate max-w-[170px]"
                    style={{ backgroundColor: rec.subjectColor }}
                  >
                    {rec.subjectName}
                  </span>
                  <span className="text-xs font-extrabold px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded-md shrink-0 border border-blue-200/60 dark:border-blue-900/50">
                    {rec.priorityScore} pts
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                  {rec.topicTitle}
                </h4>

                <div className="text-[11px] text-slate-500 space-y-0.5">
                  {rec.reasons.slice(0, 1).map((r, idx) => (
                    <p key={idx} className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                      <span className="line-clamp-1">{r}</span>
                    </p>
                  ))}
                </div>

                {/* Progress bar visual for Mastery */}
                <div className="space-y-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/40">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-slate-300 font-medium flex items-center gap-1.5">
                      <span>Domínio:</span>
                      <strong className="text-slate-900 dark:text-slate-100 font-bold">{rec.masteryLevel}%</strong>
                      <span className="text-slate-400">• ~{rec.estimatedMinutes}m</span>
                    </span>
                    <button
                      onClick={() => onStartStudy(rec.subjectId, rec.topicId)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 active:scale-95 transition-all"
                    >
                      Estudar
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(4, Math.min(100, rec.masteryLevel))}%`,
                        backgroundColor:
                          rec.masteryLevel >= 70 ? '#10b981' : rec.masteryLevel >= 40 ? '#3b82f6' : '#f59e0b',
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {recommendations.length === 0 && (
              <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-slate-400">
                <BookOpen className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  Nenhum conteúdo prioritário no momento.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Cadastre novos tópicos ou provas nas matérias.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress per Subject */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Progresso por Disciplina
            </h3>
            <p className="text-xs text-slate-400">Tempo investido e domínio médio</p>
          </div>
          <button
            onClick={() => onNavigate('materias')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Gerenciar matérias
          </button>
        </div>

        {enrolledSubjects.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
            <p className="text-xs font-semibold">Nenhuma disciplina cadastrada ainda.</p>
            <p className="text-[11px] text-slate-500">
              Cadastre suas matérias para visualizar seu progresso e notas aqui.
            </p>
            <button
              onClick={() => onNavigate('materias')}
              className="mt-1 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
            >
              + Adicionar Disciplina
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledSubjects.map((sub) => {
              const avgMastery =
                sub.topics.length > 0
                  ? Math.round(
                      sub.topics.reduce((acc, t) => acc + (t.masteryLevel || 0), 0) /
                        sub.topics.length
                    )
                  : 0;

              return (
                <div
                  key={sub.id}
                  onClick={() => onNavigate('materias', { subjectId: sub.id })}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3.5 h-3.5 rounded-full"
                        style={{ backgroundColor: sub.color }}
                      />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[180px] group-hover:text-blue-600 transition-colors">
                        {sub.name}
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {sub.currentGrade ? `${sub.currentGrade.toFixed(1)} / 10` : 'Sem nota'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Domínio dos conteúdos</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {avgMastery}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${avgMastery}%`,
                          backgroundColor: sub.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span>{sub.topics.length} tópicos</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Ver matéria</span>
                      <span>→</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
