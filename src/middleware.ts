import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const PUBLIC_ROUTES = ['/', '/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password']
const API_PUBLIC = ['/api/jarvis/chat', '/api/webhooks']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public routes and static assets
  if (
    PUBLIC_ROUTES.some(r => pathname === r) ||
    API_PUBLIC.some(r => pathname.startsWith(r)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Check auth token from cookie
  const token = req.cookies.get('sb-access-token')?.value

  if (!token) {
    // Redirect to login preserving the intended destination
    const loginUrl = new URL('/auth/login', req.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Validate token with Supabase
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      const loginUrl = new URL('/auth/login', req.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Add user info to headers for downstream use
    const res = NextResponse.next()
    res.headers.set('x-user-id', user.id)
    res.headers.set('x-user-role', user.user_metadata?.role || 'agency')
    return res
  } catch {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: ['/dashboard/:path*', '/onboarding/:path*', '/admin/:path*', '/api/jarvis/:path*', '/api/financial/:path*', '/api/skills/:path*', '/api/social/:path*']
}
