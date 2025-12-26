import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import Owner from '@/models/Owner';
import connectDB from '@/lib/mongodb';

export async function GET(req) {
      try {
            const { searchParams } = new URL(req.url);
            const code = searchParams.get('code');

            if (!code) {
                  return NextResponse.redirect(new URL('/?google=error', req.url));
            }

            // Use the same redirect_uri as in the auth request
            const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
                  `${new URL(req.url).origin}/api/auth/google/callback`;

            const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: new URLSearchParams({
                        code,
                        client_id: process.env.GOOGLE_CLIENT_ID,
                        client_secret: process.env.GOOGLE_CLIENT_SECRET,
                        redirect_uri: redirectUri,
                        grant_type: 'authorization_code',
                  }),
            });

            const tokenJson = await tokenRes.json();
            if (!tokenRes.ok) {
                  console.error('Token exchange error:', tokenJson);
                  return NextResponse.redirect(new URL('/?google=error', req.url));
            }

            // Decode the ID token
            const payload = JSON.parse(
                  Buffer.from(tokenJson.id_token.split('.')[1], 'base64').toString()
            );

            const email = payload.email;
            const name = payload.name || email.split('@')[0];
            const googleId = payload.sub;

            // Connect to database
            await connectDB();

            // Find or create owner
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

            // Generate JWT token
            if (!process.env.JWT_SECRET) {
                  console.error('JWT_SECRET not configured');
                  return NextResponse.redirect(new URL('/?google=error', req.url));
            }

            const token = jwt.sign(
                  { id: owner._id, email: owner.email },
                  process.env.JWT_SECRET,
                  { expiresIn: '7d' }
            );

            // Redirect to success page with token
            const redirectUrl = new URL('/auth/google-success', req.url);
            redirectUrl.searchParams.set('token', token);

            return NextResponse.redirect(redirectUrl);
      } catch (err) {
            console.error('Google callback error:', err);
            return NextResponse.redirect(new URL('/?google=error', req.url));
      }
}
