import React, { useState } from 'react';
import {
  Library,
  Search,
  Filter,
  Trash2,
  Edit2,
  Copy,
  Check,
  BookOpen,
  Calendar,
  X,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { AiMaterial, Subject } from '../types';
import { db } from '../services/storage';

interface AiLibraryViewProps {
  materials: AiMaterial[];
  subjects: Subject[];
  onRefreshData: () => void;
  onNavigateToTools: () => void;
}

export const AiLibraryView: React.FC<AiLibraryViewProps> = ({
  materials,
  subjects,
  onRefreshData,
  onNavigateToTools,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<AiMaterial | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Edit modal
  const [editingMaterial, setEditingMaterial] = useState<AiMaterial | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');
  const [editContent, setEditContent] = useState<string>('');

  const filteredMaterials = materials.filter((m) => {
    if (filterSubject !== 'all' && m.subjectId !== filterSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.content.toLowerCase().includes(q) ||
        m.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDelete = (id: string) => {
    db.deleteAiMaterial(id);
    if (selectedMaterial?.id === id) setSelectedMaterial(null);
    onRefreshData();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenEdit = (m: AiMaterial) => {
    setEditingMaterial(m);
    setEditTitle(m.title);
    setEditContent(m.content);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMaterial || !editTitle.trim()) return;

    editingMaterial.title = editTitle.trim();
    editingMaterial.content = editContent;
    db.saveAiMaterial(editingMaterial);

    if (selectedMaterial?.id === editingMaterial.id) {
      setSelectedMaterial({ ...editingMaterial });
    }

    setEditingMaterial(null);
    onRefreshData();
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Library className="w-3.5 h-3.5" />
            <span>Repositório de Sínteses e Artefatos</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Biblioteca IA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Seus resumos, mapas mentais, simulados e notas gerados salvos para consulta offline permanente.
          </p>
        </div>

        <button
          onClick={onNavigateToTools}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Criar Novo Material</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Pesquisar por título, palavras-chave ou texto (busca textual indexada)..."
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
        </div>
      </div>

      {/* Grid of Saved Materials */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMaterials.map((mat) => {
          const sub = subjects.find((s) => s.id === mat.subjectId);

          return (
            <div
              key={mat.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 transition-all group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white line-clamp-1 max-w-[150px]"
                    style={{ backgroundColor: sub?.color || '#2563eb' }}
                  >
                    {sub?.name || 'Geral'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(mat.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <h3
                  onClick={() => setSelectedMaterial(mat)}
                  className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-2"
                >
                  {mat.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                  {mat.content}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setSelectedMaterial(mat)}
                  className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Abrir completo</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(mat)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    title="Editar"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(mat.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredMaterials.length === 0 && (
          <div className="col-span-full p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400">
            <Library className="w-10 h-10 mx-auto mb-2 opacity-40 text-blue-500" />
            <p className="text-xs font-semibold">Nenhum material salvo na biblioteca.</p>
            <p className="text-[11px] text-slate-500 mt-1">
              Gere resumos e análises com IA e clique em "Salvar na Biblioteca".
            </p>
          </div>
        )}
      </div>

      {/* Reader Modal: Full Content */}
      {selectedMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                  Leitor StarStudy
                </span>
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {selectedMaterial.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedMaterial.content)}
                  className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                  title="Copiar texto"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {selectedMaterial.content}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Salvo em {new Date(selectedMaterial.createdAt).toLocaleDateString('pt-BR')}</span>
              <button
                onClick={() => setSelectedMaterial(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata / Content Modal */}
      {editingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Editar Material
              </h3>
              <button
                onClick={() => setEditingMaterial(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Conteúdo (Markdown / Texto)
                </label>
                <textarea
                  rows={8}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMaterial(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
