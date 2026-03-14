// src/hooks/useOrders.ts
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'
import { useEffect } from 'react'

type Order = Database['public']['Tables']['orders']['Row']

export function useOrders() {
  const queryClient = useQueryClient()

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Order[]
    },
  })

  // Realtime subscription
  useEffect(() => {
    const channel = supabaseAdmin
      .channel('orders-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          // Инвалидацияи кэш барои боргирии маълумоти нав
          queryClient.invalidateQueries({ queryKey: ['orders'] })
          
          // Барои боз ҳам зудтар, мо метавонем маълумотро мустақиман ба кэш илова кунем
          if (payload.eventType === 'INSERT') {
            queryClient.setQueryData(['orders'], (old: Order[] = []) => [
              payload.new as Order,
              ...old,
            ])
          }
        }
      )
      .subscribe()

    return () => {
      supabaseAdmin.removeChannel(channel)
    }
  }, [queryClient])

  return { orders, isLoading }
}
