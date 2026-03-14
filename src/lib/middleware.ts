// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '')
  const validToken = process.env.ADMIN_SESSION_TOKEN

  if (!sessionToken || sessionToken !== validToken) {
    return new NextResponse(
      JSON.stringify({ error: 'Дастрасӣ рад карда шуд. Токени нодуруст.' }),
      { status: 401, headers: { 'content-type': 'application/json' } }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
