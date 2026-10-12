import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Flame,
  Award,
  Clock,
  Moon,
  Sun,
  Menu,
  Search,
  CheckCircle2,
  AlertCircle,
  Database,
  ChevronDown,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  profile: UserProfile;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenSearch: () => void;
  onToggleSidebar: () => void;
  hasGeminiKey: boolean;
  todayMinutes: number;
  currentUser: any;
  isSyncing: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  profile,
  darkMode,
  onToggleDarkMode,
  onOpenSearch,
  onToggleSidebar,
  hasGeminiKey,
  todayMinutes,
  currentUser,
  isSyncing,
  onLogin,
  onLogout,
  onSync,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const goalPercent = Math.min(100, Math.round((todayMinutes / (profile.dailyGoalMinutes || 120)) * 100));

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-xs">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Mobile hamburger & Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            title="Menu de navegação"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                StarStudy
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                S.O. Acadêmico
              </span>
            </div>
          </div>
        </div>

        {/* Center: Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-blue-400 dark:hover:border-blue-500 hover:bg-white dark:hover:bg-slate-800 transition-all text-left group"
          >
            <span className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
              <span>Buscar matérias, tópicos, tarefas, flashcards...</span>
            </span>
            <kbd className="hidden lg:inline-block text-[11px] font-mono px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded border border-slate-300 dark:border-slate-600">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* Right: Indicators, Badges, Profile & Theme */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile search trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden"
            title="Buscar"
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Daily Goal Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 text-xs font-medium"
            title={`Meta diária: ${todayMinutes}m de ${profile.dailyGoalMinutes}m (${goalPercent}%)`}
          >
            <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {todayMinutes}m / {profile.dailyGoalMinutes}m
            </span>
            <div className="w-10 h-1.5 bg-blue-200 dark:bg-blue-900 rounded-full overflow-hidden ml-1">
              <div
                className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>

          {/* Streak Fire */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold ${
              profile.streakDays > 0
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700'
            }`}
            title={profile.streakDays > 0 ? `Sequência ativa de ${profile.streakDays} dias de estudo!` : 'Ofensiva inativa'}
          >
            <Flame
              className={`w-3.5 h-3.5 ${
                profile.streakDays > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400 dark:text-slate-500'
              }`}
            />
            <span>{profile.streakDays}d</span>
          </div>

          {/* Level / XP */}
          <div
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50 text-xs font-semibold"
            title={`Nível ${profile.level} • ${profile.xp} XP acumulados`}
          >
            <Award className="w-3.5 h-3.5 text-indigo-500" />
            <span>Nv.{profile.level}</span>
          </div>

          {/* Gemini API Pill */}
          <div
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
              hasGeminiKey
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
            }`}
            title={
              hasGeminiKey
                ? 'Gemini 3.8 Flash conectado com segurança no servidor'
                : 'Modo manual ativo (conecte GEMINI_API_KEY para IA automática)'
            }
          >
            {hasGeminiKey ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Gemini Ativo</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Modo Local</span>
              </>
            )}
          </div>

          {/* Cloud Sync Button */}
          {currentUser ? (
            <button
              onClick={onSync}
              disabled={isSyncing}
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50 text-xs font-semibold hover:bg-blue-100 transition-colors"
              title="Sincronizar com o Firebase Firestore"
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isSyncing ? 'Sincronizando...' : 'Nuvem OK'}</span>
            </button>
          ) : (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
              title="Fazer login com Google para salvar no Firebase"
            >
              <span>Entrar com Google</span>
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User profile dropdown */}
          {currentUser ? (
            <div className="relative pl-2 border-l border-slate-200 dark:border-slate-800" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1 pl-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group cursor-pointer"
                title="Abrir menu de perfil"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                    {(currentUser.displayName || profile.name).charAt(0)}
                  </div>
                )}
                <div className="hidden xl:block text-left text-xs leading-tight">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {currentUser.displayName || profile.name}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {profile.course || 'Estudante'}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-fadeIn text-xs">
                  <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                      {currentUser.displayName || profile.name}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {currentUser.email || 'Conta StarStudy'}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200/50 dark:border-blue-900/40">
                        {profile.currentSemester}º Semestre
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200/50 dark:border-emerald-900/40">
                        Conectado
                      </span>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSync();
                      }}
                      className="w-full px-3.5 py-2 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-colors font-medium cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>Sincronizar Dados na Nuvem</span>
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full px-3.5 py-2 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2.5 transition-colors font-semibold cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
};
