// src/app/api/export/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/client'

export async function GET() {
  try {
    // Санҷиши токен дар headers (middleware автоматикӣ санҷидааст)
    
    const { data: inventory, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .order('created_at', { ascending: false })

    if (inventoryError) throw inventoryError

    // Табдил ба CSV
    const headers = ['ID', 'Ном', 'Нарх', 'Захира', 'Категория', 'Статус', 'Сана']
    const rows = inventory.map(item => [
      item.id,
      item.name,
      item.price,
      item.stock,
      item.category,
      item.status,
      new Date(item.created_at).toLocaleDateString('tg-TJ')
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename=inventory.csv',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Хатогӣ ҳангоми содирот' },
      { status: 500 }
    )
  }
}
