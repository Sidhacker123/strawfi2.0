import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/';

  console.log('Auth callback - Code:', !!code, 'RedirectTo:', redirectTo);

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        // Redirect to login with error
        const errorUrl = new URL('/login', requestUrl.origin);
        errorUrl.searchParams.set('error', 'Authentication failed');
        return NextResponse.redirect(errorUrl);
      }

      if (data.session) {
        console.log('Session created successfully for user:', data.user?.id);
        
        // If user has full_name in metadata, update profile
        if (data.user?.user_metadata?.full_name) {
          try {
            const { error: profileError } = await supabase
              .from('profiles')
              .update({ full_name: data.user.user_metadata.full_name })
              .eq('id', data.user.id);
            
            if (profileError) {
              console.error('Profile update error:', profileError);
            }
          } catch (profileErr) {
            console.error('Profile update failed:', profileErr);
          }
        }
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      const errorUrl = new URL('/login', requestUrl.origin);
      errorUrl.searchParams.set('error', 'Authentication failed');
      return NextResponse.redirect(errorUrl);
    }
  }

  // URL to redirect to after sign in process completes
  const redirectUrl = new URL(redirectTo, requestUrl.origin);
  console.log('Redirecting to:', redirectUrl.toString());
  
  return NextResponse.redirect(redirectUrl);
}