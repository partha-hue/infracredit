import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
      const url = new URL(request.url);

      const clientId = process.env.GOOGLE_CLIENT_ID
            ? process.env.GOOGLE_CLIENT_ID.trim()
            : '';
      const redirectUri = process.env.GOOGLE_REDIRECT_URI
            ? process.env.GOOGLE_REDIRECT_URI.trim()
            : '';

      if (!clientId || !redirectUri) {
            console.error('Google env vars missing in /api/auth/google', {
                  clientIdPresent: !!clientId,
                  redirectUri,
            });
            return NextResponse.redirect(new URL('/?google=error', request.url));
      }

      const googleAuthUrl = new URL(
            'https://accounts.google.com/o/oauth2/v2/auth',
      );

      googleAuthUrl.searchParams.set('client_id', clientId);
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri); // must match Google console + callback
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');

      return NextResponse.redirect(googleAuthUrl.toString());
}
