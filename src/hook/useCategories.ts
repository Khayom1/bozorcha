// src/hooks/useCategories.ts
import { useQuery } from '@tanstack/react-query'
import { supabaseAdmin } from '@/lib/supabase/client'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabaseAdmin
        .from('inventory')
        .select('category')
        .not('category', 'is', null)

      if (error) throw error
      
      // Гирифтани категорияҳои уникалӣ
      const categories = [...new Set(data.map(item => item.category))]
      return categories.sort()
    },
  })
}
