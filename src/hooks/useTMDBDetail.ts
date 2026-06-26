import { TMDB_IMG, searchTMDBShow } from './useTMDB'
import type { TMDBShow } from './useTMDB'

export interface TMDBPerson {
  id: number
  name: string
  character: string
  profile_path: string | null
}

export interface TMDBShowDetail extends TMDBShow {
  backdrop_path: string | null
  episode_run_time: number[]
  genres: { id: number; name: string }[]
  homepage: string | null
  last_air_date: string | null
  networks: { id: number; name: string; logo_path: string | null }[]
  number_of_episodes: number
  number_of_seasons: number
  origin_country: string[]
  original_language: string
  status: string
  type: string
  credits?: { cast: TMDBPerson[] }
}

function getTMDBApiKey() {
  return import.meta.env.VITE_TMDB_API_KEY as string | undefined
}

export function tmdbImage(path: string | null | undefined, size = 'w500') {
  return path ? `${TMDB_IMG}/${size}${path}` : null
}

export async function fetchTMDBShowDetail(tmdbId: number, signal?: AbortSignal): Promise<TMDBShowDetail | null> {
  const apiKey = getTMDBApiKey()
  if (!apiKey || !tmdbId) return null

  const url =
    `https://api.themoviedb.org/3/tv/${tmdbId}?api_key=${apiKey}` +
    `&language=pt-PT&append_to_response=credits`

  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error(`Erro TMDB: ${response.status}`)

  return await response.json() as TMDBShowDetail
}

export async function resolveTMDBShowDetail(
  title: string,
  signal?: AbortSignal,
  tmdbId?: number | null,
  posterUrl?: string | null,
): Promise<TMDBShowDetail | null> {
  if (tmdbId) return fetchTMDBShowDetail(tmdbId, signal)

  const show = await searchTMDBShow(title, signal, posterUrl)
  if (!show) return null

  return fetchTMDBShowDetail(show.id, signal)
}
