import type { SeriesStatus } from '../types'

export const STATUS_BADGE: Record<SeriesStatus, { bg: string; color: string }> = {
  watching:      { bg: 'rgba(22,163,74,.15)',   color: '#4ade80' },
  want_to_watch: { bg: 'rgba(251,191,36,.12)',  color: '#fbbf24' },
  completed:     { bg: 'rgba(96,165,250,.12)',  color: '#60a5fa' },
  dropped:       { bg: 'rgba(248,113,113,.12)', color: '#f87171' },
  archived:      { bg: 'rgba(113,113,122,.12)', color: '#9ca3af' },
}
