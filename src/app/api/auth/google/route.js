import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
      const url = new URL(request.url);
      const origin = url.origin; // https://infracredit-seven.vercel.app in production

      const redirectUriEnv = process.env.GOOGLE_REDIRECT_URI;
      const redirectUri = redirectUriEnv && redirectUriEnv.trim().length > 0
            ? redirectUriEnv
            : `${origin}/api/auth/google/callback`;

      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

      googleAuthUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
      googleAuthUrl.searchParams.set('response_type', 'code');
      googleAuthUrl.searchParams.set('scope', 'openid email profile');
      googleAuthUrl.searchParams.set('access_type', 'offline');
      googleAuthUrl.searchParams.set('prompt', 'consent');

      return NextResponse.redirect(googleAuthUrl.toString());
}
