import React, { useState } from 'react';
import {
  Video,
  Play,
  Plus,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle2,
  X,
  BookOpen
} from 'lucide-react';
import { StudyVideo, Subject } from '../types';
import { db } from '../services/storage';

interface StudyVideosViewProps {
  videos: StudyVideo[];
  subjects: Subject[];
  onRefreshData: () => void;
}

export const StudyVideosView: React.FC<StudyVideosViewProps> = ({
  videos,
  subjects,
  onRefreshData,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [activeVideo, setActiveVideo] = useState<StudyVideo | null>(null);

  // New video modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [videoTitle, setVideoTitle] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoDesc, setVideoDesc] = useState<string>('');
  const [videoSubjectId, setVideoSubjectId] = useState<string>(subjects[0]?.id || '');
  const [videoDuration, setVideoDuration] = useState<number>(20);

  // Extract YouTube ID safely
  const getYouTubeEmbedUrl = (url: string): string | null => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      if (match && match[2].length === 11) {
        return `https://www.youtube.com/embed/${match[2]}`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoTitle.trim() || !videoUrl.trim()) return;

    const isYt = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

    const newVideo: StudyVideo = {
      id: `vid-${Date.now()}`,
      title: videoTitle.trim(),
      description: videoDesc.trim() || undefined,
      subjectId: videoSubjectId,
      url: videoUrl.trim(),
      platform: isYt ? 'youtube' : 'external',
      durationMinutes: videoDuration,
      watched: false,
      createdAt: new Date().toISOString(),
    };

    db.saveVideo(newVideo);
    db.addXP(20);
    setIsModalOpen(false);
    setVideoTitle('');
    setVideoUrl('');
    setVideoDesc('');
    onRefreshData();
  };

  const handleToggleWatched = (video: StudyVideo) => {
    video.watched = !video.watched;
    db.saveVideo(video);
    if (video.watched) db.addXP(30);
    onRefreshData();
  };

  const handleDeleteVideo = (id: string) => {
    db.deleteVideo(id);
    if (activeVideo?.id === id) setActiveVideo(null);
    onRefreshData();
  };

  const filteredVideos = videos.filter((v) => {
    if (filterSubject !== 'all' && v.subjectId !== filterSubject) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        (v.description && v.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Video className="w-3.5 h-3.5" />
            <span>Videoteca e Aulas Curadas</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Vídeos de Estudo
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize videoaulas e animações didáticas do YouTube por matéria sem distrações.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Vídeo</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-1 items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar vídeos por título ou descrição..."
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

      {/* Active Video Player Modal / Embed */}
      {activeVideo && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-blue-600 uppercase">
                Reproduzindo Agora
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {activeVideo.title}
              </h3>
            </div>
            <button
              onClick={() => setActiveVideo(null)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-md">
            {getYouTubeEmbedUrl(activeVideo.url) ? (
              <iframe
                src={getYouTubeEmbedUrl(activeVideo.url)!}
                title={activeVideo.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-white p-6 text-center space-y-3">
                <p className="text-sm">Link externo:</p>
                <a
                  href={activeVideo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <span>Abrir em nova aba</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVideos.map((vid) => {
          const sub = subjects.find((s) => s.id === vid.subjectId);

          return (
            <div
              key={vid.id}
              className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs flex flex-col justify-between space-y-3 ${
                vid.watched
                  ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/10'
                  : 'border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md text-white line-clamp-1 max-w-[150px]"
                    style={{ backgroundColor: sub?.color || '#2563eb' }}
                  >
                    {sub?.name || 'Geral'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {vid.durationMinutes} min
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                  {vid.title}
                </h3>

                {vid.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {vid.description}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setActiveVideo(vid)}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Assistir</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleWatched(vid)}
                    className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${
                      vid.watched
                        ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950'
                        : 'text-slate-500 hover:text-emerald-600'
                    }`}
                  >
                    {vid.watched ? '✓ Assistido' : 'Concluir'}
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(vid.id)}
                    className="p-1 text-slate-400 hover:text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredVideos.length === 0 && (
          <div className="col-span-full p-12 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
            Nenhum vídeo cadastrado.
          </div>
        )}
      </div>

      {/* Modal: Cadastrar Vídeo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Cadastrar Vídeo de Estudo
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVideo} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Título da Aula / Vídeo *
                </label>
                <input
                  type="text"
                  required
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  placeholder="Ex: Visualização Intuitiva de Árvores AVL"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  URL do Vídeo (YouTube ou link) *
                </label>
                <input
                  type="url"
                  required
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Disciplina
                  </label>
                  <select
                    value={videoSubjectId}
                    onChange={(e) => setVideoSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Duração Estimada (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={videoDuration}
                    onChange={(e) => setVideoDuration(Number(e.target.value) || 20)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Descrição ou Pontos Principais
                </label>
                <textarea
                  rows={2}
                  value={videoDesc}
                  onChange={(e) => setVideoDesc(e.target.value)}
                  placeholder="O que essa aula ensina e por que vale a pena assistir..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Salvar Vídeo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
