import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../api/supabase'
import { useAuth } from '../contexts/AuthContext'

interface UsageInfo {
  userCount: number
  userLimit: number
  userRemaining: number
  globalCount: number
  globalLimit: number
  globalRemaining: number
  allowed: boolean
  reason: 'ok' | 'user_limit' | 'global_limit'
  loading: boolean
}

const DEFAULT_USAGE: UsageInfo = {
  userCount: 0,
  userLimit: 20,
  userRemaining: 20,
  globalCount: 0,
  globalLimit: 500,
  globalRemaining: 500,
  allowed: true,
  reason: 'ok',
  loading: true,
}

export function useUsage() {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageInfo>(DEFAULT_USAGE)

  const refresh = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc('check_screening_limits', {
        p_user_id: user.id,
      })

      if (error) {
        console.error('Usage check failed:', error)
        // If the function doesn't exist yet (table not created), allow usage
        setUsage({ ...DEFAULT_USAGE, loading: false })
        return
      }

      setUsage({
        userCount: data.user_count,
        userLimit: data.user_limit,
        userRemaining: data.user_remaining,
        globalCount: data.global_count,
        globalLimit: data.global_limit,
        globalRemaining: data.global_remaining,
        allowed: data.allowed,
        reason: data.reason,
        loading: false,
      })
    } catch {
      // Tables might not exist yet — default to allowing
      setUsage({ ...DEFAULT_USAGE, loading: false })
    }
  }, [user])

  useEffect(() => {
    refresh()
  }, [refresh])

  const incrementAndCheck = useCallback(async (count: number = 1): Promise<{ allowed: boolean; reason: string }> => {
    if (!user) return { allowed: false, reason: 'not_authenticated' }

    // Check remaining before incrementing
    if (usage.userRemaining < count) {
      return { allowed: false, reason: 'user_limit' }
    }
    if (usage.globalRemaining < count) {
      return { allowed: false, reason: 'global_limit' }
    }

    // Increment one at a time (the DB function increments by 1)
    try {
      for (let i = 0; i < count; i++) {
        const { data, error } = await supabase.rpc('increment_screening_count', {
          p_user_id: user.id,
        })
        if (error || !data?.allowed) {
          await refresh()
          return {
            allowed: false,
            reason: data?.reason || 'limit_reached',
          }
        }
      }
      await refresh()
      return { allowed: true, reason: 'ok' }
    } catch {
      return { allowed: false, reason: 'error' }
    }
  }, [user, usage, refresh])

  return { usage, refresh, incrementAndCheck }
}
