import { TMDB_IMG } from '../hooks/useTMDB'
import type { TMDBShow } from '../hooks/useTMDB'

interface Props {
  show: TMDBShow
  onClose: () => void
  onAdd: (show: TMDBShow) => void
}

export default function TMDBShowModal({ show, onClose, onAdd }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 p-4 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start gap-3">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wide">Detalhe</p>
            <h2 className="text-xl font-bold text-slate-100">{show.name}</h2>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary px-3 py-1">Fechar</button>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-shrink-0 w-32 h-48 bg-slate-800 rounded-xl overflow-hidden">
            {show.poster_path ? (
              <img src={`${TMDB_IMG}/w500${show.poster_path}`} alt={show.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">📺</div>
            )}
          </div>

          <div className="flex-1 min-w-0 space-y-2">
            {show.first_air_date && <p className="text-sm text-slate-400">Ano: {show.first_air_date.slice(0, 4)}</p>}
            {show.vote_average > 0 && <p className="text-sm text-yellow-400">⭐ {show.vote_average.toFixed(1)}</p>}
            <a
              href={`https://www.themoviedb.org/tv/${show.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand-400 hover:underline inline-block"
            >
              Abrir no TMDB
            </a>
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Sinopse</p>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">
            {show.overview || 'Sem sinopse disponível em português.'}
          </p>
        </div>

        <button type="button" onClick={() => onAdd(show)} className="btn-primary w-full">
          Adicionar à lista
        </button>
      </div>
    </div>
  )
}
