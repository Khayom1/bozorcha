// src/lib/supabase/types.ts
export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: {
          id: string
          name: string
          price: number
          stock: number
          category: string
          image_url: string | null
          status: 'active' | 'out_of_stock' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['inventory']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['inventory']['Row']>
      }
      orders: {
        Row: {
          id: string
          created_at: string
          customer_info: {
            name: string
            phone: string
            address?: string
          }
          total_amount: number
          status: 'pending' | 'completed' | 'cancelled'
          items: Array<{
            product_id: string
            name: string
            quantity: number
            price: number
          }>
        }
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['orders']['Row']>
      }
    }
  }
}
