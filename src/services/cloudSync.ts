import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import {
  firestore,
  auth,
  handleFirestoreError,
  OperationType
} from './firebase';
import { db } from './storage';
import {
  BackupData,
  Subject,
  Task,
  Flashcard,
  StudySession,
  QuickNote,
  AiMaterial,
  CalendarEvent,
  Habit,
  StudyVideo,
  QuizAttempt,
  UserProfile
} from '../types';

export class CloudSyncService {
  // Sync individual items to Firestore
  static async saveSubject(userId: string, subject: Subject): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'subjects', subject.id);
      await setDoc(ref, { ...subject, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar matéria no Firestore:', err);
    }
  }

  static async deleteSubject(userId: string, subjectId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'subjects', subjectId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Erro ao deletar matéria no Firestore:', err);
    }
  }

  static async saveAiMaterial(userId: string, material: AiMaterial): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'aiMaterials', material.id);
      await setDoc(ref, { ...material, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar material de estudo no Firestore:', err);
    }
  }

  static async deleteAiMaterial(userId: string, materialId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'aiMaterials', materialId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Erro ao excluir material no Firestore:', err);
    }
  }

  static async saveTask(userId: string, task: Task): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'tasks', task.id);
      await setDoc(ref, { ...task, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar tarefa no Firestore:', err);
    }
  }

  static async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'tasks', taskId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Erro ao excluir tarefa no Firestore:', err);
    }
  }

  static async saveFlashcard(userId: string, card: Flashcard): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'flashcards', card.id);
      await setDoc(ref, { ...card, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar flashcard no Firestore:', err);
    }
  }

  static async deleteFlashcard(userId: string, cardId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'flashcards', cardId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Erro ao excluir flashcard no Firestore:', err);
    }
  }

  static async saveNote(userId: string, note: QuickNote): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'notes', note.id);
      await setDoc(ref, { ...note, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar nota no Firestore:', err);
    }
  }

  static async deleteNote(userId: string, noteId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'notes', noteId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Erro ao excluir nota no Firestore:', err);
    }
  }

  static async saveSession(userId: string, session: StudySession): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'sessions', session.id);
      await setDoc(ref, { ...session, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar sessão no Firestore:', err);
    }
  }

  static async saveCalendarEvent(userId: string, event: CalendarEvent): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'events', event.id);
      await setDoc(ref, { ...event, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar evento no Firestore:', err);
    }
  }

  static async deleteCalendarEvent(userId: string, eventId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'events', eventId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Erro ao excluir evento no Firestore:', err);
    }
  }

  static async saveHabit(userId: string, habit: Habit): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'habits', habit.id);
      await setDoc(ref, { ...habit, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar hábito no Firestore:', err);
    }
  }

  static async deleteHabit(userId: string, habitId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'habits', habitId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Erro ao excluir hábito no Firestore:', err);
    }
  }

  static async saveVideo(userId: string, video: StudyVideo): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'videos', video.id);
      await setDoc(ref, { ...video, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar vídeo no Firestore:', err);
    }
  }

  static async deleteVideo(userId: string, videoId: string): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'videos', videoId);
      await deleteDoc(ref);
    } catch (err) {
      console.error('Erro ao excluir vídeo no Firestore:', err);
    }
  }

  static async saveQuizAttempt(userId: string, quiz: QuizAttempt): Promise<void> {
    try {
      const ref = doc(firestore, 'users', userId, 'quizzes', quiz.id);
      await setDoc(ref, { ...quiz, userId }, { merge: true });
    } catch (err) {
      console.error('Erro ao salvar tentativa de simulado no Firestore:', err);
    }
  }

  static async saveProfile(userId: string, profile: UserProfile): Promise<void> {
    try {
      const userRef = doc(firestore, 'users', userId);
      await setDoc(
        userRef,
        {
          userId,
          name: profile.name || 'Estudante',
          course: profile.course || '',
          university: profile.university || '',
          currentSemester: profile.currentSemester || 1,
          dailyGoalMinutes: profile.dailyGoalMinutes || 120,
          weeklyGoalMinutes: profile.weeklyGoalMinutes || 600,
          xp: profile.xp || 0,
          level: profile.level || 1,
          streakDays: profile.streakDays || 0,
          lastActiveDate: profile.lastActiveDate || new Date().toISOString().split('T')[0],
          darkMode: profile.darkMode || false,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (err) {
      console.error('Erro ao salvar perfil no Firestore:', err);
    }
  }

  // Upload all records from local DB to cloud for this user
  static async uploadAllToCloud(user: User): Promise<void> {
    const userId = user.uid;
    const backupStr = db.exportFullBackup();
    const backup: BackupData = JSON.parse(backupStr);

    try {
      // 1. User Profile Document
      await this.saveProfile(userId, {
        ...backup.profile,
        name: user.displayName || backup.profile.name || user.email?.split('@')[0] || 'Estudante',
      });

      // 2. Subjects
      for (const sub of backup.subjects || []) {
        await this.saveSubject(userId, sub);
      }

      // 3. Tasks
      for (const task of backup.tasks || []) {
        await this.saveTask(userId, task);
      }

      // 4. Flashcards
      for (const fc of backup.flashcards || []) {
        await this.saveFlashcard(userId, fc);
      }

      // 5. Notes
      for (const note of backup.notes || []) {
        await this.saveNote(userId, note);
      }

      // 6. Sessions
      for (const sess of backup.sessions || []) {
        await this.saveSession(userId, sess);
      }

      // 7. AI Materials
      for (const mat of backup.aiMaterials || []) {
        await this.saveAiMaterial(userId, mat);
      }

      // 8. Calendar Events
      for (const ev of backup.calendarEvents || []) {
        await this.saveCalendarEvent(userId, ev);
      }

      // 9. Habits
      for (const hab of backup.habits || []) {
        await this.saveHabit(userId, hab);
      }

      // 10. Videos
      for (const vid of backup.videos || []) {
        await this.saveVideo(userId, vid);
      }

      // 11. Quizzes
      for (const qz of backup.quizzes || []) {
        await this.saveQuizAttempt(userId, qz);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    }
  }

  // Download all records from Firestore to local DB for this user
  static async downloadAllFromCloud(user: User): Promise<{ isNewUser: boolean; count: number }> {
    const userId = user.uid;

    try {
      // 1. Check user profile doc
      const userDocRef = doc(firestore, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);

      // 2. Subjects
      const subjectsSnap = await getDocs(collection(firestore, 'users', userId, 'subjects'));
      const cloudSubjects: Subject[] = [];
      subjectsSnap.forEach((d) => {
        cloudSubjects.push(d.data() as Subject);
      });

      // 3. Tasks
      const tasksSnap = await getDocs(collection(firestore, 'users', userId, 'tasks'));
      const cloudTasks: Task[] = [];
      tasksSnap.forEach((d) => {
        cloudTasks.push(d.data() as Task);
      });

      // 4. Flashcards
      const fcSnap = await getDocs(collection(firestore, 'users', userId, 'flashcards'));
      const cloudCards: Flashcard[] = [];
      fcSnap.forEach((d) => {
        cloudCards.push(d.data() as Flashcard);
      });

      // 5. Notes
      const notesSnap = await getDocs(collection(firestore, 'users', userId, 'notes'));
      const cloudNotes: QuickNote[] = [];
      notesSnap.forEach((d) => {
        cloudNotes.push(d.data() as QuickNote);
      });

      // 6. Sessions
      const sessSnap = await getDocs(collection(firestore, 'users', userId, 'sessions'));
      const cloudSessions: StudySession[] = [];
      sessSnap.forEach((d) => {
        cloudSessions.push(d.data() as StudySession);
      });

      // 7. AI Materials
      const matSnap = await getDocs(collection(firestore, 'users', userId, 'aiMaterials'));
      const cloudMaterials: AiMaterial[] = [];
      matSnap.forEach((d) => {
        cloudMaterials.push(d.data() as AiMaterial);
      });

      // 8. Calendar Events
      const evSnap = await getDocs(collection(firestore, 'users', userId, 'events'));
      const cloudEvents: CalendarEvent[] = [];
      evSnap.forEach((d) => {
        cloudEvents.push(d.data() as CalendarEvent);
      });

      // 9. Habits
      const habSnap = await getDocs(collection(firestore, 'users', userId, 'habits'));
      const cloudHabits: Habit[] = [];
      habSnap.forEach((d) => {
        cloudHabits.push(d.data() as Habit);
      });

      // 10. Videos
      const vidSnap = await getDocs(collection(firestore, 'users', userId, 'videos'));
      const cloudVideos: StudyVideo[] = [];
      vidSnap.forEach((d) => {
        cloudVideos.push(d.data() as StudyVideo);
      });

      // 11. Quizzes
      const qzSnap = await getDocs(collection(firestore, 'users', userId, 'quizzes'));
      const cloudQuizzes: QuizAttempt[] = [];
      qzSnap.forEach((d) => {
        cloudQuizzes.push(d.data() as QuizAttempt);
      });

      const totalItems =
        cloudSubjects.length +
        cloudTasks.length +
        cloudCards.length +
        cloudNotes.length +
        cloudSessions.length +
        cloudMaterials.length +
        cloudEvents.length +
        cloudHabits.length +
        cloudVideos.length +
        cloudQuizzes.length;

      const isNewUser = !userDocSnap.exists() && totalItems === 0;

      if (userDocSnap.exists()) {
        const uData = userDocSnap.data();
        db.saveProfile({
          name: uData.name || user.displayName || user.email?.split('@')[0] || 'Estudante',
          course: uData.course || '',
          university: uData.university || '',
          currentSemester: uData.currentSemester || 1,
          dailyGoalMinutes: uData.dailyGoalMinutes || 120,
          weeklyGoalMinutes: uData.weeklyGoalMinutes || 600,
          xp: uData.xp || 0,
          level: uData.level || 1,
          streakDays: uData.streakDays || 0,
          lastActiveDate: uData.lastActiveDate || new Date().toISOString().split('T')[0],
          darkMode: uData.darkMode || false,
        });
      } else {
        // Register initial clean profile document in Firestore
        await this.saveProfile(userId, {
          name: user.displayName || user.email?.split('@')[0] || 'Estudante',
          course: '',
          university: '',
          currentSemester: 1,
          dailyGoalMinutes: 120,
          weeklyGoalMinutes: 600,
          xp: 0,
          level: 1,
          streakDays: 0,
          lastActiveDate: new Date().toISOString().split('T')[0],
          darkMode: false,
        });
      }

      // Helper to merge cloud and local collections safely without data loss on refresh
      const mergeAndSync = <T extends { id: string }>(
        cloudItems: T[],
        localItems: T[],
        syncToCloudFn: (item: T) => Promise<void>
      ): T[] => {
        const itemMap = new Map<string, T>();
        // Add cloud items first
        cloudItems.forEach((c) => itemMap.set(c.id, c));
        // Add any local items that might have been saved locally but not yet in cloud
        localItems.forEach((loc) => {
          if (!itemMap.has(loc.id)) {
            itemMap.set(loc.id, loc);
            syncToCloudFn(loc).catch((err) =>
              console.warn('Auto-syncing local item to cloud:', err)
            );
          }
        });
        return Array.from(itemMap.values());
      };

      // Safely merge and update local storage without wiping newly created items
      const finalSubjects = mergeAndSync(cloudSubjects, db.getSubjects(), (i) =>
        this.saveSubject(userId, i)
      );
      const finalTasks = mergeAndSync(cloudTasks, db.getTasks(), (i) =>
        this.saveTask(userId, i)
      );
      const finalCards = mergeAndSync(cloudCards, db.getFlashcards(), (i) =>
        this.saveFlashcard(userId, i)
      );
      const finalNotes = mergeAndSync(cloudNotes, db.getNotes(), (i) =>
        this.saveNote(userId, i)
      );
      const finalSessions = mergeAndSync(cloudSessions, db.getSessions(), (i) =>
        this.saveSession(userId, i)
      );
      const finalMaterials = mergeAndSync(cloudMaterials, db.getAiMaterials(), (i) =>
        this.saveAiMaterial(userId, i)
      );
      const finalEvents = mergeAndSync(cloudEvents, db.getCalendarEvents(), (i) =>
        this.saveCalendarEvent(userId, i)
      );
      const finalHabits = mergeAndSync(cloudHabits, db.getHabits(), (i) =>
        this.saveHabit(userId, i)
      );
      const finalVideos = mergeAndSync(cloudVideos, db.getVideos(), (i) =>
        this.saveVideo(userId, i)
      );
      const finalQuizzes = mergeAndSync(cloudQuizzes, db.getQuizzes(), (i) =>
        this.saveQuizAttempt(userId, i)
      );

      db.saveSubjects(finalSubjects);
      db.saveTasks(finalTasks);
      db.saveFlashcards(finalCards);
      db.saveNotes(finalNotes);
      db.saveSessions(finalSessions);
      db.saveAiMaterials(finalMaterials);
      db.saveCalendarEvents(finalEvents);
      db.saveHabits(finalHabits);
      db.saveVideos(finalVideos);
      db.saveQuizzes(finalQuizzes);

      return { isNewUser, count: totalItems };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`);
      return { isNewUser: false, count: 0 };
    }
  }
}
