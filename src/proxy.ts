import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { db } from './lib/db'
import { shortUrls } from './lib/db/schema'
import { eq } from 'drizzle-orm'

export async function proxy(req: NextRequest) {
  const id = req.nextUrl.pathname.split('/').pop()

  if (!id) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const result = await db
    .select()
    .from(shortUrls)
    .where(eq(shortUrls.id, id))
    .limit(1)

  if (result.length > 0 && result[0].url) {
    return NextResponse.redirect(result[0].url)
  }

  return NextResponse.redirect(new URL('/', req.url))
}

export const config = {
  matcher: '/s/:path*',
}
