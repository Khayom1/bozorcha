import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Кэши оддӣ дар хотира
const cache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL = 60 * 1000 // 1 дақиқа
const MAX_CACHE_SIZE = 50

serve(async (req: Request) => {
  try {
    // CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(req.url)
    const search = url.searchParams.get('q')
    const category_id = url.searchParams.get('category_id')
    const min_price = url.searchParams.get('min_price')
    const max_price = url.searchParams.get('max_price')
    const seller_id = url.searchParams.get('seller_id')
    const sort_by = url.searchParams.get('sort_by') || 'relevance'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Сохтани калиди кэш аз параметрҳо
    const cacheKey = `${search}-${category_id}-${min_price}-${max_price}-${seller_id}-${sort_by}-${limit}-${offset}`
    
    // Санҷиши кэш
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Cache hit for:', cacheKey)
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'X-Cache': 'HIT',
        },
      })
    }

    console.log('Cache miss for:', cacheKey)

    // Тайёр кардани клиент
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}
    )

    // Даъвати функсияи SQL
    const { data, error } = await supabase.rpc('search_products', {
      p_search: search || null,
      p_category_id: category_id || null,
      p_min_price: min_price ? parseFloat(min_price) : null,
      p_max_price: max_price ? parseFloat(max_price) : null,
      p_seller_id: seller_id || null,
      p_sort_by: sort_by,
      p_limit: limit,
      p_offset: offset
    })

    if (error) {
      console.error('RPC error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Нигоҳ доштан дар кэш
    // Агар кэш аз ҳад зиёд шавад, кадимтаринро тоза мекунем
    if (cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = cache.keys().next().value
      cache.delete(oldestKey)
    }
    cache.set(cacheKey, { data, timestamp: Date.now() })

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    })

  } catch (err) {
    console.error('Internal error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
