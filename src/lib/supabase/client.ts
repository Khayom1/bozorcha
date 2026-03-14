// src/lib/supabase/client.ts
// Singleton pattern барои Supabase клиент
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

class SupabaseClientSingleton {
  private static instance: ReturnType<typeof createClient>
  private static adminInstance: ReturnType<typeof createClient>

  private constructor() {}

  public static getInstance() {
    if (!SupabaseClientSingleton.instance) {
      SupabaseClientSingleton.instance = createClient(supabaseUrl, supabaseAnonKey)
    }
    return SupabaseClientSingleton.instance
  }

  public static getAdminInstance() {
    if (!SupabaseClientSingleton.adminInstance) {
      SupabaseClientSingleton.adminInstance = createClient(supabaseUrl, supabaseServiceKey)
    }
    return SupabaseClientSingleton.adminInstance
  }
}

export const supabase = SupabaseClientSingleton.getInstance()
export const supabaseAdmin = SupabaseClientSingleton.getAdminInstance()
