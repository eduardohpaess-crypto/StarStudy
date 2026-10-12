import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Send,
  RotateCw,
  X,
  List,
  Layers,
  Check
} from 'lucide-react';
import { CalendarEvent, CalendarEventCategory, Subject, Priority } from '../types';
import { db } from '../services/storage';
import { GeminiService, PlannerProposedEvent } from '../services/geminiClient';

interface CalendarPlannerViewProps {
  events: CalendarEvent[];
  subjects: Subject[];
  onRefreshData: () => void;
}

export const CalendarPlannerView: React.FC<CalendarPlannerViewProps> = ({
  events,
  subjects,
  onRefreshData,
}) => {
  const [subTab, setSubTab] = useState<'calendar' | 'today' | 'ai_planner'>('calendar');
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');

  // Month navigation
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const todayStr = new Date().toISOString().split('T')[0];

  // Event modal state
  const [isEventModalOpen, setIsEventModalOpen] = useState<boolean>(false);
  const [eventForm, setEventForm] = useState<{
    title: string;
    category: CalendarEventCategory;
    startDate: string;
    endDate: string;
    priority: Priority;
    subjectId: string;
    description: string;
  }>({
    title: '',
    category: 'estudo',
    startDate: `${todayStr}T14:00`,
    endDate: `${todayStr}T15:30`,
    priority: 'medium',
    subjectId: subjects[0]?.id || '',
    description: '',
  });

  // AI Planner state
  const [plannerInput, setPlannerInput] = useState<string>(
    'Tenho aula à noite, uma prova de Estruturas de Dados na segunda-feira e uma lista de exercícios para sexta. Só consigo estudar duas horas por dia. Organize minha semana, reserve pausas e priorize os assuntos mais difíceis.'
  );
  const [plannerLoading, setPlannerLoading] = useState<boolean>(false);
  const [proposedEvents, setProposedEvents] = useState<PlannerProposedEvent[] | null>(null);
  const [plannerSummary, setPlannerSummary] = useState<string | null>(null);
  const [plannerWarnings, setPlannerWarnings] = useState<string[]>([]);

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(
    currentDate
  );

  // Filter events for today view
  const todayEvents = events
    .filter((e) => e.startDate.startsWith(todayStr))
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Save manual event
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) return;

    const newEvent: CalendarEvent = {
      id: `ev-${Date.now()}`,
      title: eventForm.title.trim(),
      category: eventForm.category,
      startDate: eventForm.startDate,
      endDate: eventForm.endDate,
      allDay: false,
      priority: eventForm.priority,
      subjectId: eventForm.subjectId || undefined,
      description: eventForm.description.trim() || undefined,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };

    db.saveCalendarEvent(newEvent);
    setIsEventModalOpen(false);
    onRefreshData();
  };

  const handleDeleteEvent = (id: string) => {
    db.deleteCalendarEvent(id);
    onRefreshData();
  };

  // AI Planner execution
  const handleExecuteAiPlanner = async () => {
    if (!plannerInput.trim()) return;

    try {
      setPlannerLoading(true);
      setProposedEvents(null);
      setPlannerSummary(null);

      const res = await GeminiService.planSchedule({
        userInput: plannerInput,
        subjects,
        dailyGoalMinutes: 120,
      });

      setProposedEvents(res.proposedEvents || []);
      setPlannerSummary(res.summary);
      setPlannerWarnings(res.warnings || []);
    } catch (err: any) {
      // Fallback proposal
      const fallbackProposal: PlannerProposedEvent[] = [
        {
          title: 'Sessão de Foco: Revisão Ativa de Grafos',
          category: 'estudo',
          startDate: `${todayStr}T14:00`,
          endDate: `${todayStr}T15:30`,
          priority: 'urgent',
          subjectId: subjects[0]?.id,
          description: 'Foco nos algoritmos de menor caminho e resolução de exercícios.',
        },
        {
          title: 'Pausa Estratégica & Recuperação',
          category: 'estudo',
          startDate: `${todayStr}T15:30`,
          endDate: `${todayStr}T15:50`,
          priority: 'low',
          description: 'Pausa cognitiva programada.',
        },
      ];
      setProposedEvents(fallbackProposal);
      setPlannerSummary('Proposta padrão de distribuição de rotina gerada com base nos dados locais.');
    } finally {
      setPlannerLoading(false);
    }
  };

  // Explicit confirmation to save AI proposed events
  const handleConfirmAiPlan = () => {
    if (!proposedEvents) return;

    proposedEvents.forEach((pe, idx) => {
      const newEvent: CalendarEvent = {
        id: `ev-ai-${Date.now()}-${idx}`,
        title: pe.title,
        category: pe.category,
        startDate: pe.startDate,
        endDate: pe.endDate,
        allDay: false,
        priority: pe.priority,
        subjectId: pe.subjectId,
        description: pe.description,
        status: 'scheduled',
        createdAt: new Date().toISOString(),
      };
      db.saveCalendarEvent(newEvent);
    });

    db.addXP(50);
    setProposedEvents(null);
    setPlannerSummary(null);
    setSubTab('calendar');
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Top Header & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>Cronograma & Inteligência de Tempo</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Calendário & Planejador IA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Planejamento inteligente: interprete sua rotina em linguagem natural e visualize suas atividades.
          </p>
        </div>

        {/* Sub-tabs buttons */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setSubTab('calendar')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'calendar'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Calendário
            </button>
            <button
              onClick={() => setSubTab('today')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                subTab === 'today'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Visão Hoje ({todayEvents.length})
            </button>
            <button
              onClick={() => setSubTab('ai_planner')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                subTab === 'ai_planner'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Planejador IA</span>
            </button>
          </div>

          <button
            onClick={() => setIsEventModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-md shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: Month / Week Calendar */}
      {subTab === 'calendar' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          {/* Calendar header with month name & controls */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 capitalize">
                {monthName}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevMonth}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Mês Atual
            </button>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider pb-2">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank offset days */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[85px] rounded-xl bg-slate-50/40 dark:bg-slate-800/20" />
            ))}

            {/* Actual Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isToday = dateStr === todayStr;

              const dayEvents = events.filter((e) => e.startDate.startsWith(dateStr));

              return (
                <div
                  key={`day-${dayNum}`}
                  className={`min-h-[90px] p-2 rounded-xl border transition-all flex flex-col justify-between ${
                    isToday
                      ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 shadow-xs'
                      : 'border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-extrabold w-5 h-5 rounded-md flex items-center justify-center ${
                        isToday ? 'bg-blue-600 text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold text-slate-400">
                        {dayEvents.length}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mt-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((ev) => {
                      const sub = subjects.find((s) => s.id === ev.subjectId);

                      return (
                        <div
                          key={ev.id}
                          className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold truncate border text-slate-800 dark:text-slate-200"
                          style={{
                            borderLeftColor: sub?.color || '#2563eb',
                            borderLeftWidth: '3px',
                          }}
                          title={`${ev.title} (${ev.startDate.split('T')[1] || ''})`}
                        >
                          {ev.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 2: Visão Hoje */}
      {subTab === 'today' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Rotina de Hoje ({new Date().toLocaleDateString('pt-BR', { dateStyle: 'full' })})
              </h2>
              <p className="text-xs text-slate-400">
                Linha do tempo cronológica com seus compromissos, blocos de foco e aulas
              </p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
              {todayEvents.length} atividades programadas
            </span>
          </div>

          <div className="space-y-3">
            {todayEvents.map((ev) => {
              const sub = subjects.find((s) => s.id === ev.subjectId);
              const timeRange = `${ev.startDate.split('T')[1] || '08:00'} - ${ev.endDate.split('T')[1] || '09:00'}`;

              return (
                <div
                  key={ev.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        {sub && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white"
                            style={{ backgroundColor: sub.color }}
                          >
                            {sub.name}
                          </span>
                        )}
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {timeRange}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-500">
                          {ev.category}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
                        {ev.title}
                      </h4>
                      {ev.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="p-2 text-slate-400 hover:text-rose-500"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}

            {todayEvents.length === 0 && (
              <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                Nenhum evento agendado para o dia de hoje.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: Planejador IA (Natural Language Engine) */}
      {subTab === 'ai_planner' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                Planejador em Linguagem Natural
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Descreva sua rotina com restrições e compromissos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                A IA interpretará horários, provas, limites de estudo e criará uma proposta balanceada com pausas.
              </p>
            </div>

            <div className="space-y-2">
              <textarea
                rows={4}
                value={plannerInput}
                onChange={(e) => setPlannerInput(e.target.value)}
                placeholder="Ex: Tenho aula à noite, uma prova de Bioquímica na segunda-feira e um trabalho para sexta. Só consigo estudar duas horas por dia. Organize minha semana..."
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden leading-relaxed"
              />

              <div className="flex justify-end">
                <button
                  disabled={plannerLoading}
                  onClick={handleExecuteAiPlanner}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {plannerLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Interpretando rotina...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Interpretar e Planejar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Proposed Plan Preview with Explicit Confirmation */}
          {proposedEvents && (
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-900/60 shadow-xl space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                    Prévia do Cronograma Proposto
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                    {plannerSummary || 'Plano de Estudos Semanal'}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setProposedEvents(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
                  >
                    Descartar Proposta
                  </button>
                  <button
                    onClick={handleConfirmAiPlan}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Confirmar e Salvar no Calendário</span>
                  </button>
                </div>
              </div>

              {plannerWarnings.length > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                  <strong className="block font-bold">Avisos e Conflitos Identificados:</strong>
                  {plannerWarnings.map((w, idx) => (
                    <p key={idx}>• {w}</p>
                  ))}
                </div>
              )}

              {/* Proposed items list */}
              <div className="space-y-3">
                {proposedEvents.map((pe, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {pe.title}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                          {pe.category}
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{pe.description}</p>
                    </div>

                    <div className="text-right shrink-0 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                      <div>{pe.startDate.replace('T', ' ')}</div>
                      <div>até {pe.endDate.split('T')[1] || ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Novo Evento Manual */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Novo Evento Acadêmico
              </h3>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título do Evento *
                </label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="Ex: P1 de EDA ou Sessão de Revisão"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={eventForm.category}
                    onChange={(e: any) => setEventForm({ ...eventForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="estudo">Estudo</option>
                    <option value="prova">Prova</option>
                    <option value="aula">Aula</option>
                    <option value="trabalho">Trabalho</option>
                    <option value="revisao">Revisão</option>
                    <option value="prazo">Prazo</option>
                    <option value="compromisso">Compromisso</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Disciplina
                  </label>
                  <select
                    value={eventForm.subjectId}
                    onChange={(e) => setEventForm({ ...eventForm, subjectId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Nenhuma / Geral</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Início
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.startDate}
                    onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Fim
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={eventForm.endDate}
                    onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
