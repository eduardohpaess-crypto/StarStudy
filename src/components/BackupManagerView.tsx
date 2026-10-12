import React, { useState } from 'react';
import {
  HardDriveDownload,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  Database,
  ShieldCheck,
  RefreshCcw,
  FileJson,
  X,
  Layers
} from 'lucide-react';
import { BackupData } from '../types';
import { db } from '../services/storage';

interface BackupManagerViewProps {
  onRefreshData: () => void;
}

export const BackupManagerView: React.FC<BackupManagerViewProps> = ({ onRefreshData }) => {
  const [importPreview, setImportPreview] = useState<BackupData | null>(null);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [importError, setImportError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Reset confirmation modal
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Download JSON backup file
  const handleExportBackup = () => {
    const jsonStr = db.exportFullBackup();
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `StarStudy_Backup_${dateStr}.json`;

    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSuccessMsg('Arquivo de backup exportado com sucesso! Guarde-o com segurança.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Upload and parse JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportPreview(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const validation = db.validateBackup(text);
      if (!validation.valid || !validation.data) {
        setImportError(validation.error || 'Arquivo de backup inválido ou incompatível.');
      } else {
        setImportPreview(validation.data);
      }
    };
    reader.onerror = () => {
      setImportError('Erro ao ler arquivo do computador.');
    };
    reader.readAsText(file);
  };

  // Commit imported backup
  const handleConfirmImport = () => {
    if (!importPreview) return;

    db.importBackup(importPreview, importMode);
    setSuccessMsg(
      importMode === 'replace'
        ? 'Dados restaurados integralmente a partir do backup!'
        : 'Dados do backup mesclados com sucesso ao seu histórico atual!'
    );
    setImportPreview(null);
    onRefreshData();
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  // Factory reset database
  const handleConfirmReset = () => {
    db.resetDatabase();
    setIsResetModalOpen(false);
    setSuccessMsg('Banco de dados local limpo com sucesso.');
    onRefreshData();
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
          <Database className="w-3.5 h-3.5" />
          <span>Soberania de Dados & Nuvem</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Backup & Gestão de Dados
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Seus dados sincronizam com sua conta Firebase na nuvem e você também pode exportar e restaurar backups em JSON a qualquer momento.
        </p>
      </div>

      {/* Security and Privacy Notice */}
      <div className="p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3.5 text-xs text-blue-900 dark:text-blue-200">
        <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <strong className="block font-bold">Sincronização em Nuvem (Firebase) e Backups Locais</strong>
          <p>
            O StarStudy salva suas disciplinas, materiais de estudo, flashcards e notas na sua conta Firebase Firestore. Para segurança extra e portabilidade completa, você pode baixar o backup completo em arquivo JSON.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Two Columns: Export & Import */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 w-fit">
              <Download className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Exportar Backup Completo
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Gera um arquivo JSON contendo todas as matérias, conteúdos, tarefas do Kanban, cronômetro, flashcards, notas e histórico de XP.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleExportBackup}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Baixar Arquivo JSON de Backup</span>
            </button>
          </div>
        </div>

        {/* Import Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 w-fit">
              <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Restaurar Backup JSON
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Carregue um arquivo gerado anteriormente pelo StarStudy para recuperar seu progresso ou transferir seus dados de outro dispositivo.
            </p>
          </div>

          <div className="pt-2">
            <label className="w-full py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all">
              <Upload className="w-4 h-4" />
              <span>Selecionar Arquivo JSON</span>
              <input type="file" accept=".json" onChange={handleFileChange} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Import Error */}
      {importError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{importError}</span>
        </div>
      )}

      {/* Import Preview Modal / Card */}
      {importPreview && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-900 shadow-xl space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                Validação de Integridade do Arquivo
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Prévia dos Dados Identificados no Backup
              </h3>
            </div>
            <button
              onClick={() => setImportPreview(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Disciplinas</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {importPreview.subjects?.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Tarefas</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {importPreview.tasks?.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Flashcards</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {importPreview.flashcards?.length || 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-slate-400 block text-[10px]">Sessões de Foco</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {importPreview.sessions?.length || 0}
              </span>
            </div>
          </div>

          {/* Import mode selector: Replace or Merge */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 block">
              Como deseja aplicar estes dados?
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                onClick={() => setImportMode('replace')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  importMode === 'replace'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'replace'}
                  onChange={() => setImportMode('replace')}
                  className="mt-0.5"
                />
                <div>
                  <strong className="block">Substituir Tudo (Recomendado para restauração)</strong>
                  <span className="text-[11px] text-slate-500">
                    Substitui o banco de dados atual pelas informações exatas do arquivo de backup.
                  </span>
                </div>
              </label>

              <label
                onClick={() => setImportMode('merge')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                  importMode === 'merge'
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 font-semibold'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="importMode"
                  checked={importMode === 'merge'}
                  onChange={() => setImportMode('merge')}
                  className="mt-0.5"
                />
                <div>
                  <strong className="block">Mesclar com Registros Atuais</strong>
                  <span className="text-[11px] text-slate-500">
                    Mantém o que já existe e acrescenta os itens novos do arquivo sem duplicação de IDs.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Confirmation action */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setImportPreview(null)}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirmImport}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 active:scale-95"
            >
              Confirmar Restauração
            </button>
          </div>
        </div>
      )}

      {/* Danger Zone: Factory Reset */}
      <div className="p-6 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">
              Zona de Redefinição (Limpar Dados Locais)
            </h3>
            <p className="text-xs text-rose-600/80 dark:text-rose-300/80 leading-relaxed">
              Apaga todos os dados personalizados salvos no navegador e restaura a grade de exemplo padrão inicial.
            </p>
          </div>

          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors"
          >
            Redefinir Dados
          </button>
        </div>
      </div>

      {/* Modal: Confirm Reset */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-rose-200 dark:border-rose-900/60 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Tem certeza que deseja redefinir?
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Todos os seus conteúdos, tarefas, cronômetros, flashcards e notas locais serão substituídos pelos registros de exemplo iniciais. Certifique-se de que exportou um backup se desejar guardá-los.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Sim, Limpar e Redefinir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
