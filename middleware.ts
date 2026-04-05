import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Supabase session update - gracefully handle if @supabase/ssr not installed
  try {
    const { updateSession } = await import('@/lib/supabase/proxy')
    return await updateSession(request)
  } catch {
    // @supabase/ssr not installed yet, allow request to continue
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
