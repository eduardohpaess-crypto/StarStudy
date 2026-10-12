import React, { useState, useEffect } from 'react';
import {
  Search,
  BookOpen,
  CheckSquare,
  Layers,
  FileText,
  Calendar,
  X,
  ArrowRight
} from 'lucide-react';
import { Subject, Task, Flashcard, QuickNote } from '../types';
import { NavTab } from './Sidebar';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  tasks: Task[];
  flashcards: Flashcard[];
  notes: QuickNote[];
  onNavigate: (tab: NavTab, extra?: any) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  subjects,
  tasks,
  flashcards,
  notes,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');

  // Keyboard shortcut listener (Escape to close, Ctrl+K to open handled in App)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  // Search matches
  const matchedSubjects = q
    ? subjects.filter((s) => s.name.toLowerCase().includes(q) || (s.code && s.code.toLowerCase().includes(q)))
    : [];

  const matchedTopics = q
    ? subjects.flatMap((s) =>
        s.topics
          .filter((t) => t.title.toLowerCase().includes(q))
          .map((t) => ({ ...t, subjectId: s.id, subjectName: s.name, subjectColor: s.color }))
      )
    : [];

  const matchedTasks = q
    ? tasks.filter((t) => t.title.toLowerCase().includes(q))
    : [];

  const matchedFlashcards = q
    ? flashcards.filter((f) => f.front.toLowerCase().includes(q) || f.back.toLowerCase().includes(q))
    : [];

  const matchedNotes = q
    ? notes.filter((n) => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q))
    : [];

  const totalResults =
    matchedSubjects.length +
    matchedTopics.length +
    matchedTasks.length +
    matchedFlashcards.length +
    matchedNotes.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[80vh] flex flex-col">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            autoFocus
            placeholder="Buscar matérias, tópicos, tarefas, flashcards, notas..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent text-slate-900 dark:text-slate-100 focus:outline-hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
          {q ? (
            totalResults > 0 ? (
              <div className="space-y-4">
                {/* Subjects */}
                {matchedSubjects.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider px-2">
                      Disciplinas ({matchedSubjects.length})
                    </span>
                    {matchedSubjects.map((s) => (
                      <div
                        key={s.id}
                        onClick={() => {
                          onNavigate('materias', { subjectId: s.id });
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: s.color }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                              {s.name}
                            </span>
                            <span className="text-slate-400 block text-[10px]">
                              {s.code ? `${s.code} • ` : ''}Abrir parte exclusiva da matéria
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          <span>Abrir</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Topics */}
                {matchedTopics.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider px-2">
                      Conteúdos & Tópicos ({matchedTopics.length})
                    </span>
                    {matchedTopics.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onNavigate('materias', { subjectId: t.subjectId, topicId: t.id });
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: t.subjectColor }}
                          />
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                              {t.title}
                            </span>
                            <span className="text-slate-400 block text-[10px]">{t.subjectName}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Tasks */}
                {matchedTasks.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider px-2">
                      Tarefas ({matchedTasks.length})
                    </span>
                    {matchedTasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => {
                          onNavigate('kanban');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <CheckSquare className="w-4 h-4 text-amber-500" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{task.title}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Flashcards */}
                {matchedFlashcards.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider px-2">
                      Flashcards ({matchedFlashcards.length})
                    </span>
                    {matchedFlashcards.map((fc) => (
                      <div
                        key={fc.id}
                        onClick={() => {
                          onNavigate('flashcards');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <Layers className="w-4 h-4 text-indigo-500" />
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate max-w-[340px]">
                            {fc.front}
                          </span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Notes */}
                {matchedNotes.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider px-2">
                      Notas Rápidas ({matchedNotes.length})
                    </span>
                    {matchedNotes.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => {
                          onNavigate('habitos_notas');
                          onClose();
                        }}
                        className="p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="font-bold text-slate-900 dark:text-slate-100">{n.title}</span>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">
                Nenhum resultado encontrado para "{query}".
              </div>
            )
          ) : (
            <div className="py-8 text-center text-slate-400 space-y-1">
              <p className="font-semibold">Digite para pesquisar em toda a plataforma.</p>
              <p className="text-[11px] text-slate-400">
                Índice local instantâneo de todas as suas matérias e notas.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>Pressione <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800">ESC</kbd> para fechar</span>
          <span>StarStudy Search</span>
        </div>
      </div>
    </div>
  );
};
