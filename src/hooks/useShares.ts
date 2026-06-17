import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile, ProfileShare } from '../types'

export function useShares() {
  const [myShares, setMyShares] = useState<(ProfileShare & { viewer: Profile })[]>([])
  const [sharedWithMe, setSharedWithMe] = useState<(ProfileShare & { owner: Profile })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchShares = useCallback(async () => {
    setLoading(true)
    const [{ data: owned }, { data: received }] = await Promise.all([
      supabase
        .from('profile_shares')
        .select('*, viewer:profiles!profile_shares_viewer_id_fkey(*)')
        .order('created_at'),
      supabase
        .from('profile_shares')
        .select('*, owner:profiles!profile_shares_owner_id_fkey(*)')
        .eq('viewer_id', (await supabase.auth.getUser()).data.user?.id ?? '')
        .order('created_at'),
    ])
    setMyShares((owned ?? []) as (ProfileShare & { viewer: Profile })[])
    setSharedWithMe((received ?? []) as (ProfileShare & { owner: Profile })[])
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
    const { error } = await supabase
      .from('profile_shares')
      .insert({ viewer_id: profile.id })
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
