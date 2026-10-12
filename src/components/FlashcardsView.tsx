import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Play,
  Download,
  RotateCw,
  Search,
  Trash2,
  Edit2,
  X,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Wand2
} from 'lucide-react';
import { Flashcard, Subject, ActiveRecallRating } from '../types';
import { db } from '../services/storage';
import { GeminiService } from '../services/geminiClient';

interface FlashcardsViewProps {
  flashcards: Flashcard[];
  subjects: Subject[];
  onRefreshData: () => void;
}

export const FlashcardsView: React.FC<FlashcardsViewProps> = ({
  flashcards,
  subjects,
  onRefreshData,
}) => {
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isStudyMode, setIsStudyMode] = useState<boolean>(false);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  // Modal states
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiCount, setAiCount] = useState<number>(5);

  // Manual Form
  const [manualForm, setManualForm] = useState<{
    subjectId: string;
    topicName: string;
    front: string;
    back: string;
    difficulty: 'facil' | 'medio' | 'dificil';
  }>({
    subjectId: subjects[0]?.id || '',
    topicName: '',
    front: '',
    back: '',
    difficulty: 'medio',
  });

  // AI Generation Form
  const [aiSubjectId, setAiSubjectId] = useState<string>(subjects[0]?.id || '');
  const [aiTopicName, setAiTopicName] = useState<string>('');

  // Filtered Cards
  const filteredCards = flashcards.filter((c) => {
    if (filterSubject !== 'all' && c.subjectId !== filterSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.front.toLowerCase().includes(q) ||
        c.back.toLowerCase().includes(q) ||
        (c.topicName && c.topicName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const currentStudyCard = filteredCards[currentCardIndex];

  // CSV Export (Anki Compatible: Front,Back,Subject,Topic)
  const handleExportCSV = () => {
    const header = 'Frente;Verso;Disciplina;Topico;Dificuldade\n';
    const rows = filteredCards
      .map((c) => {
        const sub = subjects.find((s) => s.id === c.subjectId)?.name || 'Geral';
        const cleanFront = c.front.replace(/;/g, ',').replace(/\n/g, ' ');
        const cleanBack = c.back.replace(/;/g, ',').replace(/\n/g, ' ');
        return `"${cleanFront}";"${cleanBack}";"${sub}";"${c.topicName || ''}";"${c.difficulty}"`;
      })
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `StarStudy_Flashcards_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Study Rating
  const handleRateFlashcard = (rating: ActiveRecallRating) => {
    if (!currentStudyCard) return;

    const evaluation = db.evaluateActiveRecall(
      currentStudyCard.intervalDays || 1,
      currentStudyCard.repetitionCount || 0,
      currentStudyCard.mastery || 50,
      rating
    );

    currentStudyCard.intervalDays = evaluation.nextIntervalDays;
    currentStudyCard.repetitionCount = evaluation.newRepetitionCount;
    currentStudyCard.mastery = evaluation.newMastery;
    currentStudyCard.nextReviewDate = evaluation.nextDateStr;
    currentStudyCard.lastRating = rating;

    db.saveFlashcard(currentStudyCard);
    db.addXP(15);
    onRefreshData();

    setIsFlipped(false);
    if (currentCardIndex < filteredCards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      setIsStudyMode(false);
      setCurrentCardIndex(0);
    }
  };

  // Manual save
  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.front.trim() || !manualForm.back.trim()) return;

    const newCard: Flashcard = {
      id: `fc-${Date.now()}`,
      subjectId: manualForm.subjectId,
      topicName: manualForm.topicName.trim() || 'Conceitos Gerais',
      front: manualForm.front.trim(),
      back: manualForm.back.trim(),
      difficulty: manualForm.difficulty,
      mastery: 50,
      intervalDays: 1,
      nextReviewDate: new Date().toISOString().split('T')[0],
      repetitionCount: 0,
      createdAt: new Date().toISOString(),
    };

    db.saveFlashcard(newCard);
    db.addXP(20);
    setIsManualModalOpen(false);
    onRefreshData();
  };

  // AI Generation
  const handleGenerateAiFlashcards = async () => {
    const sub = subjects.find((s) => s.id === aiSubjectId);
    if (!sub) return;

    try {
      setAiGenerating(true);
      const res = await GeminiService.executeTool20({
        toolType: 'geracao_flashcards',
        subjectName: sub.name,
        topicTitle: aiTopicName || 'Principais Conceitos',
        customInstructions: `Gere exatamente ${aiCount} flashcards. Cada cartão deve focar em um conceito, fórmula ou aplicação essencial para fixação.`,
      });

      // Parse generated flashcards lines or fallback
      const lines = res.result.split('\n').filter((l) => l.trim().length > 0);
      let created = 0;

      for (let i = 0; i < lines.length && created < aiCount; i++) {
        const line = lines[i];
        if (line.includes('Frente:') && line.includes('Verso:')) {
          const [frontPart, backPart] = line.split('Verso:');
          const front = frontPart.replace(/.*Frente:/i, '').trim();
          const back = backPart.trim();
          if (front && back) {
            db.saveFlashcard({
              id: `fc-ai-${Date.now()}-${created}`,
              subjectId: sub.id,
              topicName: aiTopicName || 'IA Gerado',
              front,
              back,
              difficulty: 'medio',
              mastery: 50,
              intervalDays: 1,
              nextReviewDate: new Date().toISOString().split('T')[0],
              repetitionCount: 0,
              createdAt: new Date().toISOString(),
            });
            created++;
          }
        }
      }

      // If text was freeform markdown, add as cards
      if (created === 0) {
        db.saveFlashcard({
          id: `fc-ai-${Date.now()}`,
          subjectId: sub.id,
          topicName: aiTopicName || 'Síntese de Conteúdo',
          front: `Conceitos essenciais de ${aiTopicName || sub.name}`,
          back: res.result.substring(0, 400),
          difficulty: 'medio',
          mastery: 50,
          intervalDays: 1,
          nextReviewDate: new Date().toISOString().split('T')[0],
          repetitionCount: 0,
          createdAt: new Date().toISOString(),
        });
      }

      db.addXP(50);
      setIsAiModalOpen(false);
      onRefreshData();
    } catch (err) {
      // Fallback manual card
      db.saveFlashcard({
        id: `fc-ai-${Date.now()}`,
        subjectId: sub.id,
        topicName: aiTopicName || 'Flashcard',
        front: `O que é fundamental revisar em ${aiTopicName || sub.name}?`,
        back: `Conceito base, definições e resolução prática de exercícios.`,
        difficulty: 'medio',
        mastery: 50,
        intervalDays: 1,
        nextReviewDate: new Date().toISOString().split('T')[0],
        repetitionCount: 0,
        createdAt: new Date().toISOString(),
      });
      setIsAiModalOpen(false);
      onRefreshData();
    } finally {
      setAiGenerating(false);
    }
  };

  const handleDeleteCard = (id: string) => {
    db.deleteFlashcard(id);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Layers className="w-3.5 h-3.5" />
            <span>Repetição Ativa com Baralhos</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Flashcards
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Memorização rápida e eficiente: estude com cartas animadas e exporte para Anki em CSV.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV (Anki)</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Gerar com IA</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Flashcard</span>
          </button>
        </div>
      </div>

      {/* Interactive Study Mode View */}
      {isStudyMode && currentStudyCard ? (
        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-400 font-semibold">
              Cartão {currentCardIndex + 1} de {filteredCards.length}
            </span>
            <button
              onClick={() => setIsStudyMode(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Encerrar Sessão
            </button>
          </div>

          {/* Flashcard 3D flip card */}
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[260px] p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800/80 dark:to-slate-800/40 border-2 border-dashed border-blue-200 dark:border-blue-900/60 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:border-blue-400 space-y-4 select-none"
          >
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
              {isFlipped ? 'VERSO (RESPOSTA)' : 'FRENTE (PERGUNTA)'}
            </span>

            <p className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 max-w-lg leading-relaxed">
              {isFlipped ? currentStudyCard.back : currentStudyCard.front}
            </p>

            <span className="text-xs text-slate-400 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5" />
              <span>Clique no cartão para {isFlipped ? 'ver pergunta' : 'revelar resposta'}</span>
            </span>
          </div>

          {/* Evaluation buttons (Active after flipped) */}
          {isFlipped ? (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-500 text-center block">
                Avalie sua lembrança para calibrar a repetição espaçada:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { r: 1 as ActiveRecallRating, l: 'Esqueci', c: 'text-rose-600 border-rose-200' },
                  { r: 2 as ActiveRecallRating, l: 'Difícil', c: 'text-amber-600 border-amber-200' },
                  { r: 3 as ActiveRecallRating, l: 'Médio', c: 'text-blue-600 border-blue-200' },
                  { r: 4 as ActiveRecallRating, l: 'Bom', c: 'text-indigo-600 border-indigo-200' },
                  { r: 5 as ActiveRecallRating, l: 'Fácil', c: 'text-emerald-600 border-emerald-200' },
                ].map((item) => (
                  <button
                    key={item.r}
                    onClick={() => handleRateFlashcard(item.r)}
                    className={`p-2.5 rounded-xl border bg-white dark:bg-slate-800 text-center font-bold text-xs hover:bg-slate-50 transition-all ${item.c}`}
                  >
                    <span className="block text-sm">{item.r}</span>
                    <span className="text-[10px]">{item.l}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={() => setIsFlipped(true)}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
              >
                Mostrar Resposta
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Action & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex flex-1 items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar flashcards por frente, verso ou tópico..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300"
              >
                <option value="all">Todas as matérias</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {filteredCards.length > 0 && (
                <button
                  onClick={() => {
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                    setIsStudyMode(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Estudar ({filteredCards.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card) => {
              const sub = subjects.find((s) => s.id === card.subjectId);

              return (
                <div
                  key={card.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between hover:border-blue-400 transition-all group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white line-clamp-1 max-w-[150px]"
                        style={{ backgroundColor: sub?.color || '#2563eb' }}
                      >
                        {sub?.name || 'Geral'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {card.topicName}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Frente
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-3">
                        {card.front}
                      </h4>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Verso
                      </span>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                        {card.back}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span>Domínio: {card.mastery}%</span>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="text-slate-400 hover:text-rose-500 p-1"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredCards.length === 0 && (
              <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
                <p className="text-xs">Nenhum flashcard encontrado.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Crie manualmente ou use a IA para gerar baralhos em instantes.
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal: Manual Flashcard */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Novo Flashcard Manual
              </h3>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disciplina
                </label>
                <select
                  value={manualForm.subjectId}
                  onChange={(e) => setManualForm({ ...manualForm, subjectId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Geral / Sem Disciplina</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tópico / Assunto
                </label>
                <input
                  type="text"
                  value={manualForm.topicName}
                  onChange={(e) => setManualForm({ ...manualForm, topicName: e.target.value })}
                  placeholder="Ex: Rotações AVL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Frente (Pergunta / Conceito) *
                </label>
                <textarea
                  rows={2}
                  required
                  value={manualForm.front}
                  onChange={(e) => setManualForm({ ...manualForm, front: e.target.value })}
                  placeholder="Qual é a condição para uma árvore ser balanceada em AVL?"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Verso (Resposta / Definição) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={manualForm.back}
                  onChange={(e) => setManualForm({ ...manualForm, back: e.target.value })}
                  placeholder="O fator de balanceamento FB = h(esq) - h(dir) deve ser -1, 0 ou +1."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Flashcard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: AI Flashcards Generator */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-indigo-600">
                <Wand2 className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Gerar Baralho com IA (Gemini)
                </h3>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Disciplina
                </label>
                <select
                  value={aiSubjectId}
                  onChange={(e) => setAiSubjectId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Geral / Conhecimentos Gerais</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tópico / Foco de Estudo
                </label>
                <input
                  type="text"
                  value={aiTopicName}
                  onChange={(e) => setAiTopicName(e.target.value)}
                  placeholder="Ex: Teorema de Green e Integrais Múltiplas"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Quantidade de Cartões
                </label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setAiCount(num)}
                      className={`flex-1 py-2 rounded-xl font-bold border transition-colors ${
                        aiCount === num
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={aiGenerating}
                  onClick={handleGenerateAiFlashcards}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold disabled:opacity-50 flex items-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <RotateCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <span>Gerar {aiCount} Flashcards</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
