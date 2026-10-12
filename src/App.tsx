/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { AcademicFeedView } from './components/AcademicFeedView';
import { WhatToStudyView } from './components/WhatToStudyView';
import { SubjectsView } from './components/SubjectsView';
import { UniversityModeView } from './components/UniversityModeView';
import { GradeCalculatorView } from './components/GradeCalculatorView';
import { KanbanTasksView } from './components/KanbanTasksView';
import { TimerPomodoroView } from './components/TimerPomodoroView';
import { SpacedReviewView } from './components/SpacedReviewView';
import { FlashcardsView } from './components/FlashcardsView';
import { SimulatedExamView } from './components/SimulatedExamView';
import { AiToolsView } from './components/AiToolsView';
import { AiLibraryView } from './components/AiLibraryView';
import { CalendarPlannerView } from './components/CalendarPlannerView';
import { MaterialImportView } from './components/MaterialImportView';
import { HabitsAndNotesView } from './components/HabitsAndNotesView';
import { StudyVideosView } from './components/StudyVideosView';
import { BackupManagerView } from './components/BackupManagerView';
import { SearchModal } from './components/SearchModal';
import { LoginScreen } from './components/LoginScreen';
import { db } from './services/storage';
import { GeminiService } from './services/geminiClient';
import {
  auth,
  loginWithGoogle,
  logoutUser,
  testFirestoreConnection
} from './services/firebase';
import { CloudSyncService } from './services/cloudSync';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getLocalDateString } from './utils/dateUtils';
import {
  UserProfile,
  Subject,
  Task,
  StudySession,
  Flashcard,
  QuizAttempt,
  AiMaterial,
  CalendarEvent,
  Habit,
  QuickNote,
  StudyVideo,
  PriorityRecommendation,
  AiToolType
} from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);

  // Application database state
  const [profile, setProfile] = useState<UserProfile>(db.getProfile());
  const [subjects, setSubjects] = useState<Subject[]>(db.getSubjects());
  const [tasks, setTasks] = useState<Task[]>(db.getTasks());
  const [sessions, setSessions] = useState<StudySession[]>(db.getSessions());
  const [flashcards, setFlashcards] = useState<Flashcard[]>(db.getFlashcards());
  const [quizzes, setQuizzes] = useState<QuizAttempt[]>(db.getQuizzes());
  const [aiMaterials, setAiMaterials] = useState<AiMaterial[]>(db.getAiMaterials());
  const [events, setEvents] = useState<CalendarEvent[]>(db.getCalendarEvents());
  const [habits, setHabits] = useState<Habit[]>(db.getHabits());
  const [notes, setNotes] = useState<QuickNote[]>(db.getNotes());
  const [videos, setVideos] = useState<StudyVideo[]>(db.getVideos());
  const [recommendations, setRecommendations] = useState<PriorityRecommendation[]>([]);

  // Contextual transitions for study and tools
  const [targetSubjectId, setTargetSubjectId] = useState<string | undefined>();
  const [targetTopicId, setTargetTopicId] = useState<string | undefined>();
  const [aiToolSubject, setAiToolSubject] = useState<string | undefined>();
  const [aiToolTopic, setAiToolTopic] = useState<string | undefined>();
  const [aiToolType, setAiToolType] = useState<AiToolType | undefined>();

  // Synchronize state with storage
  const reloadData = useCallback(() => {
    setProfile(db.getProfile());
    setSubjects(db.getSubjects());
    setTasks(db.getTasks());
    setSessions(db.getSessions());
    setFlashcards(db.getFlashcards());
    setQuizzes(db.getQuizzes());
    setAiMaterials(db.getAiMaterials());
    setEvents(db.getCalendarEvents());
    setHabits(db.getHabits());
    setNotes(db.getNotes());
    setVideos(db.getVideos());
    setRecommendations(db.calculatePriorities());
  }, []);

  // Initial mount & health check
  useEffect(() => {
    reloadData();
    testFirestoreConnection();

    GeminiService.checkHealth().then((h) => {
      setHasGeminiKey(h.hasGeminiKey);
    });

    // Listen to Firebase Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthInitialized(true);
      if (user) {
        setIsGuestMode(false);
        try {
          setIsSyncing(true);
          db.setActiveUser(user.uid, user.displayName, user.email);
          // Download user data from cloud (or start clean for new user)
          await CloudSyncService.downloadAllFromCloud(user);
          reloadData();
        } catch (e) {
          console.warn('Sincronização em nuvem:', e);
        } finally {
          setIsSyncing(false);
        }
      } else {
        db.setActiveUser(null);
        reloadData();
      }
    });

    // Dark mode preference check
    const savedProfile = db.getProfile();
    if (savedProfile.darkMode) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Ctrl+K Global Search shortcut
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      unsubscribeAuth();
    };
  }, [reloadData]);

  // Auth actions
  const handleLogin = () => {
    setIsGuestMode(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    db.setActiveUser(null);
    setCurrentUser(null);
    setIsGuestMode(false);
    reloadData();
  };

  const handleSyncCloud = async () => {
    if (!currentUser) return;
    try {
      setIsSyncing(true);
      await CloudSyncService.uploadAllToCloud(currentUser);
      reloadData();
    } catch (e) {
      console.error('Erro ao sincronizar com nuvem:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Toggle Dark Mode
  const handleToggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    const p = db.getProfile();
    p.darkMode = next;
    db.saveProfile(p);
  };

  // Transition to Study Session
  const handleStartStudy = (subjectId: string, topicId?: string) => {
    setTargetSubjectId(subjectId);
    setTargetTopicId(topicId);
    setCurrentTab('pomodoro');
  };

  // Transition to AI Tools with context
  const handleOpenAiToolWithContext = (subjectName: string, topicTitle?: string, toolType?: string) => {
    setAiToolSubject(subjectName);
    setAiToolTopic(topicTitle);
    if (toolType) setAiToolType(toolType as AiToolType);
    setCurrentTab('ferramentas20');
  };

  // Badge calculations
  const todayStr = getLocalDateString();
  const pendingTasksCount = tasks.filter((t) => t.status !== 'done').length;
  const dueReviewsCount = subjects.flatMap((s) => s.topics).filter((t) => {
    if (!t.nextReviewDate) return false;
    return t.nextReviewDate <= todayStr;
  }).length;
  const upcomingExamsCount = subjects.flatMap((s) => s.exams).filter((e) => e.date >= todayStr).length;

  const todayMinutes = sessions
    .filter((s) => getLocalDateString(s.date) === todayStr)
    .reduce((acc, curr) => acc + curr.durationMinutes, 0);

  // If user is not authenticated and has not chosen guest mode, show full login screen
  if (authInitialized && !currentUser && !isGuestMode) {
    return (
      <LoginScreen
        onSuccess={() => {
          setIsGuestMode(false);
          reloadData();
        }}
        onContinueGuest={() => {
          setIsGuestMode(true);
        }}
      />
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50/70 text-slate-900'} flex flex-col font-sans transition-colors`}>
      {/* Top Navigation */}
      <Navbar
        profile={profile}
        darkMode={darkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        hasGeminiKey={hasGeminiKey}
        todayMinutes={todayMinutes}
        currentUser={currentUser}
        isSyncing={isSyncing}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onSync={handleSyncCloud}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex max-w-[1680px] w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          badgeCounts={{
            pendingTasks: pendingTasksCount,
            dueReviews: dueReviewsCount,
            upcomingExams: upcomingExamsCount,
          }}
        />

        {/* Dynamic Workspace Area */}
        <main className="flex-1 p-4 lg:p-8 min-w-0 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardView
              profile={profile}
              subjects={subjects}
              tasks={tasks}
              sessions={sessions}
              recommendations={recommendations}
              todayMinutes={todayMinutes}
              onNavigate={(tab, extra) => {
                if (extra?.subjectId) {
                  setTargetSubjectId(extra.subjectId);
                }
                setCurrentTab(tab);
              }}
              onStartStudy={handleStartStudy}
            />
          )}

          {currentTab === 'feed' && (
            <AcademicFeedView
              subjects={subjects}
              tasks={tasks}
              profile={profile}
              todayMinutes={todayMinutes}
              onRefreshData={reloadData}
              onStartStudy={handleStartStudy}
            />
          )}

          {currentTab === 'priorizacao' && (
            <WhatToStudyView
              recommendations={recommendations}
              subjects={subjects}
              onStartStudy={handleStartStudy}
              onOpenAiTool={handleOpenAiToolWithContext}
            />
          )}

          {currentTab === 'materias' && (
            <SubjectsView
              subjects={subjects}
              initialSubjectId={targetSubjectId}
              onRefreshData={reloadData}
              onStartStudy={handleStartStudy}
              onOpenAiToolsForSubject={(name, topic, toolType) =>
                handleOpenAiToolWithContext(name, topic, toolType)
              }
            />
          )}

          {currentTab === 'universidade' && (
            <UniversityModeView
              subjects={subjects}
              onRefreshData={reloadData}
              onSelectSubject={(id) => {
                setTargetSubjectId(id);
                setCurrentTab('materias');
              }}
            />
          )}

          {currentTab === 'calculadora' && (
            <GradeCalculatorView subjects={subjects} />
          )}

          {currentTab === 'kanban' && (
            <KanbanTasksView
              tasks={tasks}
              subjects={subjects}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'pomodoro' && (
            <TimerPomodoroView
              subjects={subjects}
              initialSubjectId={targetSubjectId}
              initialTopicId={targetTopicId}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'revisao' && (
            <SpacedReviewView
              subjects={subjects}
              onRefreshData={reloadData}
              onOpenAiSummary={(name, topic) =>
                handleOpenAiToolWithContext(name, topic, 'resumo_inteligente')
              }
            />
          )}

          {currentTab === 'flashcards' && (
            <FlashcardsView
              flashcards={flashcards}
              subjects={subjects}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'simulados' && (
            <SimulatedExamView
              subjects={subjects}
              quizzes={quizzes}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'ferramentas20' && (
            <AiToolsView
              subjects={subjects}
              initialSubjectName={aiToolSubject}
              initialTopicTitle={aiToolTopic}
              initialToolType={aiToolType}
              onRefreshData={reloadData}
              onOpenLibrary={() => setCurrentTab('biblioteca')}
            />
          )}

          {currentTab === 'biblioteca' && (
            <AiLibraryView
              materials={aiMaterials}
              subjects={subjects}
              onRefreshData={reloadData}
              onNavigateToTools={() => setCurrentTab('ferramentas20')}
            />
          )}

          {currentTab === 'calendario' && (
            <CalendarPlannerView
              events={events}
              subjects={subjects}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'importar' && (
            <MaterialImportView
              subjects={subjects}
              onRefreshData={reloadData}
              onNavigateToSubjects={() => setCurrentTab('materias')}
            />
          )}

          {currentTab === 'habitos_notas' && (
            <HabitsAndNotesView
              habits={habits}
              notes={notes}
              subjects={subjects}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'videos' && (
            <StudyVideosView
              videos={videos}
              subjects={subjects}
              onRefreshData={reloadData}
            />
          )}

          {currentTab === 'backup' && (
            <BackupManagerView onRefreshData={reloadData} />
          )}
        </main>
      </div>

      {/* Global Search Dialog (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        subjects={subjects}
        tasks={tasks}
        flashcards={flashcards}
        notes={notes}
        onNavigate={(tab, extra) => {
          if (extra?.subjectId) {
            setTargetSubjectId(extra.subjectId);
          }
          if (extra?.topicId) {
            setTargetTopicId(extra.topicId);
          }
          setCurrentTab(tab);
        }}
      />
    </div>
  );
}
