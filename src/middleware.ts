import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/login']
const PROFESSOR_PATHS = ['/ingest', '/feedback']
const ADMIN_PATHS = ['/config']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) return NextResponse.next()

  const token = request.cookies.get('access_token')?.value
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString())
    const role = payload.role as string
    if (ADMIN_PATHS.some(p => pathname.startsWith(p)) && role !== 'admin') {
      return NextResponse.redirect(new URL('/chat', request.url))
    }
    if (PROFESSOR_PATHS.some(p => pathname.startsWith(p)) && !['professor', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/chat', request.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/chat', '/ingest', '/config', '/feedback'],
}
