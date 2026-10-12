import {
  ActiveRecallRating,
  BackupData,
  CalendarEvent,
  Flashcard,
  Habit,
  PriorityRecommendation,
  QuickNote,
  QuizAttempt,
  StudySession,
  StudyVideo,
  Subject,
  Task,
  Topic,
  UserProfile,
  AiMaterial
} from '../types';
import { CloudSyncService } from './cloudSync';
import { auth } from './firebase';
import { calculateStreakFromSessions, getLocalDateString } from '../utils/dateUtils';

export const INITIAL_PROFILE: UserProfile = {
  name: 'Estudante',
  course: '',
  university: '',
  currentSemester: 1,
  dailyGoalMinutes: 120, // 2h por dia
  weeklyGoalMinutes: 600, // 10h por semana
  xp: 0,
  level: 1,
  streakDays: 0,
  lastActiveDate: getLocalDateString(),
  darkMode: false,
};

class LocalDatabase {
  private isBrowser = typeof window !== 'undefined';
  private activeUserId: string | null = null;

  constructor() {
    this.cleanupOldLegacySeeds();
    if (this.isBrowser) {
      this.activeUserId = localStorage.getItem('starstudy_last_user_id') || null;
    }
  }

  // Set the current authenticated user context for isolated storage
  setActiveUser(userId: string | null, displayName?: string | null, email?: string | null) {
    this.activeUserId = userId;
    if (this.isBrowser) {
      if (userId) {
        localStorage.setItem('starstudy_last_user_id', userId);
        localStorage.removeItem('starstudy_guest_mode');
      } else {
        localStorage.removeItem('starstudy_last_user_id');
      }
    }

    if (this.isBrowser && userId) {
      // Ensure user profile exists
      const prof = this.getProfile();
      if (!prof || !prof.name || prof.name === 'Estudante') {
        const initialName = displayName || (email ? email.split('@')[0] : 'Estudante');
        this.saveProfile({
          ...INITIAL_PROFILE,
          name: initialName,
        });
      }
    }
  }

  getActiveUserId(): string | null {
    return this.activeUserId || auth.currentUser?.uid || null;
  }

  // Generate storage key isolated by user
  private getKey(baseKey: string): string {
    const uid = this.getActiveUserId();
    return uid ? `starstudy_usr_${uid}_${baseKey}` : `starstudy_guest_${baseKey}`;
  }

  // Clean old legacy seed flags from earlier builds
  private cleanupOldLegacySeeds() {
    if (!this.isBrowser) return;
    try {
      // If legacy global initial seed key exists, remove legacy mock data
      if (localStorage.getItem('starstudy_initialized_v2')) {
        localStorage.removeItem('starstudy_subjects');
        localStorage.removeItem('starstudy_tasks');
        localStorage.removeItem('starstudy_flashcards');
        localStorage.removeItem('starstudy_habits');
        localStorage.removeItem('starstudy_notes');
        localStorage.removeItem('starstudy_calendar');
        localStorage.removeItem('starstudy_sessions');
        localStorage.removeItem('starstudy_videos');
        localStorage.removeItem('starstudy_initialized_v2');
      }
    } catch (e) {
      console.warn('LocalStorage cleanup warning:', e);
    }
  }

  private get<T>(baseKey: string, defaultValue: T): T {
    if (!this.isBrowser) return defaultValue;
    try {
      const key = this.getKey(baseKey);
      const data = localStorage.getItem(key);
      if (!data) return defaultValue;
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private set<T>(baseKey: string, value: T): void {
    if (!this.isBrowser) return;
    try {
      const key = this.getKey(baseKey);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Erro ao salvar no armazenamento local para a chave ${baseKey}:`, e);
    }
  }

  // Profile
  getProfile(): UserProfile {
    const prof = this.get<UserProfile>('profile', INITIAL_PROFILE);
    const sessions = this.getSessions();
    const computedStreak = calculateStreakFromSessions(sessions);
    if (prof.streakDays !== computedStreak) {
      prof.streakDays = computedStreak;
      // Persist corrected streak
      this.set('profile', prof);
      const uid = this.getActiveUserId();
      if (uid) {
        CloudSyncService.saveProfile(uid, prof).catch(console.error);
      }
    }
    return prof;
  }

  saveProfile(profile: UserProfile): void {
    const sessions = this.getSessions();
    profile.streakDays = calculateStreakFromSessions(sessions);
    this.set('profile', profile);
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveProfile(uid, profile).catch(console.error);
    }
  }

  addXP(amount: number): { newXP: number; newLevel: number; leveledUp: boolean } {
    const profile = this.getProfile();
    const oldLevel = profile.level;
    const newXP = profile.xp + amount;
    // Level formula: Level = floor(XP / 200) + 1
    const newLevel = Math.floor(newXP / 200) + 1;
    const leveledUp = newLevel > oldLevel;

    profile.xp = newXP;
    profile.level = newLevel;
    this.saveProfile(profile);
    return { newXP, newLevel, leveledUp };
  }

  // Subjects
  getSubjects(): Subject[] {
    return this.get<Subject[]>('subjects', []);
  }

  saveSubjects(subjects: Subject[]): void {
    this.set('subjects', subjects);
  }

  getSubject(id: string): Subject | undefined {
    return this.getSubjects().find((s) => s.id === id);
  }

  saveSubject(subject: Subject): void {
    const list = this.getSubjects();
    const index = list.findIndex((s) => s.id === subject.id);
    if (index >= 0) {
      list[index] = subject;
    } else {
      list.push(subject);
    }
    this.saveSubjects(list);

    // Sync to Firestore
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveSubject(uid, subject).catch(console.error);
    }
  }

  saveMultipleSubjects(newSubjects: Subject[]): void {
    const list = this.getSubjects();
    newSubjects.forEach((sub) => {
      const index = list.findIndex(
        (s) => s.id === sub.id || (s.name.toLowerCase() === sub.name.toLowerCase() && s.semester === sub.semester)
      );
      if (index >= 0) {
        list[index] = { ...list[index], ...sub };
      } else {
        list.push(sub);
      }
    });
    this.saveSubjects(list);

    // Sync each to Firestore
    const uid = this.getActiveUserId();
    if (uid) {
      newSubjects.forEach((sub) => {
        CloudSyncService.saveSubject(uid, sub).catch(console.error);
      });
    }
  }

  deleteSubject(id: string): { removedTopics: number; removedTasks: number; removedCards: number } {
    const subjects = this.getSubjects().filter((s) => s.id !== id);
    this.saveSubjects(subjects);

    // Cascade delete or decouple tasks, flashcards
    const tasks = this.getTasks();
    const remainingTasks = tasks.filter((t) => t.subjectId !== id);
    const removedTasks = tasks.length - remainingTasks.length;
    this.saveTasks(remainingTasks);

    const cards = this.getFlashcards();
    const remainingCards = cards.filter((c) => c.subjectId !== id);
    const removedCards = cards.length - remainingCards.length;
    this.saveFlashcards(remainingCards);

    // Delete in Firestore
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.deleteSubject(uid, id).catch(console.error);
    }

    return { removedTopics: 0, removedTasks, removedCards };
  }

  // Tasks
  getTasks(): Task[] {
    return this.get<Task[]>('tasks', []);
  }

  saveTasks(tasks: Task[]): void {
    this.set('tasks', tasks);
  }

  saveTask(task: Task): void {
    const list = this.getTasks();
    const idx = list.findIndex((t) => t.id === task.id);
    if (idx >= 0) {
      list[idx] = task;
    } else {
      list.push(task);
    }
    this.saveTasks(list);

    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveTask(uid, task).catch(console.error);
    }
  }

  deleteTask(id: string): void {
    this.saveTasks(this.getTasks().filter((t) => t.id !== id));
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.deleteTask(uid, id).catch(console.error);
    }
  }

  // Sessions
  getSessions(): StudySession[] {
    return this.get<StudySession[]>('sessions', []);
  }

  recalculateStreak(): number {
    const sessions = this.getSessions();
    const streak = calculateStreakFromSessions(sessions);
    const profile = this.get<UserProfile>('profile', INITIAL_PROFILE);
    if (profile.streakDays !== streak) {
      profile.streakDays = streak;
      this.set('profile', profile);
      const uid = this.getActiveUserId();
      if (uid) {
        CloudSyncService.saveProfile(uid, profile).catch(console.error);
      }
    }
    return streak;
  }

  saveSessions(sessions: StudySession[]): void {
    this.set('sessions', sessions);
    this.recalculateStreak();
  }

  saveSession(session: StudySession): void {
    const list = this.getSessions();
    list.unshift(session);
    this.set('sessions', list);

    // Update subject studied time
    if (session.subjectId) {
      const subject = this.getSubject(session.subjectId);
      if (subject) {
        subject.studyTimeMinutes = (subject.studyTimeMinutes || 0) + session.durationMinutes;
        this.saveSubject(subject);
      }
    }

    // Award XP
    this.addXP(session.xpEarned || 50);

    // Recalculate streak
    this.recalculateStreak();

    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveSession(uid, session).catch(console.error);
    }
  }

  // Flashcards
  getFlashcards(): Flashcard[] {
    return this.get<Flashcard[]>('flashcards', []);
  }

  saveFlashcards(cards: Flashcard[]): void {
    this.set('flashcards', cards);
  }

  saveFlashcard(card: Flashcard): void {
    const list = this.getFlashcards();
    const idx = list.findIndex((c) => c.id === card.id);
    if (idx >= 0) {
      list[idx] = card;
    } else {
      list.push(card);
    }
    this.saveFlashcards(list);

    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveFlashcard(uid, card).catch(console.error);
    }
  }

  deleteFlashcard(id: string): void {
    this.saveFlashcards(this.getFlashcards().filter((c) => c.id !== id));
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.deleteFlashcard(uid, id).catch(console.error);
    }
  }

  // Quizzes
  getQuizzes(): QuizAttempt[] {
    return this.get<QuizAttempt[]>('quizzes', []);
  }

  saveQuizzes(quizzes: QuizAttempt[]): void {
    this.set('quizzes', quizzes);
  }

  saveQuizAttempt(attempt: QuizAttempt): void {
    const list = this.getQuizzes();
    list.unshift(attempt);
    this.set('quizzes', list);
    this.addXP(Math.round((attempt.scorePercent / 100) * 150) + 50);

    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveQuizAttempt(uid, attempt).catch(console.error);
    }
  }

  // AI Materials
  getAiMaterials(): AiMaterial[] {
    return this.get<AiMaterial[]>('ai_materials', []);
  }

  saveAiMaterials(materials: AiMaterial[]): void {
    this.set('ai_materials', materials);
  }

  saveAiMaterial(material: AiMaterial): void {
    const list = this.getAiMaterials();
    const idx = list.findIndex((m) => m.id === material.id);
    if (idx >= 0) {
      list[idx] = material;
    } else {
      list.unshift(material);
    }
    this.saveAiMaterials(list);

    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveAiMaterial(uid, material).catch(console.error);
    }
  }

  deleteAiMaterial(id: string): void {
    this.saveAiMaterials(this.getAiMaterials().filter((m) => m.id !== id));
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.deleteAiMaterial(uid, id).catch(console.error);
    }
  }

  // Calendar
  getCalendarEvents(): CalendarEvent[] {
    return this.get<CalendarEvent[]>('calendar', []);
  }

  saveCalendarEvents(events: CalendarEvent[]): void {
    this.set('calendar', events);
  }

  saveCalendarEvent(event: CalendarEvent): void {
    const list = this.getCalendarEvents();
    const idx = list.findIndex((e) => e.id === event.id);
    if (idx >= 0) {
      list[idx] = event;
    } else {
      list.push(event);
    }
    this.saveCalendarEvents(list);

    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveCalendarEvent(uid, event).catch(console.error);
    }
  }

  deleteCalendarEvent(id: string): void {
    this.saveCalendarEvents(this.getCalendarEvents().filter((e) => e.id !== id));
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.deleteCalendarEvent(uid, id).catch(console.error);
    }
  }

  // Habits
  getHabits(): Habit[] {
    return this.get<Habit[]>('habits', []);
  }

  saveHabits(habits: Habit[]): void {
    this.set('habits', habits);
    const uid = this.getActiveUserId();
    if (uid) {
      for (const h of habits) {
        CloudSyncService.saveHabit(uid, h).catch(console.error);
      }
    }
  }

  saveHabit(habit: Habit): void {
    const list = this.getHabits();
    const idx = list.findIndex((h) => h.id === habit.id);
    if (idx >= 0) {
      list[idx] = habit;
    } else {
      list.push(habit);
    }
    this.saveHabits(list);
  }

  deleteHabit(id: string): void {
    this.saveHabits(this.getHabits().filter((h) => h.id !== id));
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.deleteHabit(uid, id).catch(console.error);
    }
  }

  toggleHabitToday(id: string): Habit | undefined {
    const habits = this.getHabits();
    const habit = habits.find((h) => h.id === id);
    if (!habit) return undefined;

    const todayStr = new Date().toISOString().split('T')[0];
    const exists = habit.completions.includes(todayStr);

    if (exists) {
      habit.completions = habit.completions.filter((d) => d !== todayStr);
    } else {
      habit.completions.push(todayStr);
      this.addXP(25);
    }

    // Recalculate streak
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      if (habit.completions.includes(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    habit.streakDays = streak;

    this.saveHabits(habits);
    return habit;
  }

  // Quick Notes
  getNotes(): QuickNote[] {
    return this.get<QuickNote[]>('notes', []);
  }

  saveNotes(notes: QuickNote[]): void {
    this.set('notes', notes);
  }

  saveNote(note: QuickNote): void {
    const list = this.getNotes();
    const idx = list.findIndex((n) => n.id === note.id);
    if (idx >= 0) {
      list[idx] = note;
    } else {
      list.unshift(note);
    }
    this.saveNotes(list);

    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveNote(uid, note).catch(console.error);
    }
  }

  deleteNote(id: string): void {
    this.saveNotes(this.getNotes().filter((n) => n.id !== id));
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.deleteNote(uid, id).catch(console.error);
    }
  }

  // Study Videos
  getVideos(): StudyVideo[] {
    return this.get<StudyVideo[]>('videos', []);
  }

  saveVideos(videos: StudyVideo[]): void {
    this.set('videos', videos);
  }

  saveVideo(video: StudyVideo): void {
    const list = this.getVideos();
    const idx = list.findIndex((v) => v.id === video.id);
    if (idx >= 0) {
      list[idx] = video;
    } else {
      list.unshift(video);
    }
    this.saveVideos(list);

    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.saveVideo(uid, video).catch(console.error);
    }
  }

  deleteVideo(id: string): void {
    this.saveVideos(this.getVideos().filter((v) => v.id !== id));
    const uid = this.getActiveUserId();
    if (uid) {
      CloudSyncService.deleteVideo(uid, id).catch(console.error);
    }
  }

  // Spaced Repetition Logic (Active Recall)
  evaluateActiveRecall(
    currentIntervalDays: number,
    currentRepetitionCount: number,
    currentMastery: number,
    rating: ActiveRecallRating
  ): { nextIntervalDays: number; newRepetitionCount: number; newMastery: number; nextDateStr: string } {
    let nextIntervalDays: number;
    let newRepetitionCount: number;
    let newMastery: number;

    if (rating < 3) {
      // Failed recall
      newRepetitionCount = 0;
      nextIntervalDays = 1;
      newMastery = Math.max(10, currentMastery - (rating === 1 ? 30 : 15));
    } else {
      // Successful recall (3, 4, or 5)
      newRepetitionCount = currentRepetitionCount + 1;
      if (newRepetitionCount === 1) {
        nextIntervalDays = 1;
      } else if (newRepetitionCount === 2) {
        nextIntervalDays = rating === 5 ? 4 : 3;
      } else {
        const factor = rating === 5 ? 2.5 : rating === 4 ? 2.0 : 1.5;
        nextIntervalDays = Math.min(60, Math.round(currentIntervalDays * factor));
      }
      const gain = rating === 5 ? 25 : rating === 4 ? 18 : 10;
      newMastery = Math.min(100, currentMastery + gain);
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextIntervalDays);
    const nextDateStr = nextDate.toISOString().split('T')[0];

    return {
      nextIntervalDays,
      newRepetitionCount,
      newMastery,
      nextDateStr,
    };
  }

  // Update Topic Review Status
  recordTopicReview(topicId: string, rating: ActiveRecallRating): Topic | undefined {
    const subjects = this.getSubjects();
    let foundTopic: Topic | undefined;

    for (const sub of subjects) {
      const topic = sub.topics.find((t) => t.id === topicId);
      if (topic) {
        const result = this.evaluateActiveRecall(
          topic.reviewIntervalDays || 1,
          topic.repetitionCount || 0,
          topic.masteryLevel || 0,
          rating
        );

        topic.lastReviewedAt = new Date().toISOString();
        topic.nextReviewDate = result.nextDateStr;
        topic.reviewIntervalDays = result.nextIntervalDays;
        topic.repetitionCount = result.newRepetitionCount;
        topic.masteryLevel = result.newMastery;
        topic.progressPercent = Math.min(100, Math.round((result.newMastery + 100) / 2));

        foundTopic = topic;
        this.saveSubject(sub);
        break;
      }
    }

    if (foundTopic) {
      this.addXP(40);
    }
    return foundTopic;
  }

  // Deterministic Prioritization Engine: "O que estudar agora"
  calculatePriorities(): PriorityRecommendation[] {
    const subjects = this.getSubjects().filter((s) => s.status === 'cursando');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recommendations: PriorityRecommendation[] = [];

    subjects.forEach((subject) => {
      let closestExamDays: number | undefined;
      let closestExamTitle: string | undefined;

      if (subject.exams && subject.exams.length > 0) {
        const upcomingExams = subject.exams
          .map((e) => {
            const examDate = new Date(e.date + 'T00:00:00');
            const diffDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return { exam: e, diffDays };
          })
          .filter((item) => item.diffDays >= 0)
          .sort((a, b) => a.diffDays - b.diffDays);

        if (upcomingExams.length > 0) {
          closestExamDays = upcomingExams[0].diffDays;
          closestExamTitle = upcomingExams[0].exam.title;
        }
      }

      subject.topics.forEach((topic) => {
        let score = 50;
        const reasons: string[] = [];

        // 1. Proximity of Exam
        if (closestExamDays !== undefined) {
          if (closestExamDays <= 3) {
            score += 35;
            reasons.push(`Prova próxima (${closestExamDays === 0 ? 'HOJE' : `em ${closestExamDays} dias`}: ${closestExamTitle})`);
          } else if (closestExamDays <= 7) {
            score += 25;
            reasons.push(`Prova nesta semana (${closestExamDays} dias: ${closestExamTitle})`);
          } else if (closestExamDays <= 14) {
            score += 15;
            reasons.push(`Prova em ${closestExamDays} dias`);
          }
        }

        // 2. Mastery level & Difficulty
        if (topic.masteryLevel < 40) {
          score += 25;
          reasons.push(`Baixo domínio atual (${topic.masteryLevel}%)`);
        } else if (topic.masteryLevel < 70) {
          score += 12;
          reasons.push(`Domínio intermediário (${topic.masteryLevel}%)`);
        }

        if (topic.difficulty === 'dificil') {
          score += 15;
          reasons.push('Conteúdo com alta complexidade');
        } else if (topic.difficulty === 'medio') {
          score += 8;
        }

        // 3. Spaced repetition due / overdue
        let daysSinceLastReview: number | undefined;
        if (topic.lastReviewedAt) {
          const lastDate = new Date(topic.lastReviewedAt);
          daysSinceLastReview = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        }

        if (topic.nextReviewDate) {
          const reviewDate = new Date(topic.nextReviewDate + 'T00:00:00');
          const diffDays = Math.ceil((reviewDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) {
            score += 25;
            reasons.push(`Revisão espaçada ATRASADA em ${Math.abs(diffDays)} dia(s)`);
          } else if (diffDays === 0) {
            score += 18;
            reasons.push('Revisão espaçada prevista para HOJE');
          }
        } else if (!topic.lastReviewedAt) {
          score += 15;
          reasons.push('Conteúdo novo ainda não revisado');
        }

        // 4. Subject priority & Academic Need
        if (subject.priority === 'urgent') {
          score += 15;
          reasons.push('Disciplina marcada com prioridade Urgente');
        } else if (subject.priority === 'high') {
          score += 10;
        }

        if (subject.currentGrade !== undefined && subject.minPassingGrade !== undefined) {
          if (subject.currentGrade < subject.minPassingGrade) {
            score += 20;
            reasons.push(`Média abaixo do mínimo (${subject.currentGrade} < ${subject.minPassingGrade})`);
          }
        }

        const finalScore = Math.min(100, Math.max(10, Math.round(score)));

        recommendations.push({
          topicId: topic.id,
          subjectId: subject.id,
          topicTitle: topic.title,
          subjectName: subject.name,
          subjectColor: subject.color,
          priorityScore: finalScore,
          reasons,
          daysUntilExam: closestExamDays,
          daysSinceLastReview,
          masteryLevel: topic.masteryLevel,
          difficulty: topic.difficulty,
          estimatedMinutes: topic.estimatedMinutes,
          examTitle: closestExamTitle,
        });
      });
    });

    return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  // Backup Export: Returns clean JSON representation without secrets
  exportFullBackup(): string {
    const backup: BackupData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'StarStudy',
      profile: this.getProfile(),
      subjects: this.getSubjects(),
      tasks: this.getTasks(),
      sessions: this.getSessions(),
      flashcards: this.getFlashcards(),
      quizzes: this.getQuizzes(),
      aiMaterials: this.getAiMaterials(),
      calendarEvents: this.getCalendarEvents(),
      habits: this.getHabits(),
      notes: this.getNotes(),
      videos: this.getVideos(),
    };

    return JSON.stringify(backup, null, 2);
  }

  // Backup Validation
  validateBackup(jsonString: string): { valid: boolean; error?: string; data?: BackupData } {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object') {
        return { valid: false, error: 'O arquivo não contém um objeto JSON válido.' };
      }
      if (!parsed.appName || !parsed.version) {
        return { valid: false, error: 'Formato incompatível: cabeçalho do StarStudy não identificado.' };
      }
      if (!Array.isArray(parsed.subjects)) {
        return { valid: false, error: 'Estrutura inválida: lista de matérias ausente ou corrompida.' };
      }
      return { valid: true, data: parsed as BackupData };
    } catch (err: any) {
      return { valid: false, error: `Falha ao interpretar JSON: ${err?.message || 'Arquivo corrompido'}` };
    }
  }

  // Backup Import with merge or replace
  importBackup(backup: BackupData, mode: 'replace' | 'merge'): void {
    if (mode === 'replace') {
      if (backup.profile) this.saveProfile(backup.profile);
      this.saveSubjects(backup.subjects || []);
      this.saveTasks(backup.tasks || []);
      this.saveSessions(backup.sessions || []);
      this.saveFlashcards(backup.flashcards || []);
      this.saveQuizzes(backup.quizzes || []);
      this.saveAiMaterials(backup.aiMaterials || []);
      this.saveCalendarEvents(backup.calendarEvents || []);
      this.saveHabits(backup.habits || []);
      this.saveNotes(backup.notes || []);
      this.saveVideos(backup.videos || []);
    } else {
      const mergeById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
        const map = new Map<string, T>();
        current.forEach((item) => map.set(item.id, item));
        incoming.forEach((item) => map.set(item.id, item));
        return Array.from(map.values());
      };

      this.saveSubjects(mergeById(this.getSubjects(), backup.subjects || []));
      this.saveTasks(mergeById(this.getTasks(), backup.tasks || []));
      this.saveFlashcards(mergeById(this.getFlashcards(), backup.flashcards || []));
      this.saveCalendarEvents(mergeById(this.getCalendarEvents(), backup.calendarEvents || []));
      this.saveHabits(mergeById(this.getHabits(), backup.habits || []));
      this.saveNotes(mergeById(this.getNotes(), backup.notes || []));
      this.saveVideos(mergeById(this.getVideos(), backup.videos || []));

      const allSessions = [...this.getSessions(), ...(backup.sessions || [])];
      this.saveSessions(allSessions);

      const allMaterials = mergeById(this.getAiMaterials(), backup.aiMaterials || []);
      this.saveAiMaterials(allMaterials);
    }
  }

  // Clear all local data for the active user
  resetDatabase(): void {
    if (!this.isBrowser) return;
    const keys = [
      'profile',
      'subjects',
      'tasks',
      'sessions',
      'flashcards',
      'quizzes',
      'ai_materials',
      'calendar',
      'habits',
      'notes',
      'videos',
    ];
    for (const k of keys) {
      localStorage.removeItem(this.getKey(k));
    }
  }
}

export const db = new LocalDatabase();
