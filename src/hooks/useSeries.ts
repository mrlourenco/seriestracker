import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Series, SeriesInsert, SeriesUpdate, SeriesStatus, Platform } from '../types'

interface Filters {
  status?: SeriesStatus
  platform?: Platform
  search?: string
  userId?: string | null  // null = auth not ready yet, skip fetch
  userIds?: string[]      // when set, fetches series for multiple users via .in()
}

function pgError(error: unknown): Error {
  if (error instanceof Error) return error
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const e = error as { message: unknown; code?: unknown; details?: unknown }
    const msg = String(e.message)
    const suffix = e.code ? ` [${e.code}]` : ''
    return new Error(msg + suffix)
  }
  return new Error(String(error))
}

function withoutColumns<T extends object>(data: T, ...keys: string[]): Partial<T> {
  const result = { ...data }
  for (const key of keys) delete (result as Record<string, unknown>)[key]
  return result
}


export function useSeries(filters: Filters = {}) {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const userIdsKey = filters.userIds?.join(',')

  const fetchSeries = useCallback(async () => {
    // Auth not ready: userIds empty (all-mode waiting) or userId null (single-mode waiting)
    if (filters.userIds !== undefined) {
      if (filters.userIds.length === 0) return
    } else {
      if (filters.userId === null) return
    }
    setLoading(true)
    setError(null)
    try {
      let query = supabase.from('series').select('*').order('updated_at', { ascending: false })
      if (filters.userIds) {
        query = query.in('user_id', filters.userIds)
      } else if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.platform) query = query.eq('platform', filters.platform)
      if (filters.search) query = query.ilike('title', `%${filters.search}%`)
      const { data, error } = await query
      if (error) throw pgError(error)
      setSeries(data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar séries')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.userId, filters.status, filters.platform, filters.search, userIdsKey])

  useEffect(() => { fetchSeries() }, [fetchSeries])

  const addSeries = async (data: SeriesInsert) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')

    const payload = { ...withoutColumns(data, 'tmdb_id'), user_id: user.id }
    const { error } = await supabase.from('series').insert(payload)
    if (error) throw pgError(error)

    await fetchSeries()
  }

  const updateSeries = async (id: string, data: SeriesUpdate) => {
    // Strip columns that only exist after optional migrations so that edits
    // work regardless of which schema version the user's DB is on.
    const safeData = withoutColumns(data as SeriesInsert, 'tmdb_id')
    const { error } = await supabase.from('series').update(safeData).eq('id', id)
    if (error) throw pgError(error)
    await fetchSeries()
  }

  const deleteSeries = async (id: string) => {
    const { error } = await supabase.from('series').delete().eq('id', id)
    if (error) throw pgError(error)
    await fetchSeries()
  }

  const getById = async (id: string): Promise<Series | null> => {
    const { data, error } = await supabase.from('series').select('*').eq('id', id).single()
    if (error) return null
    return data
  }

  return { series, loading, error, addSeries, updateSeries, deleteSeries, getById, refetch: fetchSeries }
}
