export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type AcademicStatus = 'cursando' | 'aprovado' | 'reprovado' | 'trancado';

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  subtopics: string[];
  difficulty: 'facil' | 'medio' | 'dificil';
  estimatedMinutes: number;
  masteryLevel: number; // 0 to 100%
  progressPercent: number; // 0 to 100%
  lastReviewedAt?: string; // ISO date
  nextReviewDate?: string; // ISO date
  reviewIntervalDays: number;
  repetitionCount: number;
}

export interface Exam {
  id: string;
  subjectId: string;
  title: string;
  date: string; // YYYY-MM-DD
  weight: number; // e.g. 2, 3, 40%
  grade?: number; // 0 to 10
  coveredTopics: string[];
  notes?: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  professor?: string;
  schedule?: string;
  semester: number; // e.g., 1, 2, 3...
  credits: number;
  color: string; // hex
  difficulty: 'facil' | 'medio' | 'dificil';
  priority: Priority;
  currentGrade?: number;
  targetGrade: number; // e.g., 8.0
  minPassingGrade: number; // e.g., 6.0 or 7.0
  status: AcademicStatus;
  prerequisites?: string[];
  topics: Topic[];
  exams: Exam[];
  studyTimeMinutes: number;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  category: 'trabalho' | 'leitura' | 'exercicio' | 'revisao' | 'projeto' | 'outro';
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  estimatedMinutes: number;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export type PomodoroCycle = 'pomodoro' | 'long' | 'extended';

export interface StudySession {
  id: string;
  subjectId: string;
  topicId?: string;
  date: string; // ISO string
  durationMinutes: number;
  cycleType: PomodoroCycle;
  notes?: string;
  xpEarned: number;
}

export type ActiveRecallRating = 1 | 2 | 3 | 4 | 5;
// 1 = Esqueci completamente
// 2 = Lembrei com muita dificuldade
// 3 = Lembrei parcialmente
// 4 = Lembrei bem
// 5 = Sei perfeitamente

export interface Flashcard {
  id: string;
  subjectId: string;
  topicId?: string;
  topicName?: string;
  front: string;
  back: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  mastery: number; // 0 to 100
  intervalDays: number;
  nextReviewDate: string; // YYYY-MM-DD
  repetitionCount: number;
  lastRating?: ActiveRecallRating;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  topicName: string;
}

export interface QuizAttempt {
  id: string;
  title: string;
  subjectId: string;
  topicIds: string[];
  questions: QuizQuestion[];
  userAnswers: Record<string, number>; // questionId -> selectedIndex
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  scorePercent: number;
  timeSpentSeconds: number;
  createdAt: string;
}

export type AiToolType =
  | 'resumo_inteligente'
  | 'mapa_mental'
  | 'questoes_dissertativas'
  | 'explicacao_simples'
  | 'quiz_relampago'
  | 'cronograma_14dias'
  | 'analise_desempenho'
  | 'plano_preparacao_prova'
  | 'previsao_nota'
  | 'recomendacao_metodo'
  | 'geracao_flashcards'
  | 'conexoes_conteudos'
  | 'roteiro_podcast'
  | 'analogias_criativas'
  | 'mnemonicos'
  | 'planejamento_4semanas'
  | 'correcao_pontos_fracos'
  | 'glossario'
  | 'formulas_conceitos'
  | 'simulado_completo';

export interface AiMaterial {
  id: string;
  title: string;
  type: AiToolType;
  subjectId: string;
  topicId?: string;
  content: string; // Markdown or rich text
  structuredData?: any;
  tags: string[];
  createdAt: string;
}

export type CalendarEventCategory =
  | 'prova'
  | 'trabalho'
  | 'aula'
  | 'estudo'
  | 'revisao'
  | 'prazo'
  | 'compromisso'
  | 'feriado'
  | 'entrega'
  | 'evento';

export interface CalendarEvent {
  id: string;
  title: string;
  category: CalendarEventCategory;
  startDate: string; // YYYY-MM-DDTHH:mm or YYYY-MM-DD
  endDate: string;
  allDay: boolean;
  priority: Priority;
  subjectId?: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'three_times_week' | 'weekly';
  completions: string[]; // List of YYYY-MM-DD dates
  streakDays: number;
  color: string;
  createdAt: string;
}

export interface QuickNote {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudyVideo {
  id: string;
  title: string;
  description?: string;
  subjectId: string;
  url: string;
  platform: 'youtube' | 'external';
  durationMinutes?: number;
  watched: boolean;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  course: string;
  university: string;
  currentSemester: number;
  dailyGoalMinutes: number;
  weeklyGoalMinutes: number;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string;
  darkMode: boolean;
}

export interface PriorityRecommendation {
  topicId: string;
  subjectId: string;
  topicTitle: string;
  subjectName: string;
  subjectColor: string;
  priorityScore: number; // 0 to 100
  reasons: string[];
  daysUntilExam?: number;
  daysSinceLastReview?: number;
  masteryLevel: number;
  difficulty: string;
  estimatedMinutes: number;
  examTitle?: string;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  appName: string;
  profile: UserProfile;
  subjects: Subject[];
  tasks: Task[];
  sessions: StudySession[];
  flashcards: Flashcard[];
  quizzes: QuizAttempt[];
  aiMaterials: AiMaterial[];
  calendarEvents: CalendarEvent[];
  habits: Habit[];
  notes: QuickNote[];
  videos: StudyVideo[];
}
