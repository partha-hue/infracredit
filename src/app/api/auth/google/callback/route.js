import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Owner from '@/models/Owner';
import connectDB from '@/lib/mongodb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
      try {
            const url = new URL(request.url);
            const code = url.searchParams.get('code');

            if (!code) {
                  return NextResponse.redirect(new URL('/?google=error', request.url));
            }

            const redirectUri = process.env.GOOGLE_REDIRECT_URI
                  ? process.env.GOOGLE_REDIRECT_URI.trim()
                  : '';
            const clientId = process.env.GOOGLE_CLIENT_ID
                  ? process.env.GOOGLE_CLIENT_ID.trim()
                  : '';
            const clientSecret = process.env.GOOGLE_CLIENT_SECRET
                  ? process.env.GOOGLE_CLIENT_SECRET.trim()
                  : '';

            if (!redirectUri || !clientId || !clientSecret) {
                  console.error('Google env vars missing', {
                        redirectUri,
                        clientIdPresent: !!clientId,
                        clientSecretPresent: !!clientSecret,
                  });
                  return NextResponse.redirect(new URL('/?google=error', request.url));
            }

            // 1) Exchange code for tokens
            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                        code,
                        client_id: clientId,
                        client_secret: clientSecret,
                        redirect_uri: redirectUri,
                        grant_type: 'authorization_code',
                  }),
            });

            const tokenJson = await tokenRes.json();

            if (!tokenRes.ok) {
                  console.error('Token exchange error:', tokenJson, { redirectUri });
                  return NextResponse.redirect(new URL('/?google=error', request.url));
            }

            if (!tokenJson.id_token) {
                  console.error('No id_token in Google response:', tokenJson);
                  return NextResponse.redirect(new URL('/?google=error', request.url));
            }

            // 2) Decode id_token
            const payload = JSON.parse(
                  Buffer.from(tokenJson.id_token.split('.')[1], 'base64').toString(),
            );

            const email = payload.email;
            const name = payload.name || email.split('@')[0];
            const googleId = payload.sub;

            // 3) Upsert owner
            await connectDB();

            let owner = await Owner.findOne({ email });
            if (!owner) {
                  owner = await Owner.create({
                        ownerName: name,
                        shopName: `${name}'s Shop`,
                        email,
                        provider: 'google',
                        googleId,
                  });
            }

            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                  console.error('JWT_SECRET not configured');
                  return NextResponse.redirect(new URL('/?google=error', request.url));
            }

            // 4) Issue app token
            const token = jwt.sign(
                  { id: owner._id, email: owner.email },
                  jwtSecret,
                  { expiresIn: '7d' },
            );

            const redirectUrl = new URL('/auth/google-success', request.url);
            redirectUrl.searchParams.set('token', token);

            return NextResponse.redirect(redirectUrl);
      } catch (err) {
            console.error('Google callback error:', err);
            return NextResponse.redirect(new URL('/?google=error', request.url));
      }
}
