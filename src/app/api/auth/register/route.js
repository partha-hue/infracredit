import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Owner from '@/models/Owner';
import connectDB from '@/lib/mongodb';

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

            const normalizedEmail = email.toLowerCase();

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
                  shopName,
                  ownerName,
                  email: normalizedEmail,
                  passwordHash, // must match schema
                  provider: 'local',
            });

            return NextResponse.json(
                  {
                        success: true,
                        ownerId: owner._id,
                  },
                  { status: 201 }
            );
      } catch (err) {
            console.error('REGISTER ERROR:', err);
            return NextResponse.json(
                  { error: 'Internal server error' },
                  { status: 500 }
            );
      }
}
