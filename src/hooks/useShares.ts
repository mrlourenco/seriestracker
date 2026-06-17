import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, ProfileShare } from '../types'

export function useShares() {
  const [myShares, setMyShares] = useState<(ProfileShare & { viewer: Profile })[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<(ProfileShare & { owner: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchShares = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const userId = user?.id ?? ''

    const [{ data: ownedRaw }, { data: receivedRaw }] = await Promise.all([
      supabase.from('profile_shares').select('*').eq('owner_id', userId).order('created_at'),
      supabase.from('profile_shares').select('*').eq('viewer_id', userId).order('created_at'),
    ])

    const profileIds = [
      ...(ownedRaw ?? []).map(s => s.viewer_id),
      ...(receivedRaw ?? []).map(s => s.owner_id),
    ]

    const { data: profiles } = profileIds.length > 0
      ? await supabase.from('profiles').select('*').in('id', profileIds)
      : { data: [] }

    const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

    setMyShares((ownedRaw ?? []).map(s => ({ ...s, viewer: profileMap[s.viewer_id] })) as (ProfileShare & { viewer: Profile })[])
    setSharedWithMe((receivedRaw ?? []).map(s => ({ ...s, owner: profileMap[s.owner_id] })) as (ProfileShare & { owner: Profile })[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchShares() }, [fetchShares])

  const addShare = async (viewerEmail: string) => {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', viewerEmail.toLowerCase().trim())
      .single()
    if (profileError || !profile) throw new Error('Utilizador não encontrado com esse email')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Não autenticado')
    const { error } = await supabase
      .from('profile_shares')
      .insert({ owner_id: user.id, viewer_id: profile.id })
    if (error) throw new Error(error.code === '23505' ? 'Já partilhas com este utilizador' : error.message)
    await fetchShares()
  }

  const removeShare = async (shareId: string) => {
    const { error } = await supabase.from('profile_shares').delete().eq('id', shareId)
    if (error) throw error
    await fetchShares()
  }

  return { myShares, sharedWithMe, loading, addShare, removeShare, refetch: fetchShares }
}
