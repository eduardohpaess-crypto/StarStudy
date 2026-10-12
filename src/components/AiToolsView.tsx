import React, { useState } from 'react';
import {
  Wand2,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  RotateCw,
  Edit3,
  BookOpen,
  Brain,
  FileText,
  Lightbulb,
  Calendar,
  BarChart3,
  Target,
  TrendingUp,
  Layers,
  Network,
  Radio,
  Smile,
  Hash,
  ShieldAlert,
  HelpCircle,
  FileCode,
  CheckCircle2,
  X
} from 'lucide-react';
import { Subject, AiToolType, AiMaterial } from '../types';
import { db } from '../services/storage';
import { GeminiService } from '../services/geminiClient';

interface AiToolsViewProps {
  subjects: Subject[];
  initialSubjectName?: string;
  initialTopicTitle?: string;
  initialToolType?: AiToolType;
  onRefreshData: () => void;
  onOpenLibrary: () => void;
}

export const AI_TOOLS_LIST: {
  id: AiToolType;
  name: string;
  description: string;
  icon: any;
  category: 'sintese' | 'pratica' | 'planejamento' | 'memorizacao';
}[] = [
  { id: 'resumo_inteligente', name: '1. Resumo Inteligente', description: 'Síntese aprofundada com conceitos essenciais destacados', icon: BookOpen, category: 'sintese' },
  { id: 'mapa_mental', name: '2. Mapa Mental', description: 'Estruturação hierárquica e ramificações conceituais', icon: Brain, category: 'sintese' },
  { id: 'questoes_dissertativas', name: '3. Questões Dissertativas', description: '3 questões com respostas-modelo e critérios de avaliação', icon: FileText, category: 'pratica' },
  { id: 'explicacao_simples', name: '4. Explicação Simples (Feynman)', description: 'Explicação didática sem jargões para iniciantes', icon: Lightbulb, category: 'sintese' },
  { id: 'quiz_relampago', name: '5. Quiz Relâmpago (5 Questões)', description: 'Perguntas rápidas de múltipla escolha com gabarito imediato', icon: CheckCircle2, category: 'pratica' },
  { id: 'cronograma_14dias', name: '6. Cronograma de 14 Dias', description: 'Reta final com distribuição de blocos de recuperação ativa', icon: Calendar, category: 'planejamento' },
  { id: 'analise_desempenho', name: '7. Análise de Desempenho', description: 'Diagnóstico de dificuldades comuns e plano de correção', icon: BarChart3, category: 'planejamento' },
  { id: 'plano_preparacao_prova', name: '8. Plano de Preparação para Prova', description: 'Estratégia completa de estudo para o dia da avaliação', icon: Target, category: 'planejamento' },
  { id: 'previsao_nota', name: '9. Previsão de Nota & Riscos', description: 'Projeção com 3 cenários e pontos críticos de atenção', icon: TrendingUp, category: 'planejamento' },
  { id: 'recomendacao_metodo', name: '10. Recomendação de Método', description: 'Métodos científicos mais eficazes para este conteúdo específico', icon: Sparkles, category: 'sintese' },
  { id: 'geracao_flashcards', name: '11. Geração de Flashcards', description: 'Conjunto de cartões frente/verso para active recall', icon: Layers, category: 'memorizacao' },
  { id: 'conexoes_conteudos', name: '12. Conexões Interdisciplinares', description: 'Pontes entre esta disciplina, outras matérias e o mercado', icon: Network, category: 'sintese' },
  { id: 'roteiro_podcast', name: '13. Roteiro para Podcast', description: 'Roteiro falado e dinâmico de 5 minutos sobre o tema', icon: Radio, category: 'sintese' },
  { id: 'analogias_criativas', name: '14. Analogias Criativas', description: 'Metáforas marcantes para fixar conceitos abstratos', icon: Smile, category: 'memorizacao' },
  { id: 'mnemonicos', name: '15. Mnemônicos & Siglas', description: 'Acrônimos e rimas inteligentes para memorização imediata', icon: Hash, category: 'memorizacao' },
  { id: 'planejamento_4semanas', name: '16. Planejamento de 4 Semanas', description: 'Roadmap curricular completo para o mês', icon: Calendar, category: 'planejamento' },
  { id: 'correcao_pontos_fracos', name: '17. Correção de Pontos Fracos', description: 'Mapeamento das 4 maiores pegadinhas e erros de prova', icon: ShieldAlert, category: 'pratica' },
  { id: 'glossario', name: '18. Glossário Acadêmico', description: 'Dicionário com os 10 termos mais cruciais da matéria', icon: BookOpen, category: 'sintese' },
  { id: 'formulas_conceitos', name: '19. Fórmulas & Conceitos Essenciais', description: 'Folha de consulta rápida com definições axiomáticas', icon: FileCode, category: 'memorizacao' },
  { id: 'simulado_completo', name: '20. Simulado Completo Comentado', description: 'Prova elaborada com gabarito analítico detalhado', icon: HelpCircle, category: 'pratica' },
];

export const AiToolsView: React.FC<AiToolsViewProps> = ({
  subjects,
  initialSubjectName,
  initialTopicTitle,
  initialToolType,
  onRefreshData,
  onOpenLibrary,
}) => {
  const [selectedTool, setSelectedTool] = useState<AiToolType>(
    initialToolType || 'resumo_inteligente'
  );
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>(
    initialSubjectName || subjects[0]?.name || ''
  );
  const [topicTitle, setTopicTitle] = useState<string>(initialTopicTitle || '');
  const [customInstructions, setCustomInstructions] = useState<string>('');

  // Execution states
  const [loading, setLoading] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeToolObj = AI_TOOLS_LIST.find((t) => t.id === selectedTool) || AI_TOOLS_LIST[0];

  const handleExecuteAi = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await GeminiService.executeTool20({
        toolType: selectedTool,
        subjectName: selectedSubjectName,
        topicTitle: topicTitle || 'Geral da Disciplina',
        customInstructions,
      });

      setResultText(res.result);
      setIsEditing(false);
      db.addXP(30);
    } catch (err: any) {
      console.warn('Erro na IA, ativando template manual:', err);
      // Auto fallback to manual mode template so user is never stuck
      const manual = GeminiService.generateManualTemplate(
        selectedTool,
        selectedSubjectName,
        topicTitle || 'Conteúdo de Estudo'
      );
      setResultText(manual);
      setErrorMsg(
        'Observação: Servidor Gemini indisponível ou sem chave. Gerado modelo estruturado em modo manual.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateManual = () => {
    const manual = GeminiService.generateManualTemplate(
      selectedTool,
      selectedSubjectName,
      topicTitle || 'Conteúdo de Estudo'
    );
    setResultText(manual);
    setIsEditing(false);
    setErrorMsg(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToLibrary = () => {
    if (!resultText.trim()) return;

    const subject = subjects.find((s) => s.name === selectedSubjectName);
    const newMaterial: AiMaterial = {
      id: `mat-${Date.now()}`,
      title: `${activeToolObj.name}: ${topicTitle || selectedSubjectName}`,
      type: selectedTool,
      subjectId: subject?.id || 'geral',
      content: resultText,
      tags: [selectedTool, selectedSubjectName, topicTitle].filter(Boolean),
      createdAt: new Date().toISOString(),
    };

    db.saveAiMaterial(newMaterial);
    db.addXP(25);
    setSavedNotice(true);
    onRefreshData();
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Wand2 className="w-3.5 h-3.5" />
            <span>Inteligência Artificial Acadêmica do StarStudy</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            As 20 Ferramentas de IA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Geração com Gemini 3.8 Flash: resumos, mapas mentais, simulados, mnemonicos e cronogramas personalizados.
          </p>
        </div>

        <button
          onClick={onOpenLibrary}
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Ver Biblioteca IA</span>
        </button>
      </div>

      {/* Main Workspace: Left Tools Selector, Right Output Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Tools Selector & Prompt Form */}
        <div className="lg:col-span-5 space-y-4">
          {/* Tool Selector Panel */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Selecione a Ferramenta Desejada (1 a 20)
            </span>

            <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
              {AI_TOOLS_LIST.map((tool) => {
                const Icon = tool.icon;
                const isSelected = selectedTool === tool.id;

                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedTool(tool.id)}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-medium border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-1 ring-blue-500 font-bold'
                        : 'border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="block">{tool.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal line-clamp-1">
                        {tool.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt Parameters Form */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 text-xs">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Disciplina
              </label>
              <select
                value={selectedSubjectName}
                onChange={(e) => setSelectedSubjectName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold"
              >
                <option value="">Geral / Conhecimentos Acadêmicos</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Tópico ou Conteúdo Específico
              </label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="Ex: Árvores AVL ou Integrais Múltiplas"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Instruções Extras (opcional)
              </label>
              <textarea
                rows={2}
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Ex: Focar em exemplos numéricos; destacar fórmulas..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleGenerateManual}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 transition-colors"
                title="Gera um modelo estruturado sem gastar cotas da API"
              >
                Modo Manual
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleExecuteAi}
                className="flex-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Processando no Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Gerar com Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Result Output Canvas & Tools */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 min-h-[550px] flex flex-col justify-between">
            {/* Output Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Material Acadêmico Gerado
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {activeToolObj.name}
                </h3>
              </div>

              {resultText && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title={isEditing ? 'Visualizar' : 'Editar texto'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCopy}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Copiar para área de transferência"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSaveToLibrary}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center gap-1 hover:bg-blue-100"
                    title="Salvar na Biblioteca IA"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Salvar na Biblioteca</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error or Alert banner if any */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Saved Toast notice */}
            {savedNotice && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold animate-fadeIn">
                ✓ Material salvo com sucesso na sua Biblioteca IA local!
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="h-64 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    O Gemini 3.8 Flash está estruturando seu material pedagógico...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Garantindo rigor conceitual e formato otimizado para estudo.
                  </p>
                </div>
              ) : resultText ? (
                isEditing ? (
                  <textarea
                    rows={16}
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    className="w-full h-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden"
                  />
                ) : (
                  <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed py-2 font-sans">
                    {resultText}
                  </div>
                )
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2">
                  <Wand2 className="w-10 h-10 opacity-30 text-blue-500" />
                  <p className="text-xs font-semibold">Nenhum material gerado ainda.</p>
                  <p className="text-[11px] text-slate-400 max-w-sm">
                    Escolha uma das 20 ferramentas à esquerda e clique em "Gerar com Gemini" ou "Modo Manual".
                  </p>
                </div>
              )}
            </div>

            {/* Bottom info footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span>Modelo: Gemini 3.8 Flash</span>
              <span>Privacidade: Requisição segura via backend</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
