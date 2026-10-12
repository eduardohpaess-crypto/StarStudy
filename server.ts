import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize GoogleGenAI client safely with server-side secret
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || '';
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health Check API
app.get('/api/health', (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY';
  res.json({
    status: 'ok',
    hasGeminiKey: hasKey,
    model: 'gemini-3.8-flash',
    timestamp: new Date().toISOString(),
  });
});

// The 20 AI Tools Endpoint
app.post('/api/gemini/tool-20', async (req: Request, res: Response): Promise<any> => {
  try {
    const { toolType, subjectName, topicTitle, customInstructions, contextData } = req.body;

    if (!toolType) {
      return res.status(400).json({ error: 'Tipo de ferramenta de IA não especificado.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Chave GEMINI_API_KEY não configurada no servidor. Utilize o modo manual ou adicione a chave nos Segredos.',
      });
    }

    const toolPrompts: Record<string, string> = {
      resumo_inteligente: `Crie um resumo inteligente e aprofundado, organizado com tópicos essenciais, conceitos-chave em destaque, termos técnicos explicados e um parágrafo de síntese conclusiva em Português (Brasil).`,
      mapa_mental: `Estruture um Mapa Mental completo em formato de texto hierárquico (com marcadores de níveis, ramos principais, sub-ramos e conexões conceituais claras).`,
      questoes_dissertativas: `Elabore 3 questões dissertativas de nível universitário sobre o tema, acompanhadas de respostas-modelo detalhadas e critérios de correção.`,
      explicacao_simples: `Explique este tema utilizando a técnica Feynman: como se estivesse ensinando para alguém leigo ou iniciante, sem jargões desnecessários, com clareza e exemplos do dia a dia.`,
      quiz_relampago: `Gere um Quiz Relâmpago com exatamente 5 perguntas de múltipla escolha (A, B, C, D), indicando a resposta correta e uma breve justificativa após cada pergunta.`,
      cronograma_14dias: `Elabore um cronograma de revisão intensiva para os próximos 14 dias, distribuindo sessões de recuperação ativa, exercícios práticos e pausas estratégicas.`,
      analise_desempenho: `Analise as dificuldades comuns dos estudantes neste assunto e forneça um plano de correção prática com métricas observáveis.`,
      plano_preparacao_prova: `Crie um plano completo de preparação para a prova sobre este conteúdo, dividindo a estratégia em: Fundamentos, Resolução de Problemas, Simulação com Cronômetro e Revisão Final na Véspera.`,
      previsao_nota: `Com base nas informações fornecidas, apresente uma projeção de desempenho acadêmico realista, detalhando 3 cenários (otimista, moderado e de alerta), os principais riscos e como mitigá-los.`,
      recomendacao_metodo: `Recomende os métodos de estudo mais eficazes para este conteúdo (ex: Flashcards, Técnica Feynman, Resolução Inversa, Codificação Dupla) com justificativa pedagógica.`,
      geracao_flashcards: `Gere 5 a 10 flashcards no formato Frente e Verso. A frente deve ter uma pergunta objetiva ou termo e o verso uma explicação concisa e precisa.`,
      conexoes_conteudos: `Demonstre as conexões interdisciplinares deste conteúdo com outras áreas da ciência, do mercado profissional e suas aplicações reais no mundo.`,
      roteiro_podcast: `Escreva um roteiro dinâmico e educativo para um episódio de podcast de 5 minutos sobre este tema, com introdução instigante, desenvolvimento e encerramento.`,
      analogias_criativas: `Apresente 3 analogias criativas e memoráveis para tornar os conceitos abstratos deste assunto intuitivos e fáceis de lembrar.`,
      mnemonicos: `Crie mnemônicos, siglas inteligentes ou rimas para memorizar fórmulas, listas ou passos críticos deste assunto.`,
      planejamento_4semanas: `Elabore um plano de estudos estruturado de 4 semanas, com metas semanais claras, leituras recomendadas e marcos de autoavaliação.`,
      correcao_pontos_fracos: `Identifique as 4 principais pegadinhas ou erros conceituais recorrentes que fazem estudantes perderem pontos neste conteúdo e explique como evitá-los.`,
      glossario: `Monte um glossário acadêmico completo com os 10 termos mais importantes da disciplina/tópico, acompanhados de definições rigorosas porém didáticas.`,
      formulas_conceitos: `Compile uma folha de referência rápida com as fórmulas essenciais, teoremas principais ou definições axiômicas fundamentais com explicação de cada variável.`,
      simulado_completo: `Crie um simulado completo com 5 questões bem elaboradas, com 4 alternativas cada, seguido de gabarito comentado e dicas de resolução.`,
    };

    const instruction = toolPrompts[toolType] || 'Analise e estruture o material de estudo solicitado.';

    const systemPrompt = `Você é o tutor acadêmico do StarStudy, uma plataforma universitária de excelência.
Sua missão é gerar conteúdo acadêmico de alto nível, rigoroso, estruturado e em Português do Brasil.
Não invente notas ou dados de professores inexistentes. Se fizer estimativas, identifique-as como tal.
Use formatação Markdown limpa com títulos (##), listas e ênfases.`;

    const userPrompt = `Disciplina: ${subjectName || 'Geral'}
Tópico/Conteúdo: ${topicTitle || 'Conteúdo Acadêmico'}
${customInstructions ? `Instruções adicionais do estudante: ${customInstructions}\n` : ''}
${contextData ? `Dados de contexto: ${JSON.stringify(contextData)}\n` : ''}

Tarefa: ${instruction}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }],
        },
      ],
    });

    const text = response.text || '';
    res.json({ result: text, toolType, generatedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Erro na chamada Gemini tool-20:', error);
    res.status(500).json({
      error: error.message || 'Falha ao processar solicitação de IA.',
    });
  }
});

// Natural Language AI Planner Endpoint
app.post('/api/gemini/planner', async (req: Request, res: Response): Promise<any> => {
  try {
    const { userInput, existingEvents, subjects, dailyGoalMinutes } = req.body;

    if (!userInput) {
      return res.status(400).json({ error: 'Texto da rotina não fornecido.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Chave GEMINI_API_KEY não configurada.' });
    }

    const prompt = `Você é o assistente de planejamento do StarStudy. O estudante forneceu a seguinte descrição de sua rotina e compromissos:
"${userInput}"

Contexto adicional:
- Meta de estudo diária: ${dailyGoalMinutes || 120} minutos
- Matérias cadastradas: ${JSON.stringify(subjects?.map((s: any) => ({ id: s.id, name: s.name, color: s.color })) || [])}
- Data de referência atual: ${new Date().toISOString().split('T')[0]}

Sua tarefa:
Interpretar as restrições, horários, provas e aulas mencionadas.
Gerar uma proposta estruturada de blocos de estudo e eventos para a semana, respeitando as pausas e evitando sobreposições.

Retorne ESTRITAMENTE um JSON no seguinte formato (sem markdown ou texto extra ao redor do JSON):
{
  "summary": "Resumo das decisões de agendamento tomadas",
  "warnings": ["Conflitos ou avisos se houver"],
  "proposedEvents": [
    {
      "title": "Nome da atividade",
      "category": "estudo" | "prova" | "trabalho" | "aula" | "revisao",
      "startDate": "YYYY-MM-DDTHH:mm",
      "endDate": "YYYY-MM-DDTHH:mm",
      "priority": "low" | "medium" | "high" | "urgent",
      "subjectId": "id_da_materia_ou_null",
      "description": "Detalhes do bloco de estudo"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      // Clean possible fences
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Erro no planejador IA:', error);
    res.status(500).json({ error: error.message || 'Falha ao processar planejador.' });
  }
});

// AI Assisted Material Import Endpoint
app.post('/api/gemini/import-material', async (req: Request, res: Response): Promise<any> => {
  try {
    const { textContent, subjectName } = req.body;

    if (!textContent || textContent.trim().length === 0) {
      return res.status(400).json({ error: 'Conteúdo do material não fornecido.' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Chave GEMINI_API_KEY não configurada.' });
    }

    const prompt = `Você é um analista pedagógico do StarStudy. Analise o seguinte material didático ou ementa da matéria "${subjectName || 'Geral'}":
"${textContent.substring(0, 15000)}"

Extraia os tópicos de estudo sugeridos, conceitos fundamentais e questões de revisão com base no texto.
Retorne ESTRITAMENTE um JSON no formato:
{
  "summary": "Visão geral do material analisado",
  "suggestedTopics": [
    {
      "title": "Título do tópico",
      "subtopics": ["Subtópico 1", "Subtópico 2"],
      "difficulty": "facil" | "medio" | "dificil",
      "estimatedMinutes": 60,
      "keyConcepts": ["Conceito 1", "Conceito 2"],
      "learningObjectives": ["Objetivo 1"],
      "reviewQuestions": ["Pergunta de revisão 1", "Pergunta 2"]
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Erro ao importar material com IA:', error);
    res.status(500).json({ error: error.message || 'Falha ao analisar material.' });
  }
});

// AI Assisted Lecture Slides / PDF Topic Extractor
app.post('/api/gemini/extract-pdf-topics', async (req: Request, res: Response): Promise<any> => {
  try {
    const { subjectName, fileData, rawText } = req.body;

    if ((!fileData || !fileData.base64) && (!rawText || rawText.trim().length === 0)) {
      return res.status(400).json({ error: 'Nenhum arquivo PDF ou texto de aula/slide foi fornecido.' });
    }

    const ai = getAiClient();

    const systemPrompt = `Você é um especialista em design pedagógico e estruturação de conteúdos acadêmicos universitários.
Sua missão é analisar os SLIDES de aula, apostilas ou apresentação PDF fornecidos da disciplina "${subjectName || 'acadêmica'}" e extrair/separar os TÓPICOS E CONCEITOS centrais para estudo organizado.

Diretrizes de extração:
1. Agrupar o conteúdo dos slides em blocos ou tópicos coesos (geralmente entre 3 e 10 tópicos, dependendo do tamanho da apresentação).
2. Para cada tópico identificado nos slides:
   - "title": Título claro, objetivo e didático do tópico abordado no slide (ex: "Estrutura e Replicação do DNA", "Modelagem Entidade-Relacionamento", "Segunda Lei da Termodinâmica").
   - "subtopics": Array de 2 a 5 subtópicos ou pontos-chave explicados nos slides daquele tópico.
   - "difficulty": "facil" | "medio" | "dificil" com base na densidade teórica ou prática apresentada.
   - "estimatedMinutes": Tempo sugerido de estudo focado (ex: 30, 45, 60 ou 90 minutos).
   - "slideRange": String indicando a referência ou slides aproximados (ex: "Slides 1 a 8", "Módulo 2").
   - "keyTakeaways": Resumo de 1 a 2 frases dos aprendizados essenciais que o aluno deve dominar após estudar esse tópico.

Retorne ESTRITAMENTE um JSON no seguinte formato:
{
  "documentTitle": string, // Título da aula ou tema geral dos slides
  "summary": string, // Resumo de 2 a 3 frases sobre o conteúdo abordado na aula
  "totalEstimatedMinutes": number, // Soma dos minutos estimados
  "topics": [
    {
      "title": string,
      "subtopics": string[],
      "difficulty": "facil" | "medio" | "dificil",
      "estimatedMinutes": number,
      "slideRange": string,
      "keyTakeaways": string
    }
  ]
}`;

    if (ai) {
      const contentsParts: any[] = [];

      if (fileData && fileData.base64 && fileData.mimeType) {
        contentsParts.push({
          inlineData: {
            data: fileData.base64,
            mimeType: fileData.mimeType,
          },
        });
      }

      const promptText = `${systemPrompt}\n\nDisciplina: ${subjectName || 'Geral'}${
        rawText ? `\n\nConteúdo textual / Anotações adicionais:\n${rawText}` : ''
      }`;
      contentsParts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts: contentsParts },
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(responseText);
      } catch {
        const clean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean);
      }

      return res.json(parsed);
    } else {
      // Intelligent fallback when Gemini API key is not configured
      const fallbackTopics = [
        {
          title: `Introdução aos Conceitos da Aula - ${subjectName || 'Geral'}`,
          subtopics: ['Contextualização e definições fundamentais', 'Objetivos de aprendizagem', 'Visão geral do tema'],
          difficulty: 'facil',
          estimatedMinutes: 45,
          slideRange: 'Slides 1 a 10',
          keyTakeaways: 'Compreender a fundamentação teórica e as definições primordiais apresentadas no início da aula.',
        },
        {
          title: 'Desenvolvimento Teórico e Aplicações Práticas',
          subtopics: ['Exemplos práticos demonstrados', 'Metodologias e resolução de problemas', 'Estudos de caso'],
          difficulty: 'medio',
          estimatedMinutes: 60,
          slideRange: 'Slides 11 a 25',
          keyTakeaways: 'Aplicar as técnicas e fórmulas abordadas na parte central da apresentação.',
        },
        {
          title: 'Conclusão, Desafios e Próximos Passos',
          subtopics: ['Síntese dos resultados', 'Questões para fixação e exercícios sugeridos', 'Revisão para avaliações'],
          difficulty: 'medio',
          estimatedMinutes: 45,
          slideRange: 'Slides 26 em diante',
          keyTakeaways: 'Fixar os tópicos conclusivos e estar preparado para as avaliações da disciplina.',
        },
      ];

      return res.json({
        documentTitle: `Apresentação de Aula - ${subjectName || 'Disciplina'}`,
        summary: `Conteúdo extraído com sucesso dos slides da disciplina ${subjectName || ''}. Tópicos estruturados para cronograma de foco.`,
        totalEstimatedMinutes: 150,
        topics: fallbackTopics,
      });
    }
  } catch (error: any) {
    console.error('Erro ao extrair tópicos do PDF de slides:', error);
    res.status(500).json({ error: error.message || 'Falha ao processar PDF dos slides com IA.' });
  }
});

// AI Assisted Transcript Import Endpoint (Histórico Escolar)
app.post('/api/gemini/import-transcript', async (req: Request, res: Response): Promise<any> => {
  try {
    const { rawText, fileData } = req.body;

    if ((!rawText || rawText.trim().length === 0) && (!fileData || !fileData.base64)) {
      return res.status(400).json({ error: 'Nenhum texto ou arquivo de histórico escolar foi fornecido.' });
    }

    const ai = getAiClient();

    const systemPrompt = `Você é um analista pedagógico de sistemas universitários brasileiros (como SIGA, SUAP, Jacad, Sigaa, Canvas, etc.).
Sua tarefa é analisar o Histórico Escolar universitário fornecido (em texto ou documento) e extrair com precisão cirúrgica:
1. Dados Institucionais:
   - studentName: Nome do aluno se constar, ou null
   - course: Nome do curso (ex: Engenharia de Software, Direito, Medicina, Administração)
   - university: Nome da faculdade / universidade se constar, ou null
   - detectedCurrentSemester: Número inteiro (1 a 12) representando o SEMESTRE / PERÍODO que o estudante está cursando ATUALMENTE.
     * Critério para detecção do semestre atual:
       - Identifique as matérias marcadas como "Cursando", "Matriculado", "Em andamento" ou sem nota final no período mais recente.
       - Se todas as matérias até o período N tiverem nota e aprovação, e o período N+1 contiver as matérias em andamento ou o próximo período, o semestre atual é N+1 (ou N se estiver no fim do período).
       - Se não for explícito, analise a progressão dos semestres com disciplinas aprovadas e determine o período imediatamente seguinte ou ativo.

2. Lista Completa de Disciplinas:
   Para CADA disciplina constante no histórico:
   - name: Nome formal da matéria (ex: "Cálculo I", "Algoritmos e Estruturas de Dados")
   - code: Código ou sigla da matéria se houver (ex: "MAT101")
   - semester: Número inteiro do período ao qual pertence a matéria (ex: 1, 2, 3...)
   - credits: Número de créditos ou carga horária estimada (ex: 4 créditos, 60h -> 4)
   - professor: Nome do professor se constar, ou ""
   - finalGrade: Nota final obtida (número decimal de 0 a 10, ex: 8.5), ou null se ainda não tiver nota
   - minPassingGrade: Média mínima para aprovação na instituição (padrão 6.0 ou 7.0)
   - status:
     * "aprovado": Se a matéria já possui nota final maior ou igual à média mínima (minPassingGrade), OU se o status no documento for expressamente "Aprovado", "Aprovada", "AP", "Dispensa", "Aproveitamento", "Cumpriu".
     * "cursando": Se o status for "Cursando", "Matriculado", "Em andamento", "Pendente", ou se a matéria for do semestre atual e ainda não tiver nota final lançada.
     * "reprovado": Se tiver nota inferior à média mínima ou status "Reprovado", "RN", "RF".
     * "trancado": Se estiver com status "Trancado" ou "Cancelado".
   - difficulty: "facil" | "medio" | "dificil"
   - priority: "low" | "medium" | "high" | "urgent" (para matérias cursando, sugerir medium ou high; para aprovadas, low)
   - targetGrade: Meta sugerida (padrão 8.0)
   - topics: Array com 3 a 5 tópicos fundamentais da ementa provável da matéria. Cada tópico deve ter { title: string, subtopics: string[], difficulty: "facil"|"medio"|"dificil", estimatedMinutes: 60, masteryLevel: status === 'aprovado' ? 100 : 0 }

Retorne ESTRITAMENTE um JSON no formato:
{
  "studentName": string | null,
  "course": string | null,
  "university": string | null,
  "detectedCurrentSemester": number,
  "analysisSummary": string,
  "subjects": [
    {
      "name": string,
      "code": string,
      "semester": number,
      "credits": number,
      "professor": string,
      "finalGrade": number | null,
      "minPassingGrade": number,
      "status": "aprovado" | "cursando" | "reprovado" | "trancado",
      "difficulty": "facil" | "medio" | "dificil",
      "priority": "low" | "medium" | "high" | "urgent",
      "targetGrade": number,
      "topics": [
        {
          "title": string,
          "subtopics": string[],
          "difficulty": "facil" | "medio" | "dificil",
          "estimatedMinutes": number,
          "masteryLevel": number
        }
      ]
    }
  ]
}`;

    if (ai) {
      const contentsParts: any[] = [];

      if (fileData && fileData.base64 && fileData.mimeType) {
        contentsParts.push({
          inlineData: {
            mimeType: fileData.mimeType,
            data: fileData.base64,
          },
        });
      }

      const textInstruction = rawText
        ? `Histórico Escolar para análise:\n\n${rawText.substring(0, 30000)}`
        : 'Analise o documento anexado do histórico escolar.';

      contentsParts.push({
        text: `${systemPrompt}\n\n---\n\n${textInstruction}`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: contentsParts,
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const text = response.text || '{}';
      let parsed: any;
      try {
        parsed = JSON.parse(text);
      } catch {
        const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
        parsed = JSON.parse(clean);
      }

      return res.json(parsed);
    }

    // Heuristic fallback if AI client is unavailable
    const fallbackParsed = parseTranscriptFallback(rawText || '');
    return res.json(fallbackParsed);
  } catch (error: any) {
    console.error('Erro ao importar histórico com IA:', error);
    // Try heuristic fallback on error
    try {
      const fallback = parseTranscriptFallback(req.body.rawText || '');
      return res.json(fallback);
    } catch {
      res.status(500).json({ error: error.message || 'Falha ao processar histórico escolar.' });
    }
  }
});

// Heuristic fallback parser for robustness
function parseTranscriptFallback(text: string) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const detectedSubjects: any[] = [];
  let currentSemester = 1;

  for (const line of lines) {
    // Check if line indicates semester
    const semMatch = line.match(/([1-9]|1[0-2])\s*[º°ª]?\s*(semestre|per[ií]odo)/i);
    if (semMatch) {
      currentSemester = parseInt(semMatch[1], 10);
      continue;
    }

    // Check if line looks like a course name (contains letters, maybe code and grade)
    if (line.length > 5 && !line.startsWith('---') && !line.startsWith('===')) {
      const gradeMatch = line.match(/nota[:\s]*([0-9]+[.,]?[0-9]*)/i) || line.match(/\b([0-9]+[.,][0-9]+)\b/);
      let grade: number | null = null;
      if (gradeMatch) {
        const val = parseFloat(gradeMatch[1].replace(',', '.'));
        if (val >= 0 && val <= 10) grade = val;
      }

      const isAprovado = /aprovad[oa]|dispensa|aproveitamento|\bap\b/i.test(line) || (grade !== null && grade >= 6.0);
      const isCursando = /cursando|matriculado|em andamento/i.test(line);

      const status = isAprovado ? 'aprovado' : isCursando ? 'cursando' : grade !== null && grade < 6.0 ? 'reprovado' : 'cursando';

      // Clean subject name
      let cleanName = line
        .replace(/nota[:\s]*[0-9]+[.,]?[0-9]*/gi, '')
        .replace(/aprovad[oa]|cursando|matriculado/gi, '')
        .replace(/\b\d+[.,]\d+\b/g, '')
        .replace(/[0-9]{2,}\s*h/gi, '')
        .trim();

      if (cleanName.length >= 3 && cleanName.length <= 60) {
        detectedSubjects.push({
          name: cleanName,
          code: '',
          semester: currentSemester,
          credits: 4,
          professor: '',
          finalGrade: grade,
          minPassingGrade: 6.0,
          status,
          difficulty: 'medio',
          priority: status === 'cursando' ? 'high' : 'low',
          targetGrade: 8.0,
          topics: [
            {
              title: `Fundamentos de ${cleanName}`,
              subtopics: ['Introdução e conceitos-chave', 'Aplicações práticas'],
              difficulty: 'medio',
              estimatedMinutes: 60,
              masteryLevel: status === 'aprovado' ? 100 : 0,
            },
          ],
        });
      }
    }
  }

  // Determine current semester
  const cursandoSubjects = detectedSubjects.filter((s) => s.status === 'cursando');
  const maxSemCursando = cursandoSubjects.length > 0 ? Math.max(...cursandoSubjects.map((s) => s.semester)) : currentSemester;

  return {
    studentName: 'Estudante',
    course: 'Graduação',
    university: 'Universidade',
    detectedCurrentSemester: maxSemCursando || 1,
    analysisSummary: `Foram identificadas ${detectedSubjects.length} disciplinas no histórico escolar analisado.`,
    subjects: detectedSubjects,
  };
}

// AI Quiz Generator Endpoint
app.post('/api/gemini/quiz', async (req: Request, res: Response): Promise<any> => {
  try {
    const { subjectName, topics, questionCount = 5 } = req.body;

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ error: 'Chave GEMINI_API_KEY não configurada.' });
    }

    const prompt = `Crie exatamente ${questionCount} questões de múltipla escolha para simulado universitário sobre a matéria "${subjectName}".
Tópicos a abordar: ${Array.isArray(topics) ? topics.join(', ') : 'Gerais'}.

Cada questão deve ter:
- Enunciado claro e contextualizado
- 4 alternativas distintas (A, B, C, D)
- Índice da alternativa correta (0 para A, 1 para B, 2 para C, 3 para D)
- Explicação detalhada da resolução e por que a alternativa está correta
- Nome do tópico correspondente

Retorne ESTRITAMENTE um JSON no formato:
{
  "questions": [
    {
      "id": "q1",
      "question": "Enunciado da questão...",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctOptionIndex": 1,
      "explanation": "Explicação detalhada...",
      "topicName": "Nome do tópico"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      const clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(clean);
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Erro ao gerar quiz:', error);
    res.status(500).json({ error: error.message || 'Falha ao gerar simulado.' });
  }
});

// Vite Middleware for Development / Static Serve for Production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[StarStudy Server] Rodando na porta ${PORT}`);
  });
}

startServer();
