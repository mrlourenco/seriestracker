import { createClient } from '@supabase/supabase-js'
import type { Series } from '../types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      series: {
        Row: Series
        Insert: Omit<Series, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Series, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
