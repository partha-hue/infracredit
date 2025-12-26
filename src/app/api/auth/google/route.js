import { NextResponse } from 'next/server';

export async function GET(request) {
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');

      // Use production URL for redirect_uri
      const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
            `${new URL(request.url).origin}/api/auth/google/callback`;

      googleAuthUrl.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID);
      googleAuthUrl.searchParams.append('redirect_uri', redirectUri);
      googleAuthUrl.searchParams.append('response_type', 'code');
      googleAuthUrl.searchParams.append('scope', 'email profile');
      googleAuthUrl.searchParams.append('access_type', 'offline');
      googleAuthUrl.searchParams.append('prompt', 'consent');

      return NextResponse.redirect(googleAuthUrl.toString());
}
