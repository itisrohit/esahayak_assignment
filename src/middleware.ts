import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  // https://supabase.com/docs/guides/auth/server-side/nextjs#managing-sessions
  await supabase.auth.getUser()

  // Protected routes that require authentication
  const protectedPaths = ['/authenticated']
  
  const isProtectedRoute = protectedPaths.some((path) => 
    request.nextUrl.pathname.startsWith(path)
  )

  const { data: { user } } = await supabase.auth.getUser()

  // If accessing a protected route without a session, redirect to login
  if (isProtectedRoute && !user) {
    // Redirect to login page
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If accessing login page while already authenticated, redirect to dashboard
  if (request.nextUrl.pathname === '/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/authenticated/buyers'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}