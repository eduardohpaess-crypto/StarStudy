import React, { useState } from 'react';
import {
  LayoutDashboard,
  Compass,
  GraduationCap,
  BookOpen,
  Calendar,
  CheckSquare,
  Timer,
  RotateCcw,
  Layers,
  FileQuestion,
  Wand2,
  Library,
  UploadCloud,
  Calculator,
  CheckCircle,
  Video,
  HardDriveDownload,
  Building2,
  X,
  Sparkles,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'feed'
  | 'priorizacao'
  | 'materias'
  | 'universidade'
  | 'calculadora'
  | 'kanban'
  | 'calendario'
  | 'pomodoro'
  | 'revisao'
  | 'flashcards'
  | 'simulados'
  | 'ferramentas20'
  | 'biblioteca'
  | 'importar'
  | 'habitos_notas'
  | 'videos'
  | 'backup';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  badgeCounts: {
    pendingTasks: number;
    dueReviews: number;
    upcomingExams: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  badgeCounts,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (label: string) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const sections = [
    {
      label: 'VISÃO GERAL',
      items: [
        { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
        {
          id: 'feed' as NavTab,
          label: 'Feed Acadêmico',
          icon: Compass,
          badge: badgeCounts.dueReviews > 0 ? badgeCounts.dueReviews : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        { id: 'priorizacao' as NavTab, label: 'O Que Estudar Agora', icon: Sparkles },
      ],
    },
    {
      label: 'ACADÊMICO',
      items: [
        {
          id: 'materias' as NavTab,
          label: 'Matérias & Conteúdos',
          icon: BookOpen,
          badge: badgeCounts.upcomingExams > 0 ? `${badgeCounts.upcomingExams} provas` : undefined,
          badgeColor: 'bg-blue-600 text-white',
        },
        { id: 'universidade' as NavTab, label: 'Modo Universidade', icon: Building2 },
        { id: 'calculadora' as NavTab, label: 'Calculadora de Notas', icon: Calculator },
      ],
    },
    {
      label: 'PRODUTIVIDADE',
      items: [
        {
          id: 'kanban' as NavTab,
          label: 'Tarefas (Kanban)',
          icon: CheckSquare,
          badge: badgeCounts.pendingTasks > 0 ? badgeCounts.pendingTasks : undefined,
          badgeColor: 'bg-amber-500 text-white',
        },
        { id: 'calendario' as NavTab, label: 'Calendário & Planejador', icon: Calendar },
        { id: 'pomodoro' as NavTab, label: 'Cronômetro & Foco', icon: Timer },
      ],
    },
    {
      label: 'APRENDIZAGEM ATIVA',
      items: [
        {
          id: 'revisao' as NavTab,
          label: 'Revisão Espaçada',
          icon: RotateCcw,
          badge: badgeCounts.dueReviews > 0 ? `${badgeCounts.dueReviews} hoje` : undefined,
          badgeColor: 'bg-rose-500 text-white',
        },
        { id: 'flashcards' as NavTab, label: 'Flashcards', icon: Layers },
        { id: 'simulados' as NavTab, label: 'Simulados & Quizzes', icon: FileQuestion },
        { id: 'biblioteca' as NavTab, label: 'Biblioteca IA', icon: Library },
      ],
    },
    {
      label: 'FERRAMENTAS DE IA',
      items: [
        { id: 'ferramentas20' as NavTab, label: '20 Ferramentas de IA', icon: Wand2 },
        { id: 'importar' as NavTab, label: 'Importar Materiais', icon: UploadCloud },
        { id: 'habitos_notas' as NavTab, label: 'Hábitos & Notas', icon: CheckCircle },
        { id: 'videos' as NavTab, label: 'Vídeos de Estudo', icon: Video },
      ],
    },
    {
      label: 'SISTEMA',
      items: [
        { id: 'backup' as NavTab, label: 'Backup & Dados Locais', icon: HardDriveDownload },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-16 z-50 lg:z-20 h-screen lg:h-[calc(100vh-4rem)] w-68 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Mobile Header in Drawer */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 dark:text-slate-100">StarStudy</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
          {sections.map((sec) => {
            const isCollapsed = !!collapsedSections[sec.label];
            const hasActiveItem = sec.items.some((i) => i.id === currentTab);

            return (
              <div key={sec.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(sec.label)}
                  className="w-full flex items-center justify-between px-3 py-1 rounded-lg text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors group cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>{sec.label}</span>
                    {hasActiveItem && isCollapsed && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                  </span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5 pt-0.5">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab(item.id);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-xs font-semibold'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Icon
                              className={`w-4 h-4 shrink-0 transition-colors ${
                                isActive
                                  ? 'text-white'
                                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span
                              className={`ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : item.badgeColor ||
                                    'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer info in sidebar */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Dados Locais
            </span>
            <span className="inline-flex items-center px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 rounded-md text-[10px] font-bold leading-normal">
              Privado
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
            Armazenamento exclusivo no seu navegador.
          </p>
        </div>
      </aside>
    </>
  );
};
