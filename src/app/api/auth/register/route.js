import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Owner from '@/models/Owner';
import connectDB from '@/lib/mongodb';

// Add this line to prevent static generation
export const dynamic = 'force-dynamic';

export async function POST(req) {
      try {
            await connectDB();

            const { shopName, ownerName, email, password } = await req.json();

            /* ---------- Validation ---------- */
            if (!shopName || !ownerName || !email || !password) {
                  return NextResponse.json(
                        { error: 'All fields are required' },
                        { status: 400 }
                  );
            }

            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                  return NextResponse.json(
                        { error: 'Invalid email format' },
                        { status: 400 }
                  );
            }

            // Password strength validation
            if (password.length < 6) {
                  return NextResponse.json(
                        { error: 'Password must be at least 6 characters' },
                        { status: 400 }
                  );
            }

            const normalizedEmail = email.toLowerCase().trim();

            /* ---------- Check Existing Owner ---------- */
            const existingOwner = await Owner.findOne({ email: normalizedEmail });
            if (existingOwner) {
                  return NextResponse.json(
                        { error: 'Email already registered' },
                        { status: 409 }
                  );
            }

            /* ---------- Hash Password ---------- */
            const passwordHash = await bcrypt.hash(password, 10);

            /* ---------- Create Owner ---------- */
            const owner = await Owner.create({
                  shopName: shopName.trim(),
                  ownerName: ownerName.trim(),
                  email: normalizedEmail,
                  passwordHash,
                  provider: 'local',
            });

            return NextResponse.json(
                  {
                        success: true,
                        ownerId: owner._id,
                        message: 'Registration successful! Please login.',
                  },
                  { status: 201 }
            );
      } catch (err) {
            console.error('REGISTER ERROR:', err);

            // Handle MongoDB duplicate key error
            if (err.code === 11000) {
                  return NextResponse.json(
                        { error: 'Email already registered' },
                        { status: 409 }
                  );
            }

            return NextResponse.json(
                  { error: 'Internal server error' },
                  { status: 500 }
            );
      }
}
