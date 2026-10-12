import { AiToolType, QuizQuestion } from '../types';

export interface HealthCheckResponse {
  status: string;
  hasGeminiKey: boolean;
  model: string;
  timestamp: string;
}

export interface AiToolResponse {
  result: string;
  toolType: AiToolType;
  generatedAt: string;
}

export interface PlannerProposedEvent {
  title: string;
  category: 'estudo' | 'prova' | 'trabalho' | 'aula' | 'revisao';
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subjectId?: string;
  description?: string;
}

export interface PlannerResponse {
  summary: string;
  warnings?: string[];
  proposedEvents: PlannerProposedEvent[];
}

export interface SuggestedTopicImport {
  title: string;
  subtopics: string[];
  difficulty: 'facil' | 'medio' | 'dificil';
  estimatedMinutes: number;
  keyConcepts: string[];
  learningObjectives?: string[];
  reviewQuestions?: string[];
}

export interface MaterialImportResponse {
  summary: string;
  suggestedTopics: SuggestedTopicImport[];
}

export class GeminiService {
  // Check backend and key status
  static async checkHealth(): Promise<HealthCheckResponse> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Falha no status do servidor');
      return await res.json();
    } catch {
      return {
        status: 'error',
        hasGeminiKey: false,
        model: 'gemini-3.8-flash',
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Execute one of the 20 AI tools
  static async executeTool20(params: {
    toolType: AiToolType;
    subjectName: string;
    topicTitle?: string;
    customInstructions?: string;
    contextData?: any;
  }): Promise<AiToolResponse> {
    const res = await fetch('/api/gemini/tool-20', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao processar ferramenta de IA no servidor.');
    }
    return data;
  }

  // Interpret natural language timetable
  static async planSchedule(params: {
    userInput: string;
    subjects: any[];
    dailyGoalMinutes?: number;
  }): Promise<PlannerResponse> {
    const res = await fetch('/api/gemini/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao processar rotina com IA.');
    }
    return data;
  }

  // AI Assisted Material Import
  static async importMaterial(params: {
    textContent: string;
    subjectName: string;
  }): Promise<MaterialImportResponse> {
    const res = await fetch('/api/gemini/import-material', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao analisar material acadêmico.');
    }
    return data;
  }

  // Generate quiz questions
  static async generateQuiz(params: {
    subjectName: string;
    topics: string[];
    questionCount: number;
  }): Promise<{ questions: QuizQuestion[] }> {
    const res = await fetch('/api/gemini/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao gerar questões de simulado.');
    }
    return data;
  }

  // Fallback template generator for offline/manual mode
  static generateManualTemplate(toolType: AiToolType, subject: string, topic: string): string {
    const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'full' }).format(new Date());
    return `### 📘 ${subject.toUpperCase()} — ${topic}
*Gerado em modo manual em ${date}*

---

#### 1. Conceito Central
- Defina o princípio fundamental deste assunto.
- Qual problema esse tópico resolve na disciplina?

#### 2. Tópicos e Elementos Essenciais
1. **Fundamento Teórico**: Princípios, teoremas ou definições axiomáticas.
2. **Procedimento Prático**: Passo a passo de resolução ou implementação.
3. **Casos Limite e Pegadinhas**: Onde a maioria dos alunos erra?

#### 3. Perguntas de Recuperação Ativa (Active Recall)
- [ ] Como explicaria este conceito em menos de 2 minutos sem jargões?
- [ ] Quais são as 3 variáveis ou componentes mais importantes?
- [ ] Como este tópico se conecta com o próximo assunto da ementa?

#### 4. Resumo de Fórmulas e Palavras-chave
- **Termo 1**: Definição concisa
- **Termo 2**: Definição concisa
`;
  }
}
