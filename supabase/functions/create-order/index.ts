import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    // Санҷиши CORS барои дархостҳои OPTIONS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Танҳо POST-ро қабул мекунем
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Гирифтани токен аз сарлавҳа
    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Эҷоди клиенти Supabase бо токени корбар
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    // Санҷиши корбар
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Хондани body
    const { items, shipping_address, notes } = await req.json()
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'Items array is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Даъвати функсияи SQL
    const { data, error } = await supabase.rpc('create_order_with_items', {
      p_buyer_id: user.id,
      p_items: JSON.stringify(items),
      p_shipping_address: shipping_address || null,
      p_notes: notes || null
    })

    if (error) {
      console.error('RPC error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Баргардонидани натиҷа
    return new Response(JSON.stringify(data), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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


import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    // CORS барои OPTIONS
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    // Танҳо GET
    if (req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Гирифтани параметрҳо аз URL
    const url = new URL(req.url)
    const search = url.searchParams.get('q')
    const category_id = url.searchParams.get('category_id')
    const min_price = url.searchParams.get('min_price')
    const max_price = url.searchParams.get('max_price')
    const seller_id = url.searchParams.get('seller_id')
    const sort_by = url.searchParams.get('sort_by') || 'relevance'
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Тайёр кардани клиент (барои RLS, агар лозим бошад, токенро гирем)
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

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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



import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
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

    const token = req.headers.get('Authorization')?.replace('Bearer ', '')
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    )

    // Гирифтани корбар аз auth
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Гирифтани профил аз ҷадвали profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ user, profile }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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



import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    // Санҷиши амният: метавонед токени махсусро аз сарлавҳа санҷед
    // Масалан, агар провайдери пардохт токени махфӣ фиристад, онро тафтиш кунед
    const authHeader = req.headers.get('Authorization')
    if (authHeader !== `Bearer ${Deno.env.get('WEBHOOK_SECRET')}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Хондани body
    const payload = await req.json()
    
    // Фарз мекунем, ки провайдер чунин сохтор мефиристад:
    // { order_id: "...", status: "success", payment_method: "...", ... }
    const { order_id, status, payment_method, ...providerData } = payload

    if (!order_id || status !== 'success') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Барои амалиёти махфӣ, клиентро бо service_role месозем
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Даъвати complete_order
    const { data, error } = await supabase.rpc('complete_order', {
      p_order_id: order_id,
      p_payment_method: payment_method || 'unknown',
      p_provider_data: providerData
    })

    if (error) {
      console.error('RPC error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
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
