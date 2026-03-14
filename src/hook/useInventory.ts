// src/hooks/useInventory.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabaseAdmin } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Inventory = Database['public']['Tables']['inventory']['Row']

export function useInventory() {
  const queryClient = useQueryClient()

  const { data: inventory, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Inventory[]
    },
  })

  const updateInventory = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Inventory> & { id: string }) => {
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] })
    },
  })

  return {
    inventory,
    isLoading,
    updateInventory: updateInventory.mutate,
  }
}
