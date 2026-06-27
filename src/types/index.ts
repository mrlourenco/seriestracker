export type SeriesStatus = 'watching' | 'completed' | 'want_to_watch' | 'dropped' | 'archived'
export type Platform = 'Netflix' | 'Max' | 'Disney+' | 'Prime' | 'Apple TV' | 'Outra'

export interface Series {
  id: string
  user_id: string
  title: string
  poster_url: string | null
  status: SeriesStatus
  platform: Platform | null
  current_season: number | null
  current_episode: number | null
  rating: number | null
  notes: string | null
  next_episode_date: string | null
  next_episode_season: number | null
  next_episode_number: number | null
  next_episode_title: string | null
  created_at: string
  updated_at: string
}

export type SeriesInsert = Omit<Series, 'id' | 'user_id' | 'created_at' | 'updated_at'>
export type SeriesUpdate = Partial<SeriesInsert>

export interface Profile {
  id: string
  email: string | null
  display_name: string | null
  avatar_url: string | null
  created_at: string
}

export interface ProfileShare {
  id: string
  owner_id: string
  viewer_id: string
  created_at: string
  owner?: Profile
  viewer?: Profile
}

export const STATUS_LABELS: Record<SeriesStatus, string> = {
  watching: 'A ver',
  completed: 'Terminada',
  want_to_watch: 'Para ver',
  dropped: 'Abandonada',
  archived: 'Arquivada',
}


export const PLATFORMS: Platform[] = ['Netflix', 'Max', 'Disney+', 'Prime', 'Apple TV', 'Outra']
export const STATUSES: SeriesStatus[] = ['watching', 'completed', 'want_to_watch', 'dropped', 'archived']
