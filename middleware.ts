import { type NextRequest, NextResponse } from 'next/server'

// Supabase auth middleware - temporarily disabled until @supabase/ssr is installed
// TODO: Re-enable when running `pnpm add @supabase/ssr @supabase/supabase-js`
export async function middleware(request: NextRequest) {
  // Pass through all requests for now
  return NextResponse.next()
  
  // Uncomment below when @supabase/ssr is installed:
  // try {
  //   const { updateSession } = await import('@/lib/supabase/proxy')
  //   return await updateSession(request)
  // } catch {
  //   return NextResponse.next()
  // }
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
