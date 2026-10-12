import React, { useState } from 'react';
import {
  CheckCircle,
  FileText,
  Flame,
  Plus,
  Trash2,
  Edit2,
  Pin,
  Search,
  Calendar,
  X,
  Award
} from 'lucide-react';
import { Habit, QuickNote, Subject } from '../types';
import { db } from '../services/storage';

interface HabitsAndNotesViewProps {
  habits: Habit[];
  notes: QuickNote[];
  subjects: Subject[];
  onRefreshData: () => void;
}

export const HabitsAndNotesView: React.FC<HabitsAndNotesViewProps> = ({
  habits,
  notes,
  subjects,
  onRefreshData,
}) => {
  const [activeSection, setActiveSection] = useState<'habits' | 'notes'>('habits');
  const [searchNote, setSearchNote] = useState<string>('');
  const todayStr = new Date().toISOString().split('T')[0];

  // Habit modal state
  const [isHabitModalOpen, setIsHabitModalOpen] = useState<boolean>(false);
  const [habitTitle, setHabitTitle] = useState<string>('');
  const [habitFreq, setHabitFreq] = useState<'daily' | 'three_times_week' | 'weekly'>('daily');
  const [habitColor, setHabitColor] = useState<string>('#2563eb');

  // Note modal state
  const [isNoteModalOpen, setIsNoteModalOpen] = useState<boolean>(false);
  const [editingNote, setEditingNote] = useState<QuickNote | null>(null);
  const [noteTitle, setNoteTitle] = useState<string>('');
  const [noteContent, setNoteContent] = useState<string>('');
  const [noteSubjectId, setNoteSubjectId] = useState<string>('');
  const [noteTags, setNoteTags] = useState<string>('');

  // Toggle habit completion today
  const handleToggleHabit = (id: string) => {
    db.toggleHabitToday(id);
    onRefreshData();
  };

  const handleSaveHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitTitle.trim()) return;

    const newHabit: Habit = {
      id: `hab-${Date.now()}`,
      title: habitTitle.trim(),
      frequency: habitFreq,
      completions: [],
      streakDays: 0,
      color: habitColor,
      createdAt: new Date().toISOString(),
    };

    const current = db.getHabits();
    current.push(newHabit);
    db.saveHabits(current);
    setIsHabitModalOpen(false);
    setHabitTitle('');
    onRefreshData();
  };

  const handleDeleteHabit = (id: string) => {
    const filtered = db.getHabits().filter((h) => h.id !== id);
    db.saveHabits(filtered);
    onRefreshData();
  };

  // Note actions
  const handleOpenNewNote = () => {
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
    setNoteSubjectId('');
    setNoteTags('');
    setIsNoteModalOpen(true);
  };

  const handleOpenEditNote = (n: QuickNote) => {
    setEditingNote(n);
    setNoteTitle(n.title);
    setNoteContent(n.content);
    setNoteSubjectId(n.subjectId || '');
    setNoteTags(n.tags.join(', '));
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    const tagsArr = noteTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editingNote) {
      const updated: QuickNote = {
        ...editingNote,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        subjectId: noteSubjectId || undefined,
        tags: tagsArr,
        updatedAt: new Date().toISOString(),
      };
      db.saveNote(updated);
    } else {
      const newNote: QuickNote = {
        id: `note-${Date.now()}`,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        subjectId: noteSubjectId || undefined,
        tags: tagsArr,
        pinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.saveNote(newNote);
      db.addXP(15);
    }

    setIsNoteModalOpen(false);
    onRefreshData();
  };

  const handleTogglePinNote = (note: QuickNote) => {
    note.pinned = !note.pinned;
    db.saveNote(note);
    onRefreshData();
  };

  const handleDeleteNote = (id: string) => {
    db.deleteNote(id);
    onRefreshData();
  };

  // Filter notes
  const filteredNotes = notes.filter((n) => {
    if (!searchNote.trim()) return true;
    const q = searchNote.toLowerCase();
    return (
      n.title.toLowerCase().includes(q) ||
      n.content.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Constância & Anotações de Apoio</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Hábitos & Notas Rápidas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mantenha a regularidade nos estudos com streaks de hábitos e capture ideias instantâneas.
          </p>
        </div>

        {/* Section toggle */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center text-xs font-bold">
            <button
              onClick={() => setActiveSection('habits')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSection === 'habits'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Hábitos ({habits.length})
            </button>
            <button
              onClick={() => setActiveSection('notes')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeSection === 'notes'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              Notas Rápidas ({notes.length})
            </button>
          </div>

          {activeSection === 'habits' ? (
            <button
              onClick={() => setIsHabitModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Hábito</span>
            </button>
          ) : (
            <button
              onClick={handleOpenNewNote}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Nota</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: HÁBITOS */}
      {activeSection === 'habits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => {
              const isDoneToday = habit.completions.includes(todayStr);

              return (
                <div
                  key={habit.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                    isDoneToday
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/15'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {habit.frequency === 'daily'
                          ? 'Diário'
                          : habit.frequency === 'three_times_week'
                          ? '3x por semana'
                          : 'Semanal'}
                      </span>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                        <Flame className="w-4 h-4 fill-amber-500" />
                        <span>{habit.streakDays}d streak</span>
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {habit.title}
                    </h3>
                  </div>

                  {/* Check button & delete */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleToggleHabit(habit.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isDoneToday
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}
                    >
                      <span>{isDoneToday ? '✓ Feito hoje!' : 'Marcar hoje'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {habits.length === 0 && (
            <div className="p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
              Nenhum hábito cadastrado.
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: NOTAS RÁPIDAS */}
      {activeSection === 'notes' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar notas rápidas por título, conteúdo ou tags..."
              value={searchNote}
              onChange={(e) => setSearchNote(e.target.value)}
              className="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const sub = subjects.find((s) => s.id === note.subjectId);

              return (
                <div
                  key={note.id}
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                    note.pinned
                      ? 'border-blue-400 dark:border-blue-700 bg-blue-50/20 dark:bg-blue-950/20'
                      : 'border-slate-200/80 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      {sub ? (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white line-clamp-1 max-w-[140px]"
                          style={{ backgroundColor: sub.color }}
                        >
                          {sub.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">Geral</span>
                      )}

                      <button
                        onClick={() => handleTogglePinNote(note)}
                        className={`p-1 rounded-md ${
                          note.pinned ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
                        }`}
                        title={note.pinned ? 'Desafixar' : 'Fixar no topo'}
                      >
                        <Pin className="w-3.5 h-3.5 fill-current" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {note.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap line-clamp-5">
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>{new Date(note.updatedAt).toLocaleDateString('pt-BR')}</span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditNote(note)}
                        className="p-1 text-slate-400 hover:text-blue-600"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-1 text-slate-400 hover:text-rose-500"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                Nenhuma nota encontrada.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Novo Hábito */}
      {isHabitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Novo Hábito de Estudo
              </h3>
              <button
                onClick={() => setIsHabitModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHabit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome do Hábito *
                </label>
                <input
                  type="text"
                  required
                  value={habitTitle}
                  onChange={(e) => setHabitTitle(e.target.value)}
                  placeholder="Ex: Revisão ativa diária de 30 minutos"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Frequência
                </label>
                <select
                  value={habitFreq}
                  onChange={(e: any) => setHabitFreq(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="daily">Diário</option>
                  <option value="three_times_week">3 vezes por semana</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsHabitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Hábito
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova / Editar Nota */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {editingNote ? 'Editar Nota' : 'Nova Nota Rápida'}
              </h3>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título *
                </label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Ex: Dica da professora sobre a P2"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disciplina Vinculada (opcional)
                </label>
                <select
                  value={noteSubjectId}
                  onChange={(e) => setNoteSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Geral</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Conteúdo da Nota
                </label>
                <textarea
                  rows={4}
                  required
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Anotações de fórmulas, dicas de prova, dúvidas para tirar..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Nota
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
