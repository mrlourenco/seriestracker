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

function withoutTMDBId(data: SeriesInsert | SeriesUpdate) {
  // Allows the app to keep working before the optional DB migration is applied.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { tmdb_id, ...rest } = data
  return rest
}

function isMissingTMDBIdColumn(error: unknown) {
  if (typeof error !== 'object' || error === null) return false
  const e = error as Record<string, unknown>
  // Postgres error code 42703 = undefined_column; also verify it mentions tmdb_id
  // to avoid swallowing unrelated undefined-column errors on the same table.
  return (
    e.code === '42703' &&
    typeof e.message === 'string' &&
    e.message.toLowerCase().includes('tmdb_id')
  )
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
      if (error) throw error
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

    const payload = { ...data, user_id: user.id }
    const { error } = await supabase.from('series').insert(payload)

    if (error) {
      if (!isMissingTMDBIdColumn(error)) throw error
      const { error: retryError } = await supabase.from('series').insert({ ...withoutTMDBId(data), user_id: user.id })
      if (retryError) throw retryError
    }

    await fetchSeries()
  }

  const updateSeries = async (id: string, data: SeriesUpdate) => {
    const { error } = await supabase.from('series').update(data).eq('id', id)
    if (error) {
      if (!isMissingTMDBIdColumn(error)) throw error
      const { error: retryError } = await supabase.from('series').update(withoutTMDBId(data)).eq('id', id)
      if (retryError) throw retryError
    }
    await fetchSeries()
  }

  const deleteSeries = async (id: string) => {
    const { error } = await supabase.from('series').delete().eq('id', id)
    if (error) throw error
    await fetchSeries()
  }

  const getById = async (id: string): Promise<Series | null> => {
    const { data, error } = await supabase.from('series').select('*').eq('id', id).single()
    if (error) return null
    return data
  }

  return { series, loading, error, addSeries, updateSeries, deleteSeries, getById, refetch: fetchSeries }
}
