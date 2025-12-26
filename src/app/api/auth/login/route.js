import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Owner from '@/models/Owner';
import connectDB from '@/lib/mongodb';

// Add this line to prevent static generation
export const dynamic = 'force-dynamic';

export async function POST(req) {
      try {
            /* ----------------- SAFETY CHECKS ----------------- */
            if (!process.env.JWT_SECRET) {
                  console.error('❌ JWT_SECRET missing');
                  return NextResponse.json(
                        { error: 'Server misconfiguration' },
                        { status: 500 }
                  );
            }

            await connectDB();

            const body = await req.json();
            const email = body?.email?.toLowerCase()?.trim();
            const password = body?.password;

            if (!email || !password) {
                  return NextResponse.json(
                        { error: 'Email and password required' },
                        { status: 400 }
                  );
            }

            /* ----------------- FIND OWNER ----------------- */
            const owner = await Owner.findOne({ email });

            if (!owner) {
                  return NextResponse.json(
                        { error: 'Invalid email or password' },
                        { status: 401 }
                  );
            }

            // Check if this is a Google OAuth account
            if (owner.provider === 'google' && !owner.passwordHash) {
                  return NextResponse.json(
                        { error: 'Please sign in with Google' },
                        { status: 401 }
                  );
            }

            if (!owner.passwordHash) {
                  console.error('❌ passwordHash missing in DB');
                  return NextResponse.json(
                        { error: 'Account setup error' },
                        { status: 500 }
                  );
            }

            /* ----------------- PASSWORD CHECK ----------------- */
            const isMatch = await bcrypt.compare(password, owner.passwordHash);
            if (!isMatch) {
                  return NextResponse.json(
                        { error: 'Invalid email or password' },
                        { status: 401 }
                  );
            }

            /* ----------------- JWT ----------------- */
            const token = jwt.sign(
                  {
                        id: owner._id.toString(),
                        email: owner.email,
                  },
                  process.env.JWT_SECRET,
                  { expiresIn: '7d' }
            );

            /* ----------------- SUCCESS ----------------- */
            return NextResponse.json({
                  success: true,
                  token,
                  owner: {
                        id: owner._id.toString(),
                        shopName: owner.shopName,
                        ownerName: owner.ownerName,
                        email: owner.email,
                  },
            });

      } catch (err) {
            console.error('❌ LOGIN ERROR:', err);
            return NextResponse.json(
                  { error: 'Internal server error' },
                  { status: 500 }
            );
      }
}
