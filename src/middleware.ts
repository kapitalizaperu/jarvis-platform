import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
const API_PUBLIC = ['/api/jarvis/chat', '/api/webhooks']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    PUBLIC_ROUTES.some(r => pathname === r) ||
    API_PUBLIC.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/pricing') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('sb-access-token')?.value

  if (!token) {
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/admin/:path*']
}
