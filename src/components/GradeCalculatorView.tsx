import React, { useState } from 'react';
import {
  Calculator,
  Award,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { Subject } from '../types';

interface GradeCalculatorViewProps {
  subjects: Subject[];
}

interface EvalItem {
  id: string;
  name: string;
  weight: number;
  grade?: number; // undefined if future
}

export const GradeCalculatorView: React.FC<GradeCalculatorViewProps> = ({ subjects }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || 'custom');

  // Passing criteria
  const [passingGrade, setPassingGrade] = useState<number>(6.0);
  const [recoveryGrade, setRecoveryGrade] = useState<number>(4.0);

  // Evaluated items in calculator
  const [evaluations, setEvaluations] = useState<EvalItem[]>([
    { id: '1', name: 'Prova 1 (P1)', weight: 4, grade: 7.0 },
    { id: '2', name: 'Trabalho Prático (T1)', weight: 2, grade: 8.5 },
    { id: '3', name: 'Prova 2 (P2)', weight: 4, grade: undefined },
  ]);

  // Handle selecting a real subject from the database
  const handleSelectSubject = (subId: string) => {
    setSelectedSubjectId(subId);
    if (subId === 'custom') return;

    const sub = subjects.find((s) => s.id === subId);
    if (sub) {
      setPassingGrade(sub.minPassingGrade || 6.0);
      if (sub.exams && sub.exams.length > 0) {
        setEvaluations(
          sub.exams.map((e, idx) => ({
            id: String(idx + 1),
            name: e.title,
            weight: e.weight,
            grade: e.grade,
          }))
        );
      } else {
        setEvaluations([
          { id: '1', name: 'Prova 1 (P1)', weight: 4, grade: undefined },
          { id: '2', name: 'Prova 2 (P2)', weight: 6, grade: undefined },
        ]);
      }
    }
  };

  const handleAddEvaluation = () => {
    setEvaluations([
      ...evaluations,
      {
        id: String(Date.now()),
        name: `Avaliação ${evaluations.length + 1}`,
        weight: 3,
        grade: undefined,
      },
    ]);
  };

  const handleRemoveEvaluation = (id: string) => {
    setEvaluations(evaluations.filter((e) => e.id !== id));
  };

  const handleUpdateEval = (id: string, field: keyof EvalItem, value: any) => {
    setEvaluations(
      evaluations.map((e) => (e.id === id ? { ...e, [field]: value } : e))
    );
  };

  // Calculations
  const totalWeight = evaluations.reduce((acc, e) => acc + (e.weight || 0), 0);
  const completedEvals = evaluations.filter((e) => e.grade !== undefined);
  const completedWeight = completedEvals.reduce((acc, e) => acc + (e.weight || 0), 0);
  const accumulatedWeightedSum = completedEvals.reduce(
    (acc, e) => acc + (e.grade || 0) * (e.weight || 0),
    0
  );

  const currentAverage =
    completedWeight > 0 ? (accumulatedWeightedSum / completedWeight).toFixed(2) : '0.00';

  const remainingWeight = totalWeight - completedWeight;
  const remainingEvals = evaluations.filter((e) => e.grade === undefined);

  // Target to reach passingGrade on overall totalWeight:
  // (accumulatedWeightedSum + requiredSum) / totalWeight = passingGrade
  // requiredSum = passingGrade * totalWeight - accumulatedWeightedSum
  const targetTotalPoints = passingGrade * totalWeight;
  const neededRemainingWeightedSum = Math.max(0, targetTotalPoints - accumulatedWeightedSum);

  const neededAverageOnRemaining =
    remainingWeight > 0
      ? (neededRemainingWeightedSum / remainingWeight).toFixed(2)
      : '0.00';

  const isAlreadyApproved =
    completedWeight > 0 &&
    Number(currentAverage) >= passingGrade &&
    accumulatedWeightedSum >= targetTotalPoints;

  const isMathematicallyImpossible = Number(neededAverageOnRemaining) > 10.0;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Calculator className="w-3.5 h-3.5" />
          <span>Simulação de Médias e Prazos</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Calculadora de Notas & Desempenho
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Simule cenários reais: descubra exatamente quanto precisa tirar nas próximas avaliações para aprovação direta.
        </p>
      </div>

      {/* Select subject or custom */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Carregar disciplina:
          </span>
          <select
            value={selectedSubjectId}
            onChange={(e) => handleSelectSubject(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200"
          >
            <option value="custom">Configuração Livre / Personalizada</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code || `Sem. ${s.semester}`})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Média Mínima:</span>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={passingGrade}
              onChange={(e) => setPassingGrade(Number(e.target.value) || 6.0)}
              className="w-16 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Result Projection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Média Atual */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-medium">Média Atual Acumulada</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {currentAverage}
            </span>
            <span className="text-xs text-slate-400">/ 10</span>
          </div>
          <p className="text-[11px] text-slate-400 pt-1">
            Considerando {completedWeight} de {totalWeight} pesos avaliados.
          </p>
        </div>

        {/* Card 2: Quanto precisa tirar? */}
        <div
          className={`p-5 rounded-2xl border shadow-xs space-y-1 ${
            isMathematicallyImpossible
              ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900'
              : isAlreadyApproved
              ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900'
              : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
          }`}
        >
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
            Nota Necessária nas Restantes
          </span>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl font-black ${
                isMathematicallyImpossible
                  ? 'text-rose-600'
                  : isAlreadyApproved
                  ? 'text-emerald-600'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {isAlreadyApproved ? '0.00' : neededAverageOnRemaining}
            </span>
            <span className="text-xs text-slate-400">média necessária</span>
          </div>
          <p className="text-[11px] text-slate-500 pt-1">
            {isAlreadyApproved
              ? '🎉 Você já atingiu os pontos necessários para aprovação!'
              : isMathematicallyImpossible
              ? '⚠️ Média necessária superior a 10. Exigirá exame de recuperação.'
              : `Distribuída nos ${remainingWeight} pesos restantes.`}
          </p>
        </div>

        {/* Card 3: Situação Projetada */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-medium">Situação Acadêmica</span>
          <div className="mt-1">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                isAlreadyApproved
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : isMathematicallyImpossible
                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                  : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              }`}
            >
              {isAlreadyApproved
                ? 'Aprovado por Média'
                : isMathematicallyImpossible
                ? 'Em Risco / Recuperação'
                : 'Cursando com chances normais'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 pt-2">
            Baseado na nota de corte de {passingGrade.toFixed(1)}.
          </p>
        </div>
      </div>

      {/* Evaluations Table Editor */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Estrutura de Avaliações
            </h3>
            <p className="text-xs text-slate-400">
              Edite as provas, pesos e notas obtidas para atualizar a simulação
            </p>
          </div>
          <button
            onClick={handleAddEvaluation}
            className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-600 dark:text-blue-400 text-xs font-semibold flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Avaliação</span>
          </button>
        </div>

        <div className="space-y-3">
          {evaluations.map((ev) => (
            <div
              key={ev.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={ev.name}
                  onChange={(e) => handleUpdateEval(ev.id, 'name', e.target.value)}
                  placeholder="Nome da prova"
                  className="w-full text-xs font-bold bg-transparent text-slate-900 dark:text-slate-100 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Peso:</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={ev.weight}
                    onChange={(e) =>
                      handleUpdateEval(ev.id, 'weight', Number(e.target.value) || 1)
                    }
                    className="w-14 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-bold"
                  />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 text-[11px]">Nota:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={ev.grade !== undefined ? ev.grade : ''}
                    onChange={(e) =>
                      handleUpdateEval(
                        ev.id,
                        'grade',
                        e.target.value === '' ? undefined : Number(e.target.value)
                      )
                    }
                    placeholder="Pendente"
                    className="w-20 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center font-bold text-blue-600 placeholder:text-slate-400"
                  />
                </div>

                <button
                  onClick={() => handleRemoveEvaluation(ev.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500"
                  title="Remover avaliação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
