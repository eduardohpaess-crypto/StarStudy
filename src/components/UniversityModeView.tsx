import React from 'react';
import {
  Building2,
  CheckCircle2,
  Clock,
  Award,
  Layers,
  GraduationCap,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Subject, AcademicStatus } from '../types';
import { db } from '../services/storage';

interface UniversityModeViewProps {
  subjects: Subject[];
  onRefreshData: () => void;
  onSelectSubject: (subjectId: string) => void;
}

export const UniversityModeView: React.FC<UniversityModeViewProps> = ({
  subjects,
  onRefreshData,
  onSelectSubject,
}) => {
  // Group subjects by semester
  const semesterMap = new Map<number, Subject[]>();
  subjects.forEach((s) => {
    const sem = s.semester || 1;
    const current = semesterMap.get(sem) || [];
    current.push(s);
    semesterMap.set(sem, current);
  });

  const sortedSemesters = Array.from(semesterMap.keys()).sort((a, b) => a - b);

  // Overall university metrics
  const totalSubjects = subjects.length;
  const completedSubjects = subjects.filter((s) => s.status === 'aprovado').length;
  const enrolledSubjects = subjects.filter((s) => s.status === 'cursando').length;
  const totalCredits = subjects.reduce((acc, s) => acc + (s.credits || 0), 0);
  const completedCredits = subjects
    .filter((s) => s.status === 'aprovado')
    .reduce((acc, s) => acc + (s.credits || 0), 0);

  const courseCompletionPercent =
    totalCredits > 0 ? Math.round((completedCredits / totalCredits) * 100) : 0;

  const toggleSubjectStatus = (sub: Subject) => {
    const nextStatus: AcademicStatus =
      sub.status === 'cursando'
        ? 'aprovado'
        : sub.status === 'aprovado'
        ? 'cursando'
        : 'aprovado';

    sub.status = nextStatus;
    db.saveSubject(sub);
    if (nextStatus === 'aprovado') {
      db.addXP(100);
    }
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Building2 className="w-3.5 h-3.5" />
          <span>Trajetória Acadêmica e Semestres</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Modo Universidade
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Acompanhe seu fluxo semestral, créditos integralizados e evolução até a formatura.
        </p>
      </div>

      {/* Graduation Progress Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Integralização Curricular
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100">
                {courseCompletionPercent}%
              </span>
              <span className="text-xs text-slate-500">
                ({completedCredits} de {totalCredits} créditos concluídos)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span>{completedSubjects} Aprovadas</span>
            </div>
            <div className="flex items-center gap-1.5 text-blue-600">
              <Clock className="w-4 h-4" />
              <span>{enrolledSubjects} Cursando</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
            style={{ width: `${courseCompletionPercent}%` }}
          />
        </div>
      </div>

      {/* Semesters Vertical Timeline */}
      <div className="space-y-6">
        {sortedSemesters.map((semNum) => {
          const semSubjects = semesterMap.get(semNum) || [];
          const semCredits = semSubjects.reduce((acc, s) => acc + (s.credits || 0), 0);
          const semCompleted = semSubjects.filter((s) => s.status === 'aprovado').length;

          return (
            <div
              key={semNum}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-sm">
                    {semNum}º
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {semNum}º Semestre
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {semSubjects.length} disciplinas • {semCredits} créditos
                    </p>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {semCompleted} de {semSubjects.length} concluídas
                </span>
              </div>

              {/* Subject list for this semester */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {semSubjects.map((sub) => {
                  const isApproved = sub.status === 'aprovado';

                  return (
                    <div
                      key={sub.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isApproved
                          ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: sub.color }}
                          />
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                            {sub.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {sub.credits} cr
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="text-slate-500 text-[11px]">
                          {sub.currentGrade !== undefined ? `Nota: ${sub.currentGrade.toFixed(1)}` : 'Sem nota'}
                        </span>

                        <button
                          onClick={() => toggleSubjectStatus(sub)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            isApproved
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          {isApproved ? '✓ Aprovado' : 'Marcar Aprovado'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
