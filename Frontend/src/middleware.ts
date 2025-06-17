import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/auth/callback'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Get current path
    const path = req.nextUrl.pathname;
    
    // Always refresh session to ensure it's valid and synced
    const {
      data: { session },
      error
    } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Middleware session refresh error:', error);
      // Fallback to getting existing session
      const fallback = await supabase.auth.getSession();
      if (fallback.error || !fallback.data.session) {
        // Clear any stale cookies
        res.cookies.delete('sb-access-token');
        res.cookies.delete('sb-refresh-token');
        
        // Redirect to login if not on public route
        if (!publicRoutes.includes(path)) {
          const redirectUrl = new URL('/login', req.url);
          redirectUrl.searchParams.set('redirectTo', path);
          return NextResponse.redirect(redirectUrl);
        }
        return res;
      }
    }

    console.log('Middleware - Path:', path, 'Has session:', !!session);

    // If user is signed in and trying to access auth pages, redirect to home
    if (session && (path === '/login' || path === '/register')) {
      console.log('Authenticated user accessing auth pages, redirecting');
      return NextResponse.redirect(new URL('/', req.url));
    }

    // If user is not signed in and trying to access protected routes
    if (!session && !publicRoutes.includes(path)) {
      console.log('Unauthenticated user accessing protected route');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Set proper headers to prevent caching of authenticated content
    res.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');
    
    // Add session info to response headers for debugging
    if (session) {
      res.headers.set('X-User-ID', session.user.id);
    }

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // Clear potentially corrupted cookies
    res.cookies.delete('sb-access-token');
    res.cookies.delete('sb-refresh-token');
    
    // Redirect to login for protected routes
    const path = req.nextUrl.pathname;
    if (!publicRoutes.includes(path)) {
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }
    
    return res;
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
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};