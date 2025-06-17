import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of public routes that don't require authentication
const publicRoutes = ['/', '/login', '/register', '/auth/callback'];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Refresh session if expired - required for Server Components
    const {
      data: { session },
      error
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Middleware session error:', error);
    }

    // Get the current path
    const path = req.nextUrl.pathname;

    console.log('Middleware - Path:', path, 'Has session:', !!session);

    // If user is signed in and trying to access login/register pages, redirect to home
    if (session && (path === '/login' || path === '/register')) {
      console.log('Authenticated user accessing auth pages, redirecting to home');
      return NextResponse.redirect(new URL('/', req.url));
    }

    // If user is not signed in and trying to access protected routes, redirect to login
    if (!session && !publicRoutes.includes(path)) {
      console.log('Unauthenticated user accessing protected route, redirecting to login');
      const redirectUrl = new URL('/login', req.url);
      redirectUrl.searchParams.set('redirectTo', path);
      return NextResponse.redirect(redirectUrl);
    }

    // Set cache control headers for better performance with auth
    res.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.headers.set('Pragma', 'no-cache');
    res.headers.set('Expires', '0');

    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    
    // On error, allow access to public routes but redirect protected routes to login
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
     * - api routes that don't need auth
     */
    '/((?!_next/static|_next/image|favicon.ico|public/|api/health).*)',
  ],
};